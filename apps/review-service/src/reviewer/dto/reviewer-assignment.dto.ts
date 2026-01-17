import { ApiProperty } from '@nestjs/swagger';
import { ReviewerAssignmentStatus } from '../entities/reviewer-assignment.entity';

export class ReviewerAssignmentDto {
  @ApiProperty({ description: 'ID assignment từ conference-service (primary key)', example: 'f2580139-07f3-4864-bba0-3a5f9a03170f' })
  conferenceAssignmentId!: string;

  @ApiProperty({ description: 'ID của hội nghị', example: 'ed844d02-1bd1-431e-a30d-3c43d9af4ca4' })
  conferenceId!: string;

  @ApiProperty({ description: 'ID của bài báo', example: 'topic:AI' })
  submissionId?: string;

  @ApiProperty({ description: 'Trạng thái phân công', enum: ReviewerAssignmentStatus })
  status!: ReviewerAssignmentStatus;

  @ApiProperty({ description: 'Topic của bài báo', example: 'Large Language Models' })
  topic?: string;

  @ApiProperty({ description: 'Thông tin bài báo (không bao gồm tác giả)' })
  submissionInfo?: {
    title?: string;
    abstract?: string;
    keywords?: string[];
  };

  @ApiProperty({ description: 'Ngày tạo' })
  createdAt!: Date;

  @ApiProperty({ description: 'Ngày cập nhật' })
  updatedAt!: Date;
}
