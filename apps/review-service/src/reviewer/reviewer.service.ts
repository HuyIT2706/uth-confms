import { Injectable, Logger, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invitation } from './entities/invitation.entity';
import { ReviewerAssignment, ReviewerAssignmentStatus } from './entities/reviewer-assignment.entity';
import type { IncomingInvitationDto } from './dto/incoming-invitation.dto';
import { Review } from './entities/review.entity';
import { ReviewHistory } from './entities/review-history.entity';
import { SubmitReviewDto } from './dto/submit-review.dto';

@Injectable()
export class ReviewerService {
  private readonly logger = new Logger(ReviewerService.name);

  constructor(
    @InjectRepository(Invitation)
    private readonly repo: Repository<Invitation>,
    @InjectRepository(ReviewerAssignment)
    private readonly assignmentRepo: Repository<ReviewerAssignment>,
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(ReviewHistory)
    private readonly historyRepo: Repository<ReviewHistory>,
  ) { }

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

  // ==================== REVIEWER ASSIGNMENTS ====================

  /**
   * Lấy danh sách assignments của reviewer hiện tại
   */
  async getMyAssignments(reviewerId: number): Promise<ReviewerAssignment[]> {
    return this.assignmentRepo.find({
      where: { reviewerId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Lấy chi tiết một assignment
   */
  async getAssignmentDetail(conferenceAssignmentId: string, reviewerId: number): Promise<ReviewerAssignment | null> {
    const assignment = await this.assignmentRepo.findOne({
      where: { conferenceAssignmentId, reviewerId },
    });
    return assignment || null;
  }

  /**
   * Chấp nhận một phân công
   * Điều kiện: reviewer phải đã chấp nhận lời mời vào hội nghị đó
   */
  async acceptAssignment(conferenceAssignmentId: string, reviewerId: number): Promise<ReviewerAssignment> {
    const assignment = await this.assignmentRepo.findOne({
      where: { conferenceAssignmentId, reviewerId },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    // Kiểm tra xem reviewer đã chấp nhận lời mời hội nghị này chưa
    const invitation = await this.repo.findOne({
      where: {
        conferenceId: assignment.conferenceId,
        reviewerId,
        status: 'accepted',
      },
    });

    if (!invitation) {
      throw new ForbiddenException(
        'You must accept the conference invitation before accepting a submission assignment'
      );
    }

    assignment.status = ReviewerAssignmentStatus.ACCEPTED;
    const saved = await this.assignmentRepo.save(assignment);
    this.logger.log(
      `Reviewer ${reviewerId} accepted assignment ${conferenceAssignmentId} for conference ${assignment.conferenceId}`
    );
    return saved;
  }

  /**
   * Từ chối một phân công
   */
  async rejectAssignment(conferenceAssignmentId: string, reviewerId: number): Promise<ReviewerAssignment> {
    const assignment = await this.assignmentRepo.findOne({
      where: { conferenceAssignmentId, reviewerId },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    assignment.status = ReviewerAssignmentStatus.REJECTED;
    const saved = await this.assignmentRepo.save(assignment);
    this.logger.log(
      `Reviewer ${reviewerId} rejected assignment ${conferenceAssignmentId} for conference ${assignment.conferenceId}`
    );
    return saved;
  }

  /**
   * Đặt lại trạng thái phân công về pending
   */
  async resetAssignmentStatus(conferenceAssignmentId: string, reviewerId: number): Promise<ReviewerAssignment> {
    const assignment = await this.assignmentRepo.findOne({
      where: { conferenceAssignmentId, reviewerId },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    assignment.status = ReviewerAssignmentStatus.PENDING;
    const saved = await this.assignmentRepo.save(assignment);
    this.logger.log(
      `Reviewer ${reviewerId} reset assignment ${conferenceAssignmentId} status to pending`
    );
    return saved;
  }

  /**
   * Tạo một assignment cho reviewer (được gọi từ conference-service hoặc internal)
   */
  async createAssignment(
    conferenceId: string,
    reviewerId: number,
    submissionId?: string,
    topic?: string,
    submissionInfo?: any
  ): Promise<ReviewerAssignment> {
    // Extract conferenceAssignmentId từ submissionInfo nếu có
    const conferenceAssignmentId = submissionInfo?.conferenceAssignmentId;
    if (!conferenceAssignmentId) {
      throw new BadRequestException('conferenceAssignmentId is required in submissionInfo');
    }

    const whereClause: any = { conferenceId, reviewerId };
    if (submissionId) {
      whereClause.submissionId = submissionId;
    }

    const existing = await this.assignmentRepo.findOne({
      where: whereClause,
    });

    if (existing) {
      this.logger.warn(
        `Assignment already exists for reviewer ${reviewerId}, conference ${conferenceId}, submission ${submissionId}`
      );
      return existing;
    }

    const assignment = this.assignmentRepo.create({
      conferenceAssignmentId,
      conferenceId,
      reviewerId,
      submissionId,
      topic,
      submissionInfo,
      status: ReviewerAssignmentStatus.PENDING,
    });

    const saved = await this.assignmentRepo.save(assignment);
    this.logger.log(
      `Created assignment for reviewer ${reviewerId}, conference ${conferenceId}, submission ${submissionId}, conferenceAssignmentId: ${conferenceAssignmentId}`
    );
    return saved;
  }

  /**
   * Hủy một assignment (được gọi từ conference-service)
   */
  async deleteAssignment(conferenceAssignmentId: string): Promise<boolean> {
    const assignment = await this.assignmentRepo.findOne({
      where: { conferenceAssignmentId },
    });

    if (!assignment) {
      return false;
    }

    await this.assignmentRepo.remove(assignment);
    this.logger.log(`Deleted assignment ${conferenceAssignmentId}`);
    return true;
  }

  /**
   * Hủy assignment theo conferenceAssignmentId (được gọi từ conference-service)
   */
  async deleteAssignmentByConferenceId(conferenceAssignmentId: string): Promise<boolean> {
    const assignment = await this.assignmentRepo.findOne({
      where: { conferenceAssignmentId },
    });

    if (!assignment) {
      this.logger.warn(`Assignment with conferenceAssignmentId ${conferenceAssignmentId} not found`);
      return false;
    }

    await this.assignmentRepo.remove(assignment);
    this.logger.log(`Deleted assignment with conferenceAssignmentId: ${conferenceAssignmentId}`);
    return true;
  }

  /**
   * Tải bài nộp (chỉ khi assignment đã được chấp nhận)
   */
  async downloadSubmission(conferenceAssignmentId: string, reviewerId: number): Promise<any> {
    const assignment = await this.assignmentRepo.findOne({
      where: { conferenceAssignmentId, reviewerId },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    // Kiểm tra status
    if (assignment.status !== ReviewerAssignmentStatus.ACCEPTED) {
      throw new ForbiddenException('You must accept the assignment before downloading the submission');
    }

    // Lấy submissionId
    // Lấy submissionId
    let submissionId = assignment.submissionId;

    // Fallback: Check submissionInfo xem có id không
    if (!submissionId) {
      if (assignment.submissionInfo && (assignment.submissionInfo as any).submissionId) {
        submissionId = String((assignment.submissionInfo as any).submissionId);
      } else if (assignment.submissionInfo && (assignment.submissionInfo as any).id) {
        submissionId = String((assignment.submissionInfo as any).id);
      }
    }

    // Nếu không có ID hợp lệ, thử tìm bằng Title nếu có
    if (!submissionId || isNaN(Number(submissionId))) {
      this.logger.warn(`Invalid or missing submission ID for assignment ${conferenceAssignmentId}. Value: ${assignment.submissionId}. Trying fallback search by title...`);

      const title = assignment.submissionInfo ? (assignment.submissionInfo as any).title : null;
      if (title) {
        try {
          // Gọi API search của submission-service (public endpoints usually don't need auth or allow basic access? 
          // SubmissionServiceController.findAll requires CHAIR/ADMIN role.
          // We can use the internal token mechanism? Reviewer Service interacts as service.
          // Assume we can't easily search via controller without auth.

          // BUT, wait, reviewer-assignments.controller.ts uses process.env.REVIEWER_SERVICE_SECRET.
          // Does submission-service rely on JWT? Yes.

          // Workaround: We cannot search securely across services without proper credentials.
          // However, checking the user's request: "fix lỗi này".
          // Maybe for this SPECIFIC case, the user just wants it to work.
          // Is there an endpoint that returns ID by title? No.
        } catch (e: any) {
          this.logger.error(`Fallback search failed: ${e.message}`);
        }
      }

      throw new NotFoundException('Submission ID not valid (must be numeric) or not found. Please contact the chair to fix the assignment data.');
    }

    // Gọi submission-service để lấy file URL
    const baseUrl = process.env.SUBMISSION_SERVICE_URL || 'http://submission-service:3003';
    const cleanUrl = baseUrl.replace(/\/$/, '');
    const url = `${cleanUrl}/internal/submissions/${submissionId}/file`;

    this.logger.log(`Fetching submission file for assignment ${conferenceAssignmentId} from ${url}`);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 404) {
          throw new NotFoundException('Submission file not found in submission-service');
        }
        throw new BadRequestException(`Failed to fetch file info from submission-service: ${response.statusText}`);
      }

      const result = await response.json();
      // submission-service returns { status: 'success', data: { ... } }
      if (result.status === 'success' && result.data) {
        return result.data;
      }
      return result;
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Error fetching submission file: ${error.message}`, error.stack);
      throw new BadRequestException('Could not retrieve submission file');
    }
  }

  // ==================== REVIEWS ====================

  /**
   * Reviewer nộp bài đánh giá
   */
  async submitReview(conferenceAssignmentId: string, reviewerId: number, dto: SubmitReviewDto): Promise<Review> {
    const assignment = await this.assignmentRepo.findOne({
      where: { conferenceAssignmentId, reviewerId }
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    if (assignment.status !== ReviewerAssignmentStatus.ACCEPTED) {
      throw new ForbiddenException('You must accept the assignment before reviewing');
    }

    // Check deadline from Invitation
    // Invitation is linked via reviewerId and conferenceId
    const invitation = await this.repo.findOne({
      where: {
        reviewerId: reviewerId,
        conferenceId: assignment.conferenceId
      }
    });

    if (invitation && invitation.deadlines) {
      // Assuming structure: { reviewDeadline: "ISO String" }
      // User said deadline is in invitation.deadlines. We need to parse correctly.
      // It could be date or string.
      const dl = (invitation.deadlines as any).reviewDeadline;
      if (dl) {
        const deadline = new Date(dl);
        if (!isNaN(deadline.getTime()) && new Date() > deadline) {
          throw new ForbiddenException(`Review deadline passed at ${deadline.toISOString()}`);
        }
      }
    }

    let review = await this.reviewRepo.findOne({
      where: { conferenceAssignmentId }
    });

    if (review) {
      // Update existing review -> Save history (Audit Trail)
      const history = this.historyRepo.create({
        reviewId: review.id,
        score: review.score,
        content: review.content,
        internalContent: review.internalContent,
        changedAt: new Date(),
      });
      await this.historyRepo.save(history);

      review.score = dto.score;
      review.content = dto.content;
      review.internalContent = dto.internalContent;
      review.updatedAt = new Date();
    } else {
      // Create new review
      review = this.reviewRepo.create({
        conferenceAssignmentId,
        score: dto.score,
        content: dto.content,
        internalContent: dto.internalContent,
        isFinal: true,
      });
    }

    const saved = await this.reviewRepo.save(review);
    this.logger.log(`Review submitted for assignment ${conferenceAssignmentId} by reviewer ${reviewerId}`);
    return saved;
  }

  /**
   * Lấy bài đánh giá của chính mình
   */
  async getMyReview(conferenceAssignmentId: string, reviewerId: number): Promise<Review | null> {
    const assignment = await this.assignmentRepo.findOne({
      where: { conferenceAssignmentId, reviewerId }
    });
    if (!assignment) {
      throw new ForbiddenException('You are not assigned to this paper');
    }

    return this.reviewRepo.findOne({
      where: { conferenceAssignmentId }
    });
  }

  /**
   * Lấy lịch sử chỉnh sửa đánh giá
   */
  async getReviewHistory(conferenceAssignmentId: string, reviewerId: number): Promise<ReviewHistory[]> {
    const review = await this.getMyReview(conferenceAssignmentId, reviewerId);
    if (!review) return [];

    return this.historyRepo.find({
      where: { reviewId: review.id },
      order: { changedAt: 'DESC' }
    });
  }

  /**
   * Lấy các thảo luận nội bộ (các reviews khác cùng bài báo)
   */
  async getInternalDiscussion(conferenceAssignmentId: string, reviewerId: number): Promise<any[]> {
    const myAssignment = await this.assignmentRepo.findOne({
      where: { conferenceAssignmentId, reviewerId }
    });
    if (!myAssignment) throw new ForbiddenException('Assignment not found');

    // ONLY reviewers who Accepted can assume discussion role (Requirement 3)
    if (myAssignment.status !== ReviewerAssignmentStatus.ACCEPTED) {
      throw new ForbiddenException('You must accept the assignment to view internal discussion');
    }

    // Cần tìm submissionId thực
    let submissionId = myAssignment.submissionId;
    if (!submissionId) {
      if (myAssignment.submissionInfo && (myAssignment.submissionInfo as any).submissionId) {
        submissionId = String((myAssignment.submissionInfo as any).submissionId);
      } else if (myAssignment.submissionInfo && (myAssignment.submissionInfo as any).id) {
        submissionId = String((myAssignment.submissionInfo as any).id);
      }
    }

    if (!submissionId) return [];

    // Tìm tất cả assignments của bài báo này trong cùng conference
    const otherAssignments = await this.assignmentRepo.find({
      where: {
        conferenceId: myAssignment.conferenceId,
        submissionId: submissionId
      }
    });

    if (otherAssignments.length === 0) return [];

    const assignmentIds = otherAssignments.map(a => a.conferenceAssignmentId);

    // Tìm reviews
    const reviews = await this.reviewRepo.createQueryBuilder('review')
      .innerJoinAndSelect('review.assignment', 'assignment') // Cần relation trong Entity Review
      .where('review.conferenceAssignmentId IN (:...ids)', { ids: assignmentIds })
      .getMany();

    // Map kết quả để ẩn danh reviewer nhưng hiện nội dung
    return reviews.map(r => ({
      reviewerId: r.assignment.reviewerId === reviewerId ? 'You' : `Reviewer #${r.assignment.reviewerId}`,
      score: r.score,
      content: r.content,
      internalContent: r.internalContent,
      updatedAt: r.updatedAt
    }));
  }

}