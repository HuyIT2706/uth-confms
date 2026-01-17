import { ApiProperty } from '@nestjs/swagger';
import { SubmissionStatus } from '../shared/constants/submission-status.enum';

export class SubmissionAuthorDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 'Nguyen Van A' })
    author_name: string;

    @ApiProperty({ example: 'nguyenvana@email.com' })
    email: string;

    @ApiProperty({ example: true })
    is_corresponding: boolean;
}

export class SubmissionFileDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 'https://storage.example.com/papers/1/v1.pdf' })
    file_path: string;

    @ApiProperty({ example: 1 })
    version: number;

    @ApiProperty({ example: '2026-01-17T10:00:00Z' })
    uploaded_at: Date;
}

export class SubmissionResponseDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: '214eb9b6-3935-4b2e-a9a0-d14512d8ec6e' })
    conference_id: string;

    @ApiProperty({ example: 'Deep Learning for Image Recognition' })
    title: string;

    @ApiProperty({ example: 'This paper presents a novel approach...', required: false })
    abstract?: string;

    @ApiProperty({
        example: 'Machine Learning',
        required: false,
        description: 'Chủ đề của bài báo'
    })
    topic?: string;

    @ApiProperty({
        enum: SubmissionStatus,
        example: SubmissionStatus.SUBMITTED
    })
    status: SubmissionStatus;

    @ApiProperty({ example: 123 })
    created_by: number;

    @ApiProperty({ example: '2026-01-17T10:00:00Z' })
    created_at: Date;

    @ApiProperty({ example: '2026-01-17T10:00:00Z' })
    updated_at: Date;

    @ApiProperty({ example: null, required: false })
    withdrawn_at?: Date;

    @ApiProperty({ example: null, required: false })
    camera_ready_submitted_at?: Date;

    @ApiProperty({ type: [SubmissionFileDto] })
    files: SubmissionFileDto[];

    @ApiProperty({ type: [SubmissionAuthorDto] })
    authors: SubmissionAuthorDto[];
}

export class PaginationDto {
    @ApiProperty({ example: 1 })
    page: number;

    @ApiProperty({ example: 10 })
    limit: number;

    @ApiProperty({ example: 100 })
    total: number;

    @ApiProperty({ example: 10 })
    totalPages: number;

    @ApiProperty({ example: true })
    hasNext: boolean;

    @ApiProperty({ example: false })
    hasPrev: boolean;
}

export class SubmissionListResponseDto {
    @ApiProperty({ type: [SubmissionResponseDto] })
    data: SubmissionResponseDto[];

    @ApiProperty({ type: PaginationDto })
    pagination: PaginationDto;
}
