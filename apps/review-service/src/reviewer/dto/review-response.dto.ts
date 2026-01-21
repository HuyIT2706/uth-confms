import { ApiProperty } from '@nestjs/swagger';

export class ReviewHistoryDto {
  @ApiProperty({ description: 'ID lịch sử' })
  id!: string;

  @ApiProperty({ description: 'Điểm số cũ' })
  score!: number;

  @ApiProperty({ description: 'Nội dung cũ' })
  content!: string;

  @ApiProperty({ description: 'Nội dung nội bộ cũ' })
  internalContent?: string;

  @ApiProperty({ description: 'Thời gian thay đổi' })
  changedAt!: Date;
}

export class InternalDiscussionItemDto {
  @ApiProperty({ description: 'ID reviewer (ẩn danh)' })
  reviewerId!: string;

  @ApiProperty({ description: 'Điểm số' })
  score!: number;

  @ApiProperty({ description: 'Nhận xét công khai' })
  content!: string;

  @ApiProperty({ description: 'Nhận xét nội bộ' })
  internalContent?: string;

  @ApiProperty({ description: 'Thời gian cập nhật' })
  updatedAt!: Date;
}

export class MyReviewResponseDto {
  @ApiProperty({ description: 'ID của review' })
  id!: string;

  @ApiProperty({ description: 'ID assignment' })
  conferenceAssignmentId!: string;

  @ApiProperty({ description: 'ID submission' })
  submissionId?: number;

  @ApiProperty({ description: 'Điểm số' })
  score!: number;

  @ApiProperty({ description: 'Nhận xét' })
  content!: string;

  @ApiProperty({ description: 'Nhận xét nội bộ' })
  internalContent?: string;

  @ApiProperty({ description: 'Thời gian tạo' })
  createdAt!: Date;

  @ApiProperty({ description: 'Thời gian cập nhật' })
  updatedAt!: Date;
}
