// apps/conference-service/src/invitations/invitations.internal.controller.ts

import { Controller, Patch, Param, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiExcludeController, // ← Import cái này (ẩn toàn bộ controller)
} from '@nestjs/swagger';

import { InvitationsService } from './invitations.service';

@ApiExcludeController() // ← ẨN TOÀN BỘ CONTROLLER NÀY KHỎI SWAGGER
@ApiTags('Internal Invitations') // Giữ lại cho developer đọc code, nhưng tag sẽ không hiện
@Controller('internal/invitations')
export class InvitationsInternalController {
  constructor(private readonly invitationsService: InvitationsService) { }

  @Patch(':id/accept')
  @ApiOperation({ summary: 'Internal: Chấp nhận lời mời tham gia phản biện' })
  @ApiParam({ name: 'id', description: 'ID của lời mời', type: String })
  @ApiResponse({ status: 200, description: 'Đã chấp nhận lời mời, role REVIEWER đã được thêm' })
  async acceptInvitation(@Param('id') id: string, @Body() body: { userId?: number; topics?: string[] }) {
    const userId = body?.userId;
    const topics = body?.topics;
    const result = await this.invitationsService.acceptInvitation(id, userId);
    // Nếu có topics từ review-service, cập nhật topics
    if (topics && Array.isArray(topics) && topics.length > 0) {
      await this.invitationsService.updateTopics(id, topics, userId);
    }
    return result;
  }

  @Patch(':id/decline')
  @ApiOperation({ summary: 'Internal: Từ chối lời mời tham gia phản biện' })
  @ApiParam({ name: 'id', description: 'ID của lời mời', type: String })
  @ApiResponse({ status: 200, description: 'Đã từ chối lời mời' })
  async declineInvitation(@Param('id') id: string, @Body() body: { userId?: number }) {
    const userId = body?.userId;
    return this.invitationsService.declineInvitation(id, userId);
  }

  @Patch(':id/topics')
  @ApiOperation({ summary: 'Internal: Cập nhật topics cho lời mời (bypass role guard)' })
  @ApiParam({ name: 'id', description: 'ID của lời mời', type: String })
  @ApiResponse({ status: 200, description: 'Đã cập nhật topics' })
  async internalUpdateTopics(@Param('id') id: string, @Body() body: { userId?: number; topics?: string[] }) {
    const userId = body?.userId;
    const topics = body?.topics || [];
    return this.invitationsService.updateTopics(id, topics, userId);
  }

  @Patch(':id/coi')
  @ApiOperation({ summary: 'Internal: Cập nhật COI cho lời mời (bypass role guard)' })
  @ApiParam({ name: 'id', description: 'ID của lời mời', type: String })
  @ApiResponse({ status: 200, description: 'Đã cập nhật COI' })
  async internalUpdateCoi(@Param('id') id: string, @Body() body: { userId?: number; coiUserIds?: number[]; coiInstitutions?: string[] }) {
    const userId = body?.userId;
    const coiUserIds = body?.coiUserIds || [];
    const coiInstitutions = body?.coiInstitutions || [];
    return this.invitationsService.updateCoi(id, coiUserIds, coiInstitutions, userId);
  }
}