import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class AddDiscussionCommentDto {
  @ApiProperty({ description: 'Nội dung bình luận', example: 'Tôi đồng ý với đánh giá này, bài báo thực sự cần cải thiện phần methodology.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(3000)
  content!: string;
}

export class DiscussionCommentResponseDto {
  @ApiProperty({ description: 'ID bình luận' })
  id!: string;

  @ApiProperty({ description: 'ID reviewer (ẩn danh)' })
  reviewerId!: string;

  @ApiProperty({ description: 'Nội dung bình luận' })
  content!: string;

  @ApiProperty({ description: 'Thời gian tạo' })
  createdAt!: Date;

  @ApiProperty({ description: 'Thời gian cập nhật' })
  updatedAt!: Date;
}
