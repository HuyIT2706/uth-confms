import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invitation } from './entities/invitation.entity';
import type { IncomingInvitationDto } from './dto/incoming-invitation.dto';

@Injectable()
export class ReviewerService {
  private readonly logger = new Logger(ReviewerService.name);

  constructor(
    @InjectRepository(Invitation)
    private readonly repo: Repository<Invitation>,
  ) {}

  async createInvitation(payload: Partial<IncomingInvitationDto>): Promise<Invitation> {
    this.logger.log(`Creating invitation for reviewer ${payload.reviewerId}, conference ${payload.conferenceId}, externalId: ${payload.externalInvitationId}`);
    
    // Check if invitation with same externalInvitationId already exists
    let inv: Invitation | null = null;
    if (payload.externalInvitationId) {
      inv = await this.repo.findOne({ 
        where: { externalInvitationId: payload.externalInvitationId } 
      });
      if (inv) {
        this.logger.log(`Found existing invitation with externalInvitationId ${payload.externalInvitationId}, updating...`);
      }
    }

    if (inv) {
      // Update existing invitation
      inv.conferenceId = payload.conferenceId!;
      inv.conferenceName = payload.conferenceName;
      inv.acronym = payload.acronym;
      inv.conferenceDescription = payload.conferenceDescription;
      inv.startDate = payload.startDate;
      inv.endDate = payload.endDate;
      inv.topics = payload.topics;
      inv.deadlines = payload.deadlines;
      inv.chairId = payload.chairId;
      inv.reviewerId = payload.reviewerId!;
      inv.message = payload.message;
      inv.raw = payload.raw ?? null;
      // Reset to pending if it was previously accepted/rejected (re-invitation)
      if (inv.status !== 'pending') {
        inv.status = 'pending';
      }
    } else {
      // Create new invitation
      inv = this.repo.create({
        externalInvitationId: payload.externalInvitationId,
        conferenceId: payload.conferenceId!,
        conferenceName: payload.conferenceName,
        acronym: payload.acronym,
        conferenceDescription: payload.conferenceDescription,
        startDate: payload.startDate,
        endDate: payload.endDate,
        topics: payload.topics,
        deadlines: payload.deadlines,
        chairId: payload.chairId,
        reviewerId: payload.reviewerId!,
        message: payload.message,
        raw: payload.raw ?? null,
        status: 'pending',
      } as Partial<Invitation>);
    }
    
    const saved = await this.repo.save(inv);
    this.notifyExternal(saved).catch((e) => this.logger.warn(`Notify failed: ${e?.message || e}`));
    return saved;
  }

  async findByReviewer(reviewerId: number): Promise<Invitation[]> {
    return this.repo.find({ where: { reviewerId }, order: { createdAt: 'DESC' } });
  }

  async updateStatus(id: string, status: Invitation['status']): Promise<Invitation | null> {
    const inv = await this.repo.findOne({ where: [{ id }, { externalInvitationId: id }] });
    if (!inv) return null;
    inv.status = status;
    const saved = await this.repo.save(inv);
    this.notifyExternal(saved).catch((e) => this.logger.warn(`Notify failed: ${e?.message || e}`));
    return saved;
  }

  async updateTopics(id: string, topics: string[], reviewerId: number): Promise<Invitation | null> {
    const inv = await this.repo.findOne({ where: [{ id }, { externalInvitationId: id }] });
    if (!inv) return null;
    
    // Kiểm tra reviewer có quyền update không
    if (inv.reviewerId !== reviewerId) {
      throw new BadRequestException('You can only update your own invitation topics');
    }

    // Validate topics
    if (!Array.isArray(topics)) {
      throw new BadRequestException('Topics must be an array');
    }

    // Clean và validate topics
    const cleanTopics = [...new Set(topics.map(t => t.trim()).filter(t => t.length > 0))];
    
    inv.reviewerTopics = cleanTopics;
    const saved = await this.repo.save(inv);
    
    // Notify conference-service về topics update
    this.notifyTopicsUpdate(saved).catch((e) => this.logger.warn(`Notify topics update failed: ${e?.message || e}`));
    
    return saved;
  }

