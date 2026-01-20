export class SubmissionFileDto {
  id?: number;
  file_path: string;
  version: number;
  uploadedAt?: string;
}

export class SubmissionAuthorDto {
  id?: number;
  author_name: string;
  email: string;
  is_corresponding: boolean;
}

export class SubmissionDto {
  id: number;
  title: string;
  conference_id: string;
  abstract?: string;
  topic: string;
  status: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  authors: SubmissionAuthorDto[];
  files: SubmissionFileDto[];
}

/**
 * DTO dùng cho endpoint lấy submissions của một conference
 * Trả về danh sách submissions với metadata của submissions
 */
export class SubmissionListResponseDto {
  status: string;
  data: SubmissionDto[];
}

/**
 * DTO dùng cho response khi submit review
 */
export class SubmissionInfoForReviewDto {
  submissionId: number;
  title: string;
  topic: string;
  authors: SubmissionAuthorDto[];
  files: SubmissionFileDto[];
  status: string;
  createdAt: string;
  abstract?: string;
}
