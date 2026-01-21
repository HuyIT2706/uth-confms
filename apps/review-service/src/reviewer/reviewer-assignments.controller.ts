import { Controller, Post, Body, Get, Req, UseGuards, Param, NotFoundException, BadRequestException, HttpCode, Headers, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, ApiForbiddenResponse, ApiNotFoundResponse, ApiExcludeEndpoint } from '@nestjs/swagger';
import { ReviewerService } from './reviewer.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReviewerAssignmentDto } from './dto/reviewer-assignment.dto';
import { SubmitReviewDto } from './dto/submit-review.dto';
import type { Request } from 'express';

@ApiTags('Reviewer Assignments')
@Controller('reviewer/assignments')
export class ReviewerAssignmentsController {
  constructor(private readonly reviewerService: ReviewerService) { }

  /**
   * Lấy danh sách bài báo được phân công cho reviewer hiện tại
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Lấy danh sách bài báo được phân công cho reviewer',
    description: 'Reviewer xem tất cả bài báo mà mình được phân công, kèm theo status (pending/accepted/rejected). Danh tính tác giả không được tiết lộ.'
  })
  @ApiResponse({ status: 200, description: 'Danh sách assignments' })
  async getMyAssignments(@Req() req: Request): Promise<ReviewerAssignmentDto[]> {
    const user = (req as any).user;
    if (!user) throw new BadRequestException('Token missing user info');
    const reviewerId = Number(user.sub ?? user.id ?? user.userId);
    if (!reviewerId || isNaN(reviewerId)) throw new BadRequestException('Token missing user info');

    return this.reviewerService.getMyAssignments(reviewerId) as any;
  }

  /**
   * Lấy chi tiết một assignment
   */
  @Get(':conferenceAssignmentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Lấy chi tiết một assignment',
  })
  @ApiParam({ name: 'conferenceAssignmentId', description: 'ID assignment từ conference-service', example: 'f2580139-07f3-4864-bba0-3a5f9a03170f' })
  @ApiResponse({ status: 200, description: 'Chi tiết assignment' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy assignment' })
  async getAssignmentDetail(@Req() req: Request, @Param('conferenceAssignmentId') conferenceAssignmentId: string): Promise<ReviewerAssignmentDto> {
    const user = (req as any).user;
    if (!user) throw new BadRequestException('Token missing user info');
    const reviewerId = Number(user.sub ?? user.id ?? user.userId);
    if (!reviewerId || isNaN(reviewerId)) throw new BadRequestException('Token missing user info');

    const assignment = await this.reviewerService.getAssignmentDetail(conferenceAssignmentId, reviewerId);
    if (!assignment) throw new NotFoundException('Assignment not found');
    return assignment as any;
  }

  /**
   * Chấp nhận một phân công
   * Điều kiện: reviewer phải đã chấp nhận lời mời vào hội nghị đó
   */
  @Post(':conferenceAssignmentId/accept')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Chấp nhận một bài báo được phân công',
    description: 'Reviewer chấp nhận phân công (status: pending → accepted). Điều kiện: phải đã chấp nhận lời mời vào hội nghị này.'
  })
  @ApiParam({ name: 'conferenceAssignmentId', description: 'ID assignment từ conference-service', example: 'f2580139-07f3-4864-bba0-3a5f9a03170f' })
  @ApiResponse({ status: 200, description: 'Assignment đã được chấp nhận' })
  @ApiForbiddenResponse({ description: 'Chưa chấp nhận lời mời hội nghị hoặc assignment không tồn tại' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy assignment' })
  async acceptAssignment(@Req() req: Request, @Param('conferenceAssignmentId') conferenceAssignmentId: string): Promise<ReviewerAssignmentDto> {
    const user = (req as any).user;
    if (!user) throw new BadRequestException('Token missing user info');
    const reviewerId = Number(user.sub ?? user.id ?? user.userId);
    if (!reviewerId || isNaN(reviewerId)) throw new BadRequestException('Token missing user info');

    try {
      const result = await this.reviewerService.acceptAssignment(conferenceAssignmentId, reviewerId) as any;
      return result;
    } catch (error: any) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error?.message || 'Failed to accept assignment');
    }
  }

  /**
   * Từ chối một phân công
   */
  @Post(':conferenceAssignmentId/reject')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Từ chối một bài báo được phân công',
    description: 'Reviewer từ chối phân công (status: pending → rejected)'
  })
  @ApiParam({ name: 'conferenceAssignmentId', description: 'ID assignment từ conference-service', example: 'f2580139-07f3-4864-bba0-3a5f9a03170f' })
  @ApiResponse({ status: 200, description: 'Assignment đã được từ chối' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy assignment' })
  async rejectAssignment(@Req() req: Request, @Param('conferenceAssignmentId') conferenceAssignmentId: string): Promise<ReviewerAssignmentDto> {
    const user = (req as any).user;
    if (!user) throw new BadRequestException('Token missing user info');
    const reviewerId = Number(user.sub ?? user.id ?? user.userId);
    if (!reviewerId || isNaN(reviewerId)) throw new BadRequestException('Token missing user info');

    return this.reviewerService.rejectAssignment(conferenceAssignmentId, reviewerId) as any;
  }

  /**
   * Đặt lại trạng thái phân công về pending
   */
  @Post(':conferenceAssignmentId/pending')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Đặt lại trạng thái assignment về pending',
    description: 'Reviewer đưa assignment về trạng thái pending (nếu trước đó đã từ chối hoặc chấp nhận)'
  })
  @ApiParam({ name: 'conferenceAssignmentId', description: 'ID assignment từ conference-service', example: 'f2580139-07f3-4864-bba0-3a5f9a03170f' })
  @ApiResponse({ status: 200, description: 'Assignment đã được đặt lại' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy assignment' })
  async resetAssignmentStatus(@Req() req: Request, @Param('conferenceAssignmentId') conferenceAssignmentId: string): Promise<ReviewerAssignmentDto> {
    const user = (req as any).user;
    if (!user) throw new BadRequestException('Token missing user info');
    const reviewerId = Number(user.sub ?? user.id ?? user.userId);
    if (!reviewerId || isNaN(reviewerId)) throw new BadRequestException('Token missing user info');

    return this.reviewerService.resetAssignmentStatus(conferenceAssignmentId, reviewerId) as any;
  }

  /**
   * Tải bài báo về (chỉ khi status = accepted)
   */
  @Get(':conferenceAssignmentId/download')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Lấy link tải bài báo',
    description: 'Chỉ cho phép tải khi reviewer đã chấp nhận phân công (status = accepted)'
  })
  @ApiParam({ name: 'conferenceAssignmentId', description: 'ID assignment' })
  @ApiResponse({ status: 200, description: 'Link tải bài báo', schema: { example: { url: "https://..." } } })
  @ApiForbiddenResponse({ description: 'Chưa chấp nhận phân công' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy assignment hoặc bài báo' })
  async downloadSubmission(@Req() req: Request, @Param('conferenceAssignmentId') conferenceAssignmentId: string) {
    const user = (req as any).user;
    if (!user) throw new BadRequestException('Token missing user info');
    const reviewerId = Number(user.sub ?? user.id ?? user.userId);
    if (!reviewerId || isNaN(reviewerId)) throw new BadRequestException('Token missing user info');

    return this.reviewerService.downloadSubmission(conferenceAssignmentId, reviewerId);
  }

  /**
   * Lấy danh sách submissions của một hội nghị
   * Được gọi khi reviewer chấp nhận một assignment và muốn xem danh sách các bài báo
   */
  @Get(':conferenceId/submissions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Lấy danh sách submissions của một hội nghị',
    description: 'Reviewer xem danh sách tất cả bài báo đã nộp cho hội nghị này. Thông tin tác giả không được tiết lộ.'
  })
  @ApiParam({ name: 'conferenceId', description: 'ID hội nghị', example: '23f82779-00f7-4a83-9750-337242611900' })
  @ApiResponse({ status: 200, description: 'Danh sách submissions' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy submissions' })
  async getSubmissionsByConference(@Param('conferenceId') conferenceId: string) {
    return this.reviewerService.getSubmissionsByConference(conferenceId);
  }

  /**
   * Service-to-service: Conference-service tạo assignment cho reviewer
   */
  @Post()
  @HttpCode(201)
  @ApiExcludeEndpoint()
  @ApiOperation({
    summary: 'Conference-service tạo assignment cho reviewer (service-to-service)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        conferenceId: { type: 'string', description: 'ID hội nghị', example: 'c2a65b80-fd67-474e-8390-895c76422f10' },
        reviewerId: { type: 'number', description: 'ID reviewer' },
        submissionId: { type: 'string', description: 'ID bài báo (optional)' },
        topic: { type: 'string', description: 'Topic của bài báo' },
        submissionInfo: { type: 'object', description: 'Thông tin bài báo (không bao gồm tác giả)' }
      },
      required: ['conferenceId', 'reviewerId']
    }
  })
  @ApiResponse({ status: 201, description: 'Assignment created' })
  async createAssignment(
    @Body() body: any,
    @Headers('x-service-secret') secret?: string
  ): Promise<ReviewerAssignmentDto> {
    const configured = process.env.REVIEWER_SERVICE_SECRET;
    if (configured && configured !== secret) {
      throw new BadRequestException('Invalid service secret');
    }

    return this.reviewerService.createAssignment(
      body.conferenceId,
      body.reviewerId,
      body.submissionId,
      body.topic,
      body.submissionInfo
    ) as any;
  }

  /**
   * Service-to-service: Conference-service xóa assignment
   */
  @Post(':id/delete')
  @ApiExcludeEndpoint()
  @ApiOperation({
    summary: 'Conference-service xóa assignment (service-to-service)',
  })
  @ApiParam({ name: 'id', description: 'ID của assignment' })
  @ApiResponse({ status: 200, description: 'Assignment deleted' })
  async deleteAssignment(
    @Param('id') id: string,
    @Headers('x-service-secret') secret?: string
  ) {
    const configured = process.env.REVIEWER_SERVICE_SECRET;
    if (configured && configured !== secret) {
      throw new BadRequestException('Invalid service secret');
    }

    const deleted = await this.reviewerService.deleteAssignment(id);
    if (!deleted) {
      throw new NotFoundException('Assignment not found');
    }

    return { message: 'Assignment deleted successfully' };
  }

  @Post(':id/review')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Nộp hoặc cập nhật bài đánh giá' })
  @ApiResponse({ status: 201, description: 'Review submitted successfully' })
  async submitReview(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: SubmitReviewDto
  ) {
    // Reviewer ID from token
    const user = (req as any).user;
    const reviewerId = user.sub;
    return this.reviewerService.submitReview(id, reviewerId, dto);
  }

  @Get(':id/review')
  @ApiOperation({ summary: 'Lấy bài đánh giá của chính mình' })
  async getMyReview(
    @Req() req: Request,
    @Param('id') id: string
  ) {
    const user = (req as any).user;
    const reviewerId = user.sub;
    return this.reviewerService.getMyReview(id, reviewerId);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Lấy lịch sử chỉnh sửa đánh giá' })
  async getReviewHistory(
    @Req() req: Request,
    @Param('id') id: string
  ) {
    const user = (req as any).user;
    const reviewerId = user.sub;
    return this.reviewerService.getReviewHistory(id, reviewerId);
  }

  @Get(':id/discussion')
  @ApiOperation({ summary: 'Lấy thảo luận nội bộ (các reviews khác)' })
  async getInternalDiscussion(
    @Req() req: Request,
    @Param('id') id: string
  ) {
    const user = (req as any).user;
    const reviewerId = user.sub;
    return this.reviewerService.getInternalDiscussion(id, reviewerId);
  }
}