  async deleteByExternalId(externalInvitationId: string): Promise<boolean> {
    const inv = await this.repo.findOne({ where: { externalInvitationId } });
    if (!inv) return false;
    await this.repo.remove(inv);
    this.logger.log(`Deleted invitation with externalInvitationId: ${externalInvitationId}`);
    return true;
  }

  private async notifyExternal(inv: Invitation) {
    // Chỉ notify khi có externalInvitationId (invitation từ conference-service)
    if (!inv.externalInvitationId) {
      this.logger.debug(`Skipping notifyExternal - no externalInvitationId for invitation ${inv.id}`);
      return;
    }

    // Sử dụng CONFERENCE_SERVICE_URL từ env, mặc định là http://conference-service:3002/api
    // Lưu ý: URL đã có /api prefix trong docker-compose
    const baseUrl = process.env.CONFERENCE_SERVICE_URL || process.env.CONFERENCE_SERVICE_NOTIFY_URL || 'http://conference-service:3002/api';
    const cleanUrl = baseUrl.replace(/\/$/, '');
    
    // Gọi endpoint internal của conference-service để cập nhật status
    let notifyUrl: string;
    let method: string;
    
    if (inv.status === 'accepted') {
      notifyUrl = `${cleanUrl}/internal/invitations/${inv.externalInvitationId}/accept`;
      method = 'PATCH';
    } else if (inv.status === 'rejected') {
      notifyUrl = `${cleanUrl}/internal/invitations/${inv.externalInvitationId}/decline`;
      method = 'PATCH';
    } else {
      // pending hoặc các status khác không cần notify
      this.logger.debug(`Skipping notifyExternal - status ${inv.status} does not require notification`);
      return;
    }

    this.logger.log(`Notifying conference-service about invitation ${inv.externalInvitationId} status change to ${inv.status} at ${notifyUrl}`);
    
    try {
      const body: any = { userId: inv.reviewerId };
      
      // Nếu đang accept và có reviewerTopics, gửi kèm topics
      if (inv.status === 'accepted' && inv.reviewerTopics && inv.reviewerTopics.length > 0) {
        body.topics = inv.reviewerTopics;
      }

      const response = await fetch(notifyUrl, {
        method,
        headers: { 
          'content-type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.warn(`Failed to notify conference-service: ${response.status} ${response.statusText} - ${errorText}`);
      } else {
        const result = await response.json().catch(() => ({}));
        this.logger.log(`Successfully notified conference-service about invitation ${inv.externalInvitationId}: ${JSON.stringify(result)}`);
      }
    } catch (err: any) {
      this.logger.error(`Exception notifying conference-service: ${err.message}`, err.stack);
    }
  }

  private async notifyTopicsUpdate(inv: Invitation) {
    // Chỉ notify khi có externalInvitationId và invitation đã được accepted
    if (!inv.externalInvitationId || inv.status !== 'accepted') {
      this.logger.debug(`Skipping notifyTopicsUpdate - no externalInvitationId or status is not accepted`);
      return;
    }

    const baseUrl = process.env.CONFERENCE_SERVICE_URL || process.env.CONFERENCE_SERVICE_NOTIFY_URL || 'http://conference-service:3002/api';
    const cleanUrl = baseUrl.replace(/\/$/, '');
    const notifyUrl = `${cleanUrl}/internal/invitations/${inv.externalInvitationId}/topics`;

    this.logger.log(`Notifying conference-service about topics update for invitation ${inv.externalInvitationId} at ${notifyUrl}`);
    
    try {
      const response = await fetch(notifyUrl, {
        method: 'PATCH',
        headers: { 
          'content-type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: inv.reviewerId,
          topics: inv.reviewerTopics || [],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.warn(`Failed to notify conference-service about topics update: ${response.status} ${response.statusText} - ${errorText}`);
      } else {
        const result = await response.json().catch(() => ({}));
        this.logger.log(`Successfully notified conference-service about topics update for invitation ${inv.externalInvitationId}: ${JSON.stringify(result)}`);
      }
    } catch (err: any) {
      this.logger.error(`Exception notifying conference-service about topics update: ${err.message}`, err.stack);
    }
  }
}
