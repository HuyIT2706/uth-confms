// apps/conference-service/src/assignments/assignments.service.ts
import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assignment, AssignmentStatus } from './entities/assignment.entity';
import { AssignReviewersDto } from './dto/assign-reviewers.dto';
import { ConferencesService } from '../conferences/conferences.service';
import { InvitationsService } from '../invitations/invitations.service';
import { AiService } from '../ai/ai.service';
import { AuditService } from '../audit/audit.service';
import { SubmissionsClient } from '../integrations/submissions.client';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AssignmentsService {
  private readonly logger = new Logger(AssignmentsService.name);

  constructor(
    @InjectRepository(Assignment)
    private assignmentRepo: Repository<Assignment>,
    private conferencesService: ConferencesService,
    private aiService: AiService,
    private auditService: AuditService,
    private submissionsClient: SubmissionsClient,
    private httpService: HttpService,
    private invitationsService: InvitationsService,
  ) {}

  /**
   * Lấy tất cả assignments của một hội nghị (dành cho Chair)
   */
  async findAllByConference(conferenceId: string, chairId: number): Promise<Assignment[]> {
    const conference = await this.conferencesService.findOne(conferenceId);
    if (!conference) {
      throw new NotFoundException('Conference not found');
    }
    if (conference.chairId !== chairId) {
      throw new ForbiddenException('Only chair can view assignments');
    }

    return this.assignmentRepo.find({ where: { conferenceId } });
  }

  /**
   * Kiểm tra xem user có phải là chair của hội nghị này không
   */
  async canChairSuggest(userId: number, conferenceId: string): Promise<boolean> {
    try {
      const conference = await this.conferencesService.findOne(conferenceId);
      if (!conference) return false;
      return conference.chairId === userId;
    } catch {
      return false;
    }
  }

  /**
   * Lấy danh sách reviewer từ Identity Service (hoặc fallback mock)
   */
  private async getReviewers(conferenceId: string): Promise<{ id: number; topics: string[] }[]> {
    // Prefer reviewers who have accepted invitation for this conference (and their declared topics)
    try {
      const accepted = await this.invitationsService.getAcceptedReviewers(conferenceId, /* chairId not needed */ null as any);
      if (Array.isArray(accepted) && accepted.length > 0) {
        return accepted.map((a: any) => ({ id: a.userId, topics: a.topics || [] }));
      }
    } catch (err) {
      // Ignore and fallback to identity service
      this.auditService?.log?.('WARN', 0, 'AssignmentsService', `Failed to fetch accepted reviewers: ${err.message}`);
    }

    // Fallback: query identity service for all reviewers and their profile topics
    try {
      const url = `${process.env.IDENTITY_SERVICE_URL || 'http://identity-service:3001'}/api/users?role=REVIEWER`;
      const { data } = await firstValueFrom(this.httpService.get(url));
      return data.map((user: any) => ({ id: user.id, topics: user.topics || [] }));
    } catch (error) {
      console.error('Error fetching reviewers from Identity Service:', error.message || error);
      // Fallback mock data cho môi trường dev/test
      return [
        { id: 2, topics: ['AI', 'Machine Learning', 'Deep Learning'] },
        { id: 3, topics: ['Natural Language Processing', 'AI Ethics'] },
        { id: 5, topics: ['Computer Vision', 'Image Processing'] },
      ];
    }
  }

  /**
   * Gợi ý reviewer phù hợp cho một topic trong hội nghị cụ thể
   */
  async suggestReviewersForTopic(
    conferenceId: string,
    topic: string,
    limit: number = 5,
    currentChairId?: number, // optional: để kiểm tra quyền trong service nếu cần
  ): Promise<Assignment[]> {
    if (!conferenceId) {
      throw new BadRequestException('conferenceId is required for suggestion');
    }

    const conference = await this.conferencesService.findOne(conferenceId);
    if (!conference) {
      throw new NotFoundException(`Conference with ID ${conferenceId} not found`);
    }

    // Kiểm tra quyền nếu truyền currentChairId
    if (currentChairId && conference.chairId !== currentChairId) {
      throw new ForbiddenException('Only chair of this conference can suggest reviewers');
    }

    const reviewers = await this.getReviewers(conferenceId);
    if (reviewers.length === 0) {
      throw new BadRequestException('No reviewers available at the moment');
    }

    const matchTopics = [
      topic.trim().toLowerCase(),
      ...(conference.topics?.map(t => t.trim().toLowerCase()) || []),
    ].filter(Boolean);

    if (matchTopics.length === 0) {
      throw new BadRequestException('No topics available for matching');
    }

    let suggestions: { reviewerId: number; similarityScore: number; reason: string }[] = [];

    if (conference.aiConfig?.keywordSuggestion) {
      const context = matchTopics.join(', ');
      suggestions = await this.aiService.suggestReviewers(context, reviewers, limit);
    } else {
      // Fallback: Jaccard similarity
      suggestions = reviewers
        .map(rev => {
          const revTopics = (rev.topics || []).map(t => t.trim().toLowerCase());
          const intersection = matchTopics.filter(mt => revTopics.includes(mt));
          const union = new Set([...matchTopics, ...revTopics]);
          const score = union.size > 0 ? intersection.length / union.size : 0;

          return {
            reviewerId: rev.id,
            similarityScore: score,
            reason:
              intersection.length > 0
                ? `Khớp ${intersection.length} topic: ${intersection.join(', ')}`
                : 'Không có topic trùng khớp',
          };
        })
        .filter(s => s.similarityScore > 0.05)
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, limit);
    }

    const assignments: Assignment[] = [];

    for (const sug of suggestions) {
      const exists = await this.assignmentRepo.findOne({
        where: {
          conferenceId,
          topic,
          reviewerId: sug.reviewerId,
          status: AssignmentStatus.SUGGESTED,
        },
      });

      if (!exists) {
        const assignment = this.assignmentRepo.create({
          topic,
          reviewerId: sug.reviewerId,
          conferenceId,
          status: AssignmentStatus.SUGGESTED,
          similarityScore: Number(sug.similarityScore.toFixed(4)),
          suggestionReason: sug.reason,
          hasCoi: false,
        });
        assignments.push(await this.assignmentRepo.save(assignment));
      }
    }

    await this.auditService.log(
      'SUGGEST_REVIEWERS_FOR_TOPIC',
      conference.chairId,
      'Conference-Topic',
      `${conferenceId} | ${topic}`,
    );

    return assignments;
  }

  /**
   * Phân công thủ công reviewer cho một topic
   */
  async assignReviewersToTopic(dto: AssignReviewersDto, chairId: number): Promise<Assignment[]> {
    const conference = await this.conferencesService.findOne(dto.conferenceId);
    if (!conference) throw new NotFoundException('Conference not found');
    if (conference.chairId !== chairId) throw new ForbiddenException('Only chair can assign');

    const conferenceTopics = conference.topics?.map(t => t.toLowerCase().trim()) || [];
    const reviewers = await this.getReviewers(dto.conferenceId);

    const requestedTopics = dto.topic
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    if (requestedTopics.length === 0) {
      throw new BadRequestException('topic is required');
    }

    const assignments: Assignment[] = [];

    for (const reviewerId of dto.reviewerIds) {
      const reviewer = reviewers.find(r => r.id === reviewerId);
      if (!reviewer) {
        throw new BadRequestException(`Invalid reviewer ID: ${reviewerId}`);
      }

      const revTopics = (reviewer.topics || []).map(t => t.toLowerCase().trim());

      // Ensure reviewer matches at least one conference topic (if conference has topics)
      const overlap = conferenceTopics.filter(ct => revTopics.includes(ct)).length;
      if (overlap === 0 && conferenceTopics.length > 0) {
        throw new BadRequestException(`Reviewer ${reviewerId} không match bất kỳ topic nào của hội nghị`);
      }

      // For each requested topic (can be comma-separated), create separate assignment
      for (const t of requestedTopics) {
        const topicNorm = t.toLowerCase().trim();

        // If conference has topics, ensure requested topic exists in conference
        if (conferenceTopics.length > 0 && !conferenceTopics.includes(topicNorm)) {
          throw new BadRequestException(`Topic '${t}' không tồn tại trong hội nghị`);
        }

        // Optionally ensure reviewer has this topic in their declared topics
        if (revTopics.length > 0 && !revTopics.includes(topicNorm)) {
          throw new BadRequestException(`Reviewer ${reviewerId} không match topic '${t}'`);
        }

        const existing = await this.assignmentRepo.findOne({
          where: {
            topic: t,
            reviewerId,
            conferenceId: dto.conferenceId,
          },
        });

        if (existing) {
          throw new BadRequestException(`Reviewer ${reviewerId} đã được phân công cho topic '${t}'`);
        }

        const assignment = this.assignmentRepo.create({
          topic: t,
          reviewerId,
          conferenceId: conference.id,
          status: AssignmentStatus.ASSIGNED,
          similarityScore: 0,
          suggestionReason: 'Manual assignment by chair',
          hasCoi: false,
          assignedAt: new Date(),
        });

        const saved = await this.assignmentRepo.save(assignment);
        assignments.push(saved);

        // Notify review-service about this assignment so reviewer receives it
        try {
          const reviewBase = process.env.REVIEW_SERVICE_URL || 'http://review-service:3004/api';
          const notifyUrl = `${reviewBase}/internal/assignments`;
          const payload = {
            id: saved.id, // external authoritative id from conference-service
            conferenceAssignmentId: saved.id,
            submissionId: `topic:${saved.topic}`,
            topic: saved.topic,
            reviewerId: saved.reviewerId,
            conferenceId: saved.conferenceId,
            assignedBy: chairId,
            assignedAt: saved.assignedAt,
            status: saved.status,
            similarityScore: saved.similarityScore,
            suggestionReason: saved.suggestionReason,
            hasCoi: saved.hasCoi,
          };

          // fire-and-forget, don't block chair action on notify failure
          this.httpService.post(notifyUrl, payload).toPromise().catch(err => {
            this.logger.error(`Failed to notify review-service: ${err.message}`, err.stack);
            this.auditService?.log?.('WARN', chairId, 'AssignmentsService', `Failed to notify review-service: ${err.message}`);
          });
          this.logger.log(`Notifying review-service about assignment ${saved.id} to ${notifyUrl}`);
        } catch (err) {
            this.logger.error(`Notify exception: ${err.message}`, err.stack);
          this.auditService?.log?.('WARN', chairId, 'AssignmentsService', `Notify exception: ${err.message}`);
        }
      }
    }

    await this.auditService.log('ASSIGN_REVIEWERS_TO_TOPIC', chairId, 'Topic', dto.topic);
    return assignments;
  }

  /**
   * Hủy phân công một assignment cụ thể
   */
  async unassign(assignmentId: string, chairId: number): Promise<{ message: string }> {
    const assignment = await this.assignmentRepo.findOne({ where: { id: assignmentId } });
    if (!assignment) throw new NotFoundException('Assignment not found');

    const conference = await this.conferencesService.findOne(assignment.conferenceId);
    if (!conference) throw new NotFoundException('Conference not found');
    if (conference.chairId !== chairId) throw new ForbiddenException('Only chair can unassign');

    await this.assignmentRepo.remove(assignment);

    // Notify review-service to delete the assignment
    try {
      const reviewBase = process.env.REVIEW_SERVICE_URL || 'http://review-service:3004/api';
      const notifyUrl = `${reviewBase}/internal/assignments/${assignmentId}/delete`;
      const secret = process.env.REVIEWER_SERVICE_SECRET || '';
      
      // fire-and-forget, don't block chair action on notify failure
      this.httpService.post(notifyUrl, {}, { headers: secret ? { 'x-service-secret': secret } : {} }).toPromise().catch(err => {
        this.auditService?.log?.('WARN', chairId, 'AssignmentsService', `Failed to notify review-service to delete assignment: ${err.message}`);
      });
    } catch (err) {
      this.auditService?.log?.('WARN', chairId, 'AssignmentsService', `Notify delete exception: ${err.message}`);
    }

    await this.auditService.log('UNASSIGN_REVIEWER', chairId, 'Assignment', assignmentId);

    return { message: 'Reviewer unassigned successfully' };
  }

  /**
   * INTERNAL: find assignments by reviewer id
   */
  async findByReviewer(reviewerId: number) {
    return this.assignmentRepo.find({ where: { reviewerId } });
  }

  /**
   * INTERNAL: mark an assignment accepted by reviewer
   */
  async markAccepted(assignmentId: string, reviewerId: number) {
    const a = await this.assignmentRepo.findOne({ where: { id: assignmentId } as any });
    if (!a) return null;
    if (a.reviewerId !== Number(reviewerId)) return null;
    a.status = AssignmentStatus.ASSIGNED;
    await this.assignmentRepo.save(a);
    await this.auditService.log('ASSIGNMENT_ACCEPTED', reviewerId, 'Assignment', assignmentId);
    return a;
  }

  /**
   * INTERNAL: mark an assignment declined by reviewer
   */
  async markDeclined(assignmentId: string, reviewerId: number) {
    const a = await this.assignmentRepo.findOne({ where: { id: assignmentId } as any });
    if (!a) return null;
    if (a.reviewerId !== Number(reviewerId)) return null;
    a.status = AssignmentStatus.DECLINED;
    await this.assignmentRepo.save(a);
    await this.auditService.log('ASSIGNMENT_DECLINED', reviewerId, 'Assignment', assignmentId);
    return a;
  }
}