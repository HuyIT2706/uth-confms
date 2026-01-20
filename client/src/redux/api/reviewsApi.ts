import { apiSlice } from './apiSlice';
import type {
  Review,
  ReviewAssignment,
  ApiResponse,
  ReviewerAssignmentDto,
} from '../../types/api.types';

export const reviewsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get my review assignments
    getMyAssignments: builder.query<ApiResponse<ReviewAssignment[]>, void>({
      query: () => '/reviews/assignments/me',
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Assignment' as const, id })),
              { type: 'Assignment', id: 'MY_LIST' },
            ]
          : [{ type: 'Assignment', id: 'MY_LIST' }],
    }),
    // Get all reviewer assignments (from review-service)
    getReviewerAssignments: builder.query<ReviewerAssignmentDto[], void>({
      query: () => '/reviewer/assignments',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ conferenceAssignmentId }) => ({
                type: 'Assignment' as const,
                id: conferenceAssignmentId,
              })),
              { type: 'Assignment', id: 'LIST' },
            ]
          : [{ type: 'Assignment', id: 'LIST' }],
    }),
    // Get single reviewer assignment
    getReviewerAssignmentById: builder.query<ApiResponse<ReviewerAssignmentDto>, string>({
      query: (id) => `/reviewer/assignments/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Assignment', id }],
    }),
    // Accept reviewer assignment
    acceptReviewerAssignment: builder.mutation<ApiResponse<void>, string>({
      query: (id) => ({
        url: `/reviewer/assignments/${id}/accept`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Assignment', id },
        { type: 'Assignment', id: 'LIST' },
      ],
    }),
    // Reject reviewer assignment
    rejectReviewerAssignment: builder.mutation<ApiResponse<void>, string>({
      query: (id) => ({
        url: `/reviewer/assignments/${id}/reject`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Assignment', id },
        { type: 'Assignment', id: 'LIST' },
      ],
    }),
    // Revert reviewer assignment to pending
    pendingReviewerAssignment: builder.mutation<ApiResponse<void>, string>({
      query: (id) => ({
        url: `/reviewer/assignments/${id}/pending`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Assignment', id },
        { type: 'Assignment', id: 'LIST' },
      ],
    }),
    // Get review by ID
    getReviewById: builder.query<ApiResponse<Review>, number>({
      query: (id) => `/reviews/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Review', id }],
    }),
    // Get anonymized reviews for a submission (for authors)
    getAnonymizedReviewsForSubmission: builder.query<
      ApiResponse<Array<{ score: number; commentForAuthor: string; recommendation: string }>>,
      string
    >({
      query: (submissionId) => `/reviews/submission/${submissionId}/anonymized`,
      providesTags: (_result, _error, submissionId) => [
        { type: 'Review', id: `submission-${submissionId}` },
      ],
    }),
  }),
});

export const {
  useGetMyAssignmentsQuery,
  useGetReviewerAssignmentsQuery,
  useGetReviewerAssignmentByIdQuery,
  useAcceptReviewerAssignmentMutation,
  useRejectReviewerAssignmentMutation,
  usePendingReviewerAssignmentMutation,
  useGetReviewByIdQuery,
  useGetAnonymizedReviewsForSubmissionQuery,
} = reviewsApi;

