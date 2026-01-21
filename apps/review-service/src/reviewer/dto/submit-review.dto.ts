import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, Max, IsString, IsOptional, MaxLength, IsNotEmpty } from 'class-validator';

export class SubmitReviewDto {
    @ApiProperty({ description: 'ID của bài nộp cần đánh giá', example: 1 })
    @IsInt()
    @IsNotEmpty()
    submissionId!: number;

    @ApiProperty({ description: 'Điểm số bài báo (0-10)', example: 8 })
    @IsInt()
    @Min(0)
    @Max(10)
    score!: number;

    @ApiProperty({ description: 'Nhận xét cho tác giả', example: 'Bài báo rất tốt, tuy nhiên...' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(5000)
    content!: string;

    @ApiProperty({ description: 'Nhận xét nội bộ (chỉ reviewer và chair thấy)', example: 'Tôi nghĩ bài này nên được chấp nhận.' })
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    internalContent?: string;
}
