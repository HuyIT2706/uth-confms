import { Controller, Post, Body, Get, Req, UseGuards, Param, NotFoundException, BadRequestException, HttpCode, Headers, Put, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiParam } from '@nestjs/swagger';
import { ReviewerService } from './reviewer.service';
import { IncomingInvitationDto } from './dto/incoming-invitation.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { UpdateTopicsDto } from './dto/update-topics.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { Request } from 'express';

@ApiTags('Reviewer')
@Controller('reviewer/invitations')
export class ReviewerController {
  constructor(private readonly reviewerService: ReviewerService) {}

  @Post()
  @ApiOperation({ summary: 'Conference-service gửi invitation tới reviewer (service-to-service)' })
  @ApiBody({ type: IncomingInvitationDto })
  @ApiResponse({ status: 201, description: 'Invitation created' })
  @HttpCode(201)
  async create(@Body() body: IncomingInvitationDto, @Headers('x-service-secret') secret?: string) {
    const configured = process.env.REVIEWER_SERVICE_SECRET;
    if (configured && configured !== secret) {
      throw new BadRequestException('Invalid service secret');
    }
    console.log('[ReviewService] Received invitation from conference-service:', {
      externalInvitationId: body.externalInvitationId,
      conferenceId: body.conferenceId,
      reviewerId: body.reviewerId,
      conferenceName: body.conferenceName,
    });
    const inv = await this.reviewerService.createInvitation(body as any);
    console.log('[ReviewService] Created invitation:', inv.id);
    return inv;
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reviewer xem danh sách lời mời của mình' })
  @ApiResponse({ status: 200, description: 'Danh sách invitations' })
  async list(@Req() req: Request) {
    // req.user được set bởi JwtStrategy
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = (req as any).user;
    if (!user) throw new BadRequestException('Token missing user info');
    const reviewerId = Number(user.sub ?? user.id ?? user.userId);
    if (!reviewerId || isNaN(reviewerId)) throw new BadRequestException('Token missing user info');
    return this.reviewerService.findByReviewer(reviewerId);
  }

  private async changeStatusAndReturn(id: string, status: 'pending' | 'accepted' | 'rejected') {
    const inv = await this.reviewerService.updateStatus(id, status);
    if (!inv) throw new NotFoundException('Invitation not found');
    return inv;
  }

  @Post(':id/accept')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Accept invitation' })
  async accept(@Param('id') id: string) {
    return this.changeStatusAndReturn(id, 'accepted');
  }

  @Post(':id/reject')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject invitation' })
  async reject(@Param('id') id: string) {
    return this.changeStatusAndReturn(id, 'rejected');
  }

  @Post(':id/pending')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revert invitation to pending' })
  async pending(@Param('id') id: string) {
    return this.changeStatusAndReturn(id, 'pending');
  }

  @Put(':id/topics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reviewer khai báo chuyên môn (topics) của mình cho hội nghị này' })
  @ApiBody({ type: UpdateTopicsDto })
  @ApiResponse({ status: 200, description: 'Topics đã được cập nhật' })
  async updateTopics(@Param('id') id: string, @Body() dto: UpdateTopicsDto, @Req() req: Request) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = (req as any).user;
    if (!user) throw new BadRequestException('Token missing user info');
    const reviewerId = Number(user.sub ?? user.id ?? user.userId);
    if (!reviewerId || isNaN(reviewerId)) throw new BadRequestException('Token missing user info');
    
    const inv = await this.reviewerService.updateTopics(id, dto.topics, reviewerId);
    if (!inv) throw new NotFoundException('Invitation not found');
    return inv;
  }

  @Delete('external/:externalInvitationId')
  @ApiOperation({ summary: 'Conference-service xóa invitation (service-to-service)' })
  @ApiParam({ name: 'externalInvitationId', description: 'ID của invitation từ conference-service' })
  @ApiResponse({ status: 200, description: 'Invitation deleted' })
  async delete(@Param('externalInvitationId') externalInvitationId: string, @Headers('x-service-secret') secret?: string) {
    const configured = process.env.REVIEWER_SERVICE_SECRET;
    if (configured && configured !== secret) {
      throw new BadRequestException('Invalid service secret');
    }
    console.log('[ReviewService] Received delete request for externalInvitationId:', externalInvitationId);
    const deleted = await this.reviewerService.deleteByExternalId(externalInvitationId);
    if (!deleted) {
      throw new NotFoundException('Invitation not found');
    }
    console.log('[ReviewService] Deleted invitation with externalInvitationId:', externalInvitationId);
    return { message: 'Invitation deleted successfully' };
  }
}