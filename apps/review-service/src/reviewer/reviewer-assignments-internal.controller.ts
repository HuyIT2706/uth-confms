import { Controller, Post, Body, Param, Headers, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiParam, ApiResponse, ApiExcludeController } from '@nestjs/swagger';
import { ReviewerService } from './reviewer.service';

@ApiTags('Internal - Reviewer Assignments')
@ApiExcludeController()
@Controller('internal/assignments')
export class ReviewerAssignmentsInternalController {
  private readonly logger = new Logger(ReviewerAssignmentsInternalController.name);

  constructor(private readonly reviewerService: ReviewerService) { }

  /**
   * Conference-service gọi endpoint này để tạo assignment cho reviewer
   * Ghi nhận assignment khi chair phân công thủ công
   */
  @Post()
  @ApiOperation({
    summary: 'Conference-service tạo assignment cho reviewer (service-to-service)',
    description: 'Được gọi bởi conference-service khi chair phân công bài báo cho reviewer'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID assignment từ conference-service', example: '7b42e4f6-862f-45a9-9d0e-190de5e09389' },
        conferenceAssignmentId: { type: 'string', description: 'ID assignment từ conference-service' },
        submissionId: { type: 'string', description: 'ID submission hoặc topic reference', example: 'topic:AI' },
        topic: { type: 'string', description: 'Topic của submission', example: 'AI' },
        reviewerId: { type: 'number', description: 'ID reviewer' },
        conferenceId: { type: 'string', description: 'ID hội nghị', example: '35a23972-769d-4910-beed-508991a40f82' },
        assignedBy: { type: 'number', description: 'ID của chair' },
        assignedAt: { type: 'string', description: 'Ngày phân công' },
        status: { type: 'string', description: 'Status: assigned, pending...' },
      },
      required: ['id', 'reviewerId', 'conferenceId', 'topic']
    }
  })
  @ApiResponse({ status: 201, description: 'Assignment created in review-service' })
  async createAssignmentFromConference(
    @Body() body: any,
    @Headers('x-service-secret') secret?: string
  ) {
    // Verify service-to-service call
    const configured = process.env.REVIEWER_SERVICE_SECRET;
    if (configured && configured !== secret) {
      this.logger.warn(`Invalid service secret for assignment creation from conference-service`);
      throw new BadRequestException('Invalid service secret');
    }

    this.logger.log(`Received assignment from conference-service: reviewerId=${body.reviewerId}, conferenceId=${body.conferenceId}, topic=${body.topic}`);

    try {
      const assignment = await this.reviewerService.createAssignment(
        body.conferenceId,
        body.reviewerId,
        body.submissionId || body.id,
        body.topic,
        {
          conferenceAssignmentId: body.id || body.conferenceAssignmentId,
          assignedBy: body.assignedBy,
          assignedAt: body.assignedAt,
          status: body.status,
          similarityScore: body.similarityScore,
          suggestionReason: body.suggestionReason,
          hasCoi: body.hasCoi,
        }
      );

      this.logger.log(`Created assignment in review-service: conferenceAssignmentId=${assignment.conferenceAssignmentId}`);
      return assignment;
    } catch (error: any) {
      this.logger.error(`Failed to create assignment: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to create assignment: ${error.message}`);
    }
  }

  /**
   * Conference-service gọi endpoint này để xóa assignment
   */
  @Post(':id/delete')
  @ApiOperation({
    summary: 'Conference-service xóa assignment (service-to-service)',
    description: 'Được gọi bởi conference-service khi chair hủy phân công. ID tương ứng với conferenceAssignmentId ở review-service'
  })
  @ApiParam({ name: 'id', description: 'ID của assignment từ conference-service (conferenceAssignmentId)' })
  @ApiResponse({ status: 200, description: 'Assignment deleted' })
  async deleteAssignmentFromConference(
    @Param('id') id: string,
    @Headers('x-service-secret') secret?: string
  ) {
    // Verify service-to-service call
    const configured = process.env.REVIEWER_SERVICE_SECRET;
    if (configured && configured !== secret) {
      this.logger.warn(`Invalid service secret for assignment deletion from conference-service`);
      throw new BadRequestException('Invalid service secret');
    }

    this.logger.log(`Received delete assignment request from conference-service: conferenceAssignmentId=${id}`);

    // Tìm assignment theo conferenceAssignmentId
    const deleted = await this.reviewerService.deleteAssignmentByConferenceId(id);
    if (!deleted) {
      this.logger.warn(`Assignment with conferenceAssignmentId ${id} not found`);
      throw new NotFoundException('Assignment not found');
    }

    this.logger.log(`Deleted assignment with conferenceAssignmentId: ${id}`);
    return { message: 'Assignment deleted successfully' };
  }
}
