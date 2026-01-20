import { Controller, Get, Param, Logger } from '@nestjs/common';
import { SubmissionServiceService } from '../submission-service.service';

@Controller('internal')
export class InternalController {
  private readonly logger = new Logger(InternalController.name);

  constructor(private readonly submissionService: SubmissionServiceService) {}

  /**
   * Lấy danh sách submissions của một hội nghị
   * Được gọi từ review-service
   * PHẢI ĐẶT TRƯỚC /submissions/:id/file vì NestJS match route từ trên xuống
   */
  @Get('submissions/conference/:conferenceId')
  async getSubmissionsByConference(@Param('conferenceId') conferenceId: string) {
    this.logger.log(`[InternalController] Received request for conference: ${conferenceId}`);
    const result = await this.submissionService.getSubmissionsByConference(conferenceId);
    this.logger.log(`[InternalController] Returning ${result?.data?.length || 0} submissions`);
    return result;
  }

  // Public internal endpoint for other services to fetch the latest public file URL
  @Get('submissions/:id/file')
  async getSubmissionFile(@Param('id') id: string) {
    const sid = parseInt(id, 10);
    if (Number.isNaN(sid)) {
      return { status: 'error', message: 'Invalid submission id' };
    }

    return this.submissionService.getPublicFileInfoBySubmissionId(sid);
  }
}
