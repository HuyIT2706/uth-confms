// src/redux/api/assignmentsApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { ReviewerAssignmentDto } from '../../types/api.types';

// Định nghĩa type cho response từ suggestReviewersForTopic (dựa trên backend trả về)
interface SuggestedReviewer {
    reviewerId: number;
    name: string;
    email?: string;
    score: number;
    expertise: string[];
    // Có thể thêm các field khác nếu backend trả về (assignedTopics, maxTopics, etc.)
}

// Định nghĩa type cho assignment item (từ getAssignmentsByConference)
interface Assignment {
    topic: string;
    reviewers: { id: number; name: string; email?: string }[];
    // Thêm field khác nếu backend trả về
}

// Submission type cho reviewer view - Backend returns snake_case, we convert to camelCase
export interface ReviewerSubmission {
    id: number | string;
    title: string;
    abstract?: string;
    topic?: string;
    keywords?: string[];
    status?: string;
    authorId?: number;
    authorName?: string;
    createdAt?: string;
    updatedAt?: string;
    conferenceId?: string;
    files?: Array<{
        id: number;
        submissionId: number;
        filePath: string;
        version: number;
        uploadedAt: string;
    }>;
}

// Backend response wrapper for submissions
interface SubmissionsResponse {
    status: string;
    data: Array<{
        id: number;
        conference_id: string;
        title: string;
        abstract?: string;
        topic?: string;
        status: string;
        created_at: string;
        updated_at: string;
        files?: Array<{
            id: number;
            submission_id: number;
            file_path: string;
            version: number;
            uploaded_at: string;
        }>;
    }>;
    total: number;
}

// Review DTO type
interface SubmitReviewDto {
    submissionId: number; // ID bài nộp cần đánh giá
    score: number; // 0-10
    content: string; // Cho tác giả (max 5000)
    internalContent?: string; // Nội bộ (max 2000)
}

// Review type khi lấy về
interface ReviewData {
    id: string;
    assignmentId: string;
    reviewerId: number;
    score: number;
    content: string;
    internalContent?: string;
    createdAt: string;
    updatedAt: string;
}

// Review history item
interface ReviewHistory {
    id: string;
    score: number;
    content: string;
    internalContent?: string;
    editedAt: string;
    editedBy?: string;
}

// Discussion item (nhận xét nội bộ từ reviewer khác)
interface DiscussionItem {
    id: string;
    reviewerId: number;
    reviewerName: string;
    internalContent: string;
    createdAt: string;
    updatedAt: string;
}

// Thống nhất base URL với các API khác (qua gateway)
const API_BASE_URL =
    (import.meta as any)?.env?.VITE_API_BASE_URL ||
    `${window.location.protocol}//${window.location.hostname}:3000/api`;

