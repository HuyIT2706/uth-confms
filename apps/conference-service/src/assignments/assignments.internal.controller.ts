import { Controller, Get, Patch, Param, Body, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AssignmentsService } from './assignments.service';

@Controller('internal/assignments')
@ApiTags('Internal Assignments')
export class AssignmentsInternalController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Get('reviewer/:reviewerId')
  @ApiOperation({ summary: 'Get assignments for a reviewer (internal)' })
  @ApiResponse({ status: 200, description: 'List of assignments for reviewer' })
  async getByReviewer(@Param('reviewerId') reviewerId: string) {
    const rId = Number(reviewerId);
    return this.assignmentsService.findByReviewer(rId);
  }

  @Patch(':id/accept')
  @ApiOperation({ summary: 'Reviewer accepts an assignment (internal)' })
  @ApiResponse({ status: 200, description: 'Accepted' })
  async accept(@Param('id') id: string, @Body() body: any) {
    const updated = await this.assignmentsService.markAccepted(id, body.reviewerId);
    if (!updated) throw new NotFoundException('Assignment not found');
    return { message: 'Accepted' };
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reviewer rejects an assignment (internal)' })
  @ApiResponse({ status: 200, description: 'Rejected' })
  async reject(@Param('id') id: string, @Body() body: any) {
    const updated = await this.assignmentsService.markDeclined(id, body.reviewerId);
    if (!updated) throw new NotFoundException('Assignment not found');
    return { message: 'Rejected' };
  }
}
