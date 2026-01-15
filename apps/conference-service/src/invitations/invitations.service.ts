// apps/conference-service/src/invitations/invitations.service.ts

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

import { Invitation, InvitationStatus } from './entities/invitation.entity';
import { EmailsService } from '../emails/emails.service';
import { ConferencesService } from '../conferences/conferences.service';
import { UsersClient } from '../users/users.client';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class InvitationsService {
  private readonly logger = new Logger(InvitationsService.name);

  constructor(
    @InjectRepository(Invitation)
    private readonly invitationRepo: Repository<Invitation>,

    private readonly emailsService: EmailsService,
    private readonly conferencesService: ConferencesService,
    private readonly usersClient: UsersClient,
    private readonly auditService: AuditService,
    private readonly httpService: HttpService,
  ) { }

  private async notifyReviewService(invitation: Invitation, conference: any, userId: number) {
    try {
      // Trong Docker network, review-service chạy ở port 3000 (không phải 3004)
      const reviewBase = process.env.REVIEW_SERVICE_URL || 'http://review-service:3000/api';
      const notifyUrl = `${reviewBase}/reviewer/invitations`;
      const payload = {
        externalInvitationId: invitation.id,
        conferenceId: conference.id,
        conferenceName: conference.name,
        acronym: conference.acronym,
        conferenceDescription: conference.description,
        startDate: conference.startDate ? new Date(conference.startDate).toISOString().split('T')[0] : undefined,
        endDate: conference.endDate ? new Date(conference.endDate).toISOString().split('T')[0] : undefined,
        topics: conference.topics || [],
        deadlines: conference.deadlines || {},
        reviewerId: userId,
        chairId: conference.chairId,
        message: undefined,
        raw: { conference, invitation },
      };

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const serviceSecret = process.env.REVIEWER_SERVICE_SECRET;
      if (serviceSecret) {
        headers['x-service-secret'] = serviceSecret;
      }

      this.logger.log(`Notifying review-service about invitation ${invitation.id} to reviewer ${userId} at ${notifyUrl}`);
      
      // fire-and-forget, don't block chair action on notify failure
      firstValueFrom(this.httpService.post(notifyUrl, payload, { headers }))
        .then(response => {
          this.logger.log(`Successfully notified review-service about invitation ${invitation.id}: ${JSON.stringify(response.data)}`);
        })
        .catch(err => {
          this.logger.error(`Failed to notify review-service about invitation ${invitation.id}: ${err.message}`, err.stack);
          if (err.response) {
            this.logger.error(`Response status: ${err.response.status}, data: ${JSON.stringify(err.response.data)}`);
          }
        });
    } catch (err) {
      this.logger.error(`Exception notifying review-service: ${err.message}`, err.stack);
    }
  }

  async inviteReviewer(conferenceId: string, userId: number, chairId: number) {
    const conference = await this.conferencesService.findOne(conferenceId);
    if (!conference) throw new NotFoundException('Conference not found');
    if (conference.chairId !== chairId) throw new ForbiddenException('Only chair can invite');

    const existing = await this.invitationRepo.findOne({ where: { conferenceId, userId } });

    if (existing) {
      // If invitation is still pending, just refresh invitedAt.
      if (existing.status === InvitationStatus.PENDING) {
        existing.invitedAt = new Date();
        await this.invitationRepo.save(existing);
        // Notify review-service about the re-invitation
        await this.notifyReviewService(existing, conference, userId);
        await this.auditService.log('RE_INVITE_REVIEWER', chairId, 'Invitation', existing.id, { userId });
        return { message: 'Re-invitation sent', invitationId: existing.id };
      }

      // If previously processed (accepted/declined), allow chair to re-invite by resetting to PENDING.
      existing.status = InvitationStatus.PENDING;
      existing.invitedAt = new Date();
      existing.acceptedAt = null;
      existing.declinedAt = null;
      existing.topics = [];
      existing.coiUserIds = [];
      existing.coiInstitutions = [];
      await this.invitationRepo.save(existing);
      // Notify review-service about the re-invitation
      await this.notifyReviewService(existing, conference, userId);
      await this.auditService.log('RE_INVITE_REVIEWER', chairId, 'Invitation', existing.id, { userId, reset: true });
      return { message: 'Re-invitation sent (reset)', invitationId: existing.id };
    }

    const invitation = this.invitationRepo.create({
      conferenceId,
      userId,
      status: InvitationStatus.PENDING,
      invitedAt: new Date(),
      topics: [],
      coiUserIds: [],
      coiInstitutions: [],
    });

    const saved = await this.invitationRepo.save(invitation);

    // Notify review-service about the invitation
    await this.notifyReviewService(saved, conference, userId);

    try {
      const userEmail = await this.usersClient.getUserEmail(userId);
      if (userEmail && userEmail !== 'unknown@author.example.com') {
        await this.emailsService.sendReviewerInvitationEmail(userEmail, {
          name: userEmail.split('@')[0],
          conferenceName: conference.name,
          acceptLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invitations/${saved.id}/accept`,
          declineLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invitations/${saved.id}/decline`,
          invitationId: saved.id,
          conferenceId,
        });
      }
    } catch (err) {
      this.logger.warn(`Could not send invitation email to user ${userId}: ${err.message}`);
    }

    await this.auditService.log('INVITE_REVIEWER', chairId, 'Invitation', saved.id, { userId, conferenceId });

    return { message: 'Invitation sent successfully', invitationId: saved.id };
  }

  async acceptInvitation(invitationId: string, userId?: number) {
    const invitation = await this.invitationRepo.findOne({
      where: { id: invitationId },
      relations: ['conference'],
    });
    if (!invitation) throw new NotFoundException('Invitation not found');

    const actingUserId = userId ?? invitation.userId;
    if (invitation.userId !== actingUserId) throw new ForbiddenException('Not your invitation');
    // Allow toggling: if already accepted, return success (idempotent).
    // If previously declined, allow moving back to ACCEPTED.
    if (invitation.status === InvitationStatus.ACCEPTED) {
      return { message: 'Already accepted. You are a reviewer.' };
    }

    // Move to accepted state (handles PENDING or previously DECLINED)
    invitation.status = InvitationStatus.ACCEPTED;
    invitation.acceptedAt = new Date();
    invitation.declinedAt = null;
    await this.invitationRepo.save(invitation);

    try {
      await this.usersClient.addRole(invitation.userId, 'REVIEWER');
      this.logger.log(`Role REVIEWER added to user ${invitation.userId}`);
    } catch (err) {
      this.logger.error(`Failed to add REVIEWER role to user ${invitation.userId}:`, err);
    }

    await this.auditService.log('ACCEPT_INVITATION', actingUserId, 'Invitation', invitationId);

    return { message: 'Accepted successfully. You are now a reviewer!' };
  }

  async declineInvitation(invitationId: string, userId?: number) {
    const invitation = await this.invitationRepo.findOne({ where: { id: invitationId } });
    if (!invitation) throw new NotFoundException('Invitation not found');

    const actingUserId = userId ?? invitation.userId;
    if (invitation.userId !== actingUserId) throw new ForbiddenException('Not your invitation');
    // Allow toggling: if already declined, return success (idempotent).
    // If previously accepted, allow moving to DECLINED (note: we intentionally
    // do not remove REVIEWER role here to avoid unexpected role changes).
    if (invitation.status === InvitationStatus.DECLINED) {
      return { message: 'Already declined' };
    }

    invitation.status = InvitationStatus.DECLINED;
    invitation.declinedAt = new Date();
    invitation.acceptedAt = null;
    await this.invitationRepo.save(invitation);

    await this.auditService.log('DECLINE_INVITATION', actingUserId, 'Invitation', invitationId);

    return { message: 'Invitation declined' };
  }

  async getAcceptedReviewers(conferenceId: string, chairId?: number) {
    const conference = await this.conferencesService.findOne(conferenceId);
    if (!conference) throw new NotFoundException('Conference not found');

    // If caller provided chairId, enforce chair-only access; otherwise allow internal usage
    if (chairId != null && conference.chairId !== chairId) throw new ForbiddenException('Only chair can view');

    const invitations = await this.invitationRepo.find({
      where: { conferenceId, status: InvitationStatus.ACCEPTED },
      order: { acceptedAt: 'DESC' },
    });

    return invitations.map(i => ({
      invitationId: i.id,
      userId: i.userId,
      acceptedAt: i.acceptedAt,
      topics: i.topics,
    }));
  }

  async getMyPendingInvitations(userId: number) {
    return this.invitationRepo.find({
      where: { userId, status: InvitationStatus.PENDING },
      relations: ['conference'],
      order: { invitedAt: 'DESC' },
    });
  }

  async removeInvitation(invitationId: string, chairId: number) {
    const invitation = await this.invitationRepo.findOne({
      where: { id: invitationId },
      relations: ['conference'],
    });
    if (!invitation) throw new NotFoundException('Invitation not found');
    if (invitation.conference.chairId !== chairId) throw new ForbiddenException('Only chair can remove');

    await this.invitationRepo.remove(invitation);
    await this.auditService.log('REMOVE_INVITATION', chairId, 'Invitation', invitationId);

    // Notify review-service về việc xóa invitation
    try {
      const reviewBase = process.env.REVIEW_SERVICE_URL || 'http://review-service:3000/api';
      const notifyUrl = `${reviewBase}/reviewer/invitations/external/${invitationId}`;
      
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const serviceSecret = process.env.REVIEWER_SERVICE_SECRET;
      if (serviceSecret) {
        headers['x-service-secret'] = serviceSecret;
      }

      this.logger.log(`Notifying review-service about invitation deletion ${invitationId} at ${notifyUrl}`);
      
      // fire-and-forget, don't block chair action on notify failure
      firstValueFrom(this.httpService.delete(notifyUrl, { headers }))
        .then(response => {
          this.logger.log(`Successfully notified review-service about invitation deletion ${invitationId}: ${JSON.stringify(response.data)}`);
        })
        .catch(err => {
          this.logger.warn(`Failed to notify review-service about invitation deletion ${invitationId}: ${err.message}`);
          if (err.response) {
            this.logger.warn(`Response status: ${err.response.status}, data: ${JSON.stringify(err.response.data)}`);
          }
        });
    } catch (err: any) {
      this.logger.warn(`Exception notifying review-service about deletion: ${err.message}`);
    }

    return { message: 'Invitation removed' };
  }

  async updateTopics(invitationId: string, topics: string[], userId?: number) {
    const invitation = await this.invitationRepo.findOne({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    const actingUserId = userId ?? invitation.userId;
    if (invitation.userId !== actingUserId) {
      throw new ForbiddenException('You can only update your own invitation topics');
    }

    if (invitation.status !== InvitationStatus.ACCEPTED) {
      throw new BadRequestException('Can only update topics after accepting the invitation');
    }

    if (!Array.isArray(topics)) {
      throw new BadRequestException('Topics must be an array');
    }

    if (topics.length > 20) {
      throw new BadRequestException('Maximum 20 topics allowed');
    }

    const uniqueTopics = [...new Set(topics.map(t => t.trim()).filter(t => t.length > 0))];

    invitation.topics = uniqueTopics;
    await this.invitationRepo.save(invitation);

    await this.auditService.log('UPDATE_INVITATION_TOPICS', actingUserId, 'Invitation', invitationId, { topics: uniqueTopics });

    return { message: 'Topics updated successfully', invitationId, topics: uniqueTopics };
  }

  async updateCoi(invitationId: string, coiUserIds: number[], coiInstitutions: string[], userId?: number) {
    const invitation = await this.invitationRepo.findOne({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    const actingUserId = userId ?? invitation.userId;
    if (invitation.userId !== actingUserId) {
      throw new ForbiddenException('You can only update your own invitation COI');
    }

    if (invitation.status !== InvitationStatus.ACCEPTED) {
      throw new BadRequestException('Can only update COI after accepting the invitation');
    }

    if (!Array.isArray(coiUserIds) || coiUserIds.some(id => !Number.isInteger(id))) {
      throw new BadRequestException('coiUserIds must be an array of integers');
    }

    if (!Array.isArray(coiInstitutions) || coiInstitutions.some(inst => typeof inst !== 'string' || inst.trim().length === 0)) {
      throw new BadRequestException('coiInstitutions must be an array of non-empty strings');
    }

    const uniqueCoiUserIds = [...new Set(coiUserIds)];
    const uniqueCoiInstitutions = [...new Set(coiInstitutions.map(inst => inst.trim()))];

    invitation.coiUserIds = uniqueCoiUserIds;
    invitation.coiInstitutions = uniqueCoiInstitutions;
    await this.invitationRepo.save(invitation);

    await this.auditService.log('UPDATE_INVITATION_COI', actingUserId, 'Invitation', invitationId, {
      coiUserIds: uniqueCoiUserIds,
      coiInstitutions: uniqueCoiInstitutions,
    });

    return {
      message: 'COI updated successfully',
      invitationId,
      coiUserIds: uniqueCoiUserIds,
      coiInstitutions: uniqueCoiInstitutions,
    };
  }
}