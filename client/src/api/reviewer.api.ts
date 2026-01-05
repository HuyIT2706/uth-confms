import axiosInstance from './axios';

export interface ReviewerAssignment {
  assignmentId: string;
  paperId: string;
  paperTitle: string;
  conferenceName: string;
  deadline?: string;
  status: 'PENDING' | 'SUBMITTED';
}

const reviewerApi = {
  getAssignments: () =>
    axiosInstance.get<ReviewerAssignment[]>('/api/reviewer/assignments'),

  getAssignmentDetail: (assignmentId: string) =>
    axiosInstance.get(`/api/reviewer/assignments/${assignmentId}`),

  submitReview: (assignmentId: string, data: any) =>
    axiosInstance.post(`/api/reviewer/assignments/${assignmentId}/review`, data),
};

export default reviewerApi;