export const assignmentsApi = createApi({
    reducerPath: 'assignmentsApi',

    // Dùng gateway http://host:3000/api/...
    baseQuery: fetchBaseQuery({
        baseUrl: API_BASE_URL,
        prepareHeaders: (headers) => {
            const token =
                localStorage.getItem('token') ||
                localStorage.getItem('accessToken') ||
                localStorage.getItem('jwt') ||
                localStorage.getItem('authToken');

            if (token) {
                headers.set('Authorization', `Bearer ${token}`);
            }
            headers.set('Accept', 'application/json');
            return headers;
        },
        // Tùy chọn: timeout dài hơn nếu API conference chậm
        timeout: 15000,
    }),

    tagTypes: ['ConferenceAssignments', 'ReviewerAssignment'],

    endpoints: (builder) => ({
        // ===== CONFERENCE ASSIGNMENTS (từ conference-service) =====
        // Lấy tất cả phân công reviewer theo topic của một conference
        getAssignmentsByConference: builder.query<Assignment[], string>({
            query: (conferenceId) => `assignments/conference/${conferenceId}`,
            providesTags: ['ConferenceAssignments'],
        }),

        // Gợi ý reviewer phù hợp nhất cho một topic
        suggestReviewersForTopic: builder.query<SuggestedReviewer[], { conferenceId: string; topic: string; top?: number }>({
            query: ({ conferenceId, topic, top = 5 }) =>
                `assignments/suggest/${conferenceId}/${encodeURIComponent(topic)}?top=${top}`,
            // Không cần providesTags vì đây là query gợi ý, không cần invalidate
        }),

        // Phân công (assign) một hoặc nhiều reviewer cho topic
        assignReviewersToTopic: builder.mutation<void, { conferenceId: string; topic: string; reviewerIds: number[] }>({
            query: (body) => ({
                url: 'assignments/assign',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['ConferenceAssignments', 'ReviewerAssignment'], // Reload danh sách assignments sau khi assign
        }),

        // Hủy phân công (unassign) một assignment cụ thể
        unassign: builder.mutation<void, string>({
            query: (assignmentId) => ({
                url: `assignments/${assignmentId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['ConferenceAssignments'], // Reload danh sách sau khi unassign
        }),

        // ===== REVIEWER ASSIGNMENTS (từ review-service) =====
        // Lấy danh sách bài báo được phân công cho reviewer hiện tại
        getMyReviewerAssignments: builder.query<ReviewerAssignmentDto[], void>({
            query: () => '/reviewer/assignments',
            providesTags: (_result) =>
                _result
                    ? [
                          ...(_result || []).map(({ conferenceAssignmentId }) => ({
                              type: 'ReviewerAssignment' as const,
                              id: conferenceAssignmentId,
                          })),
                          { type: 'ReviewerAssignment', id: 'MY_LIST' },
                      ]
                    : [{ type: 'ReviewerAssignment', id: 'MY_LIST' }],
        }),

        // Lấy chi tiết một assignment
        getReviewerAssignmentDetail: builder.query<ReviewerAssignmentDto, string>({
            query: (conferenceAssignmentId) =>
                `/reviewer/assignments/${conferenceAssignmentId}`,
            providesTags: (_result, _error, conferenceAssignmentId) => [
                { type: 'ReviewerAssignment', id: conferenceAssignmentId },
            ],
        }),

        // Chấp nhận một phân công
        acceptReviewerAssignment: builder.mutation<ReviewerAssignmentDto, string>({
            query: (conferenceAssignmentId) => ({
                url: `/reviewer/assignments/${conferenceAssignmentId}/accept`,
                method: 'POST',
            }),
            invalidatesTags: (_result, _error, conferenceAssignmentId) => [
                { type: 'ReviewerAssignment', id: conferenceAssignmentId },
                { type: 'ReviewerAssignment', id: 'MY_LIST' },
            ],
        }),

        // Từ chối một phân công
        rejectReviewerAssignment: builder.mutation<ReviewerAssignmentDto, string>({
            query: (conferenceAssignmentId) => ({
                url: `/reviewer/assignments/${conferenceAssignmentId}/reject`,
                method: 'POST',
            }),
            invalidatesTags: (_result, _error, conferenceAssignmentId) => [
                { type: 'ReviewerAssignment', id: conferenceAssignmentId },
                { type: 'ReviewerAssignment', id: 'MY_LIST' },
            ],
        }),

        // Đặt lại trạng thái phân công về pending
        resetReviewerAssignmentStatus: builder.mutation<ReviewerAssignmentDto, string>({
            query: (conferenceAssignmentId) => ({
                url: `/reviewer/assignments/${conferenceAssignmentId}/pending`,
                method: 'POST',
            }),
            invalidatesTags: (_result, _error, conferenceAssignmentId) => [
                { type: 'ReviewerAssignment', id: conferenceAssignmentId },
                { type: 'ReviewerAssignment', id: 'MY_LIST' },
            ],
        }),

        // Lấy danh sách submissions của một conference cho reviewer
        getReviewerSubmissionsByConference: builder.query<ReviewerSubmission[], string>({
            query: (conferenceId) => `/reviewer/assignments/${conferenceId}/submissions`,
            transformResponse: (response: SubmissionsResponse) => {
                // Transform snake_case to camelCase and extract the data array
                return response.data.map(submission => ({
                    id: submission.id,
                    title: submission.title,
                    abstract: submission.abstract,
                    topic: submission.topic,
                    status: submission.status,
                    createdAt: submission.created_at,
                    updatedAt: submission.updated_at,
                    conferenceId: submission.conference_id,
                    files: submission.files?.map(file => ({
                        id: file.id,
                        submissionId: file.submission_id,
                        filePath: file.file_path,
                        version: file.version,
                        uploadedAt: file.uploaded_at,
                    })),
                }));
            },
            providesTags: (_result, _error, conferenceId) => [
                { type: 'ReviewerAssignment', id: `SUBMISSIONS_${conferenceId}` },
            ],
        }),

        // Nộp đánh giá cho một bài báo
        submitReview: builder.mutation<ReviewData, { assignmentId: string; reviewData: SubmitReviewDto }>({
            query: ({ assignmentId, reviewData }) => ({
                url: `/reviewer/assignments/${assignmentId}/review`,
                method: 'POST',
                body: reviewData,
            }),
            invalidatesTags: (_result, _error, { assignmentId }) => [
                { type: 'ReviewerAssignment', id: assignmentId },
                { type: 'ReviewerAssignment', id: 'MY_LIST' },
            ],
        }),

        // Lấy đánh giá của reviewer cho một bài báo
        getMyReview: builder.query<ReviewData, string>({
            query: (assignmentId) => `/reviewer/assignments/${assignmentId}/review`,
            providesTags: (_result, _error, assignmentId) => [
                { type: 'ReviewerAssignment', id: `REVIEW_${assignmentId}` },
            ],
        }),

        // Lấy lịch sử chỉnh sửa đánh giá
        getReviewHistory: builder.query<ReviewHistory[], string>({
            query: (assignmentId) => `/reviewer/assignments/${assignmentId}/history`,
            providesTags: (_result, _error, assignmentId) => [
                { type: 'ReviewerAssignment', id: `HISTORY_${assignmentId}` },
            ],
        }),

        // Lấy nhận xét nội bộ từ các reviewer khác
        getInternalDiscussion: builder.query<DiscussionItem[], string>({
            query: (assignmentId) => `/reviewer/assignments/${assignmentId}/discussion`,
            providesTags: (_result, _error, assignmentId) => [
                { type: 'ReviewerAssignment', id: `DISCUSSION_${assignmentId}` },
            ],
        }),
    }),
});

// Export hooks tự động
export const {
    useGetAssignmentsByConferenceQuery,
    useSuggestReviewersForTopicQuery,
    useLazySuggestReviewersForTopicQuery, // nếu cần lazy query
    useAssignReviewersToTopicMutation,
    useUnassignMutation,
    // Reviewer Assignment hooks
    useGetMyReviewerAssignmentsQuery,
    useGetReviewerAssignmentDetailQuery,
    useAcceptReviewerAssignmentMutation,
    useRejectReviewerAssignmentMutation,
    useResetReviewerAssignmentStatusMutation,
    useGetReviewerSubmissionsByConferenceQuery,
    // Review hooks
    useSubmitReviewMutation,
    useGetMyReviewQuery,
    useGetReviewHistoryQuery,
    useGetInternalDiscussionQuery,
} = assignmentsApi;
