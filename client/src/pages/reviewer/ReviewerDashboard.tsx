import { Link } from 'react-router-dom';
import {
    RateReview,
    MailOutline,
    Description,
    CheckCircle,
    Schedule,
    TrendingUp,
    AssignmentInd,
    Check,
    Close,
    Assignment
} from '@mui/icons-material';
import { CircularProgress } from '@mui/material';
import { useGetMyReviewerAssignmentsQuery, useAcceptReviewerAssignmentMutation, useRejectReviewerAssignmentMutation } from '../../redux/api/assignmentsApi';
import { useGetInvitationsQuery, useUpdateInvitationStatusMutation } from '../../redux/api/invitationsApi';
import { showToast } from '../../utils/toast';


// Local interfaces for this component
interface ReviewAssignmentDisplay {
    id: string;
    submissionId: string;
    submissionTitle: string;
    conferenceId: string;
    conferenceName: string;
    status: 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'REJECTED';
    deadline: string;
}

interface InvitationDisplay {
    id: string;
    conferenceId: string;
    conferenceName: string;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: string;
    externalInvitationId?: string;
}

const ReviewerDashboard = () => {
    const { data: assignmentsData, isLoading: assignmentsLoading, refetch: refetchAssignments } = useGetMyReviewerAssignmentsQuery();
    const { data: invitationsData, isLoading: invitationsLoading, refetch: refetchInvitations } = useGetInvitationsQuery();
    const [updateInvitationStatus] = useUpdateInvitationStatusMutation();
    const [acceptAssignment] = useAcceptReviewerAssignmentMutation();
    const [rejectAssignment] = useRejectReviewerAssignmentMutation();

    // Parse invitations to map conferenceId -> conference info
    const invitationsMap: Record<string, { conferenceName: string; reviewDeadline?: string }> = {};
    if (Array.isArray(invitationsData)) {
        invitationsData.forEach((item: any) => {
            const confId = item.conferenceId || item.conference?.id || '';
            if (confId && !invitationsMap[confId]) {
                invitationsMap[confId] = {
                    conferenceName: item.conferenceName || item.conference?.name || 'Unknown Conference',
                    reviewDeadline: item.deadlines?.review || item.raw?.conference?.deadlines?.review,
                };
            }
        });
    }

    // Parse and map assignments from API
    const assignments: ReviewAssignmentDisplay[] = Array.isArray(assignmentsData)
        ? assignmentsData.map((item: any) => {
            const confId = item.conferenceId || '';
            const invitationInfo = invitationsMap[confId] || {};
            return {
                id: item.conferenceAssignmentId || item.id || '',
                submissionId: item.submissionId || '',
                submissionTitle: `Đánh giá bài báo trong ${invitationInfo.conferenceName || 'Unknown Conference'}`,
                conferenceId: confId,
                conferenceName: invitationInfo.conferenceName || 'Unknown Conference',
                status: (item.status || 'PENDING').toUpperCase(),
                deadline: invitationInfo.reviewDeadline || item.reviewDeadline || item.createdAt || new Date().toISOString(),
            };
        })
        : [];

    // Parse and map invitations from API
    const invitations: InvitationDisplay[] = Array.isArray(invitationsData)
        ? invitationsData.map((item: any) => ({
            id: item.id || item.uuid || '',
            conferenceId: item.conferenceId || item.conference?.id || '',
            conferenceName: item.conferenceName || item.conference?.name || 'Unknown',
            status: (item.status || 'pending').toLowerCase() as 'pending' | 'accepted' | 'rejected',
            createdAt: item.createdAt || item.invitationDate || new Date().toISOString(),
            externalInvitationId: item.externalInvitationId || item.invitation?.id || '',
        }))
        : [];

    // Calculate stats from real data
    const totalAssignments = assignments.length;
    const completedReviews = assignments.filter(a => a.status === 'COMPLETED').length;
    const pendingReviews = assignments.filter(a => a.status === 'PENDING' || a.status === 'ACCEPTED').length;
    const acceptedInvitations = invitations.filter(i => i.status === 'accepted').length;

    // Get display data
    const recentAssignments = assignments.slice(0, 3);
    const pendingAssignmentsList = assignments.filter((a) => a.status === 'PENDING');
    const pendingInvitationsList = invitations.filter((i) => i.status === 'pending');

    const handleInvitationAction = async (invitationId: string, action: 'accept' | 'reject') => {
        try {
            await updateInvitationStatus({
                invitationId,
                action,
            }).unwrap();

            showToast[action === 'accept' ? 'success' : 'info'](
                action === 'accept'
                    ? 'Đã chấp nhận lời mời'
                    : 'Đã từ chối lời mời'
            );

            refetchInvitations();
        } catch (error) {
            showToast.error('Có lỗi xảy ra khi cập nhật lời mời');
            console.error('Error updating invitation:', error);
        }
    };

    const handleAssignmentAction = async (assignmentId: string, action: 'accept' | 'reject') => {
        try {
            if (action === 'accept') {
                await acceptAssignment(assignmentId).unwrap();
            } else {
                await rejectAssignment(assignmentId).unwrap();
            }
            
            refetchAssignments();
            showToast[action === 'accept' ? 'success' : 'info'](
                action === 'accept'
                    ? 'Đã chấp nhận phân công'
                    : 'Đã từ chối phân công'
            );
        } catch (error) {
            showToast.error('Có lỗi xảy ra khi cập nhật phân công');
            console.error('Error updating assignment:', error);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'COMPLETED':
                return 'text-green-600 bg-green-50';
            case 'PENDING':
                return 'text-orange-600 bg-orange-50';
            case 'ACCEPTED':
                return 'text-blue-600 bg-blue-50';
            case 'REJECTED':
                return 'text-red-600 bg-red-50';
            default:
                return 'text-gray-600 bg-gray-50';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'COMPLETED':
                return 'Hoàn thành';
            case 'PENDING':
                return 'Đang chờ';
            case 'ACCEPTED':
                return 'Đã chấp nhận';
            case 'REJECTED':
                return 'Từ chối';
            default:
                return status;
        }
    };

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('vi-VN');
        } catch {
            return 'N/A';
        }
    };

    return (
        <div>
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-[#008689] to-[#006666] py-16 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-white">
                        <h1 className="text-5xl font-bold mb-4">
                            Bảng điều khiển Reviewer
                        </h1>
                        <p className="text-xl text-white/90 mb-8">
                            Quản lý các bài báo được giao, lời mời hội nghị và tiến độ đánh giá
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link
                                to="/reviewer/assignments"
                                className="inline-flex items-center px-8 py-4 bg-white text-[#008689] hover:bg-gray-100 hover:scale-105 hover:-translate-y-1 font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-2xl hover:bg-opacity-95 group"
                            >
                                <AssignmentInd className="w-5 h-5 mr-2 transition-transform duration-300 group-hover:scale-110" />
                                Xem lời mời phân công đánh giá bài báo
                            </Link>
                            <Link
                                to="/reviewer/invitations"
                                className="inline-flex items-center px-8 py-4 bg-white text-[#008689] hover:bg-gray-100 hover:scale-105 hover:-translate-y-1 font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-2xl hover:bg-opacity-95 group"
                            >
                                <MailOutline className="w-5 h-5 mr-2 transition-transform duration-300 group-hover:scale-110" />
                                Xem lời mời tham gia hội nghị
                            </Link>
                            <Link
                                to="/reviewer/submissions"
                                className="inline-flex items-center px-8 py-4 bg-white text-[#008689] hover:bg-gray-100 hover:scale-105 hover:-translate-y-1 font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-2xl hover:bg-opacity-95 group"
                            >
                                <Assignment className="w-5 h-5 mr-2 transition-transform duration-300 group-hover:scale-110" />
                                Xem danh sách bài được giao
                            </Link>

                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Section */}
            <div className="bg-white py-12 px-6 border-b border-gray-200">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-2xl font-bold text-gray-900 mb-8">
                        Thống kê công việc
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Total Assignments */}
                        <Link 
                            to="/reviewer/submissions"
                            className="block bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 hover:scale-105 hover:shadow-lg hover:border-blue-300 transition-all duration-300 cursor-pointer group"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-medium text-gray-700">
                                    Tổng bài được giao
                                </h3>
                                <AssignmentInd className="w-6 h-6 text-blue-600 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
                            </div>
                            <p className="text-4xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors duration-300">
                                {totalAssignments}
                            </p>
                            <p className="text-sm text-gray-600 mt-2">
                                từ các hội nghị khác nhau
                            </p>
                        </Link>

                        {/* Completed Reviews */}
                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200 hover:scale-105 hover:shadow-lg hover:border-green-300 transition-all duration-300 cursor-pointer group">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-medium text-gray-700">
                                    Hoàn thành
                                </h3>
                                <CheckCircle className="w-6 h-6 text-green-600 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
                            </div>
                            <p className="text-4xl font-bold text-gray-900 group-hover:text-green-700 transition-colors duration-300">
                                {completedReviews}
                            </p>
                            <p className="text-sm text-gray-600 mt-2">
                                bài đã đánh giá
                            </p>
                        </div>

                        {/* Pending Reviews */}
                        <Link 
                            to="/reviewer/invitations"
                            className="block bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200 hover:scale-105 hover:shadow-lg hover:border-orange-300 transition-all duration-300 cursor-pointer group"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-medium text-gray-700">
                                    Đang chờ
                                </h3>
                                <Schedule className="w-6 h-6 text-orange-600 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
                            </div>
                            <p className="text-4xl font-bold text-gray-900 group-hover:text-orange-700 transition-colors duration-300">
                                {pendingReviews}
                            </p>
                            <p className="text-sm text-gray-600 mt-2">
                                bài cần đánh giá
                            </p>
                        </Link>

                        {/* Accepted Invitations */}
                        <Link 
                            to="/reviewer/invitations?tab=accepted"
                            className="block bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200 hover:scale-105 hover:shadow-lg hover:border-purple-300 transition-all duration-300 cursor-pointer group"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-medium text-gray-700">
                                    Hội nghị tham gia
                                </h3>
                                <TrendingUp className="w-6 h-6 text-purple-600 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
                            </div>
                            <p className="text-4xl font-bold text-gray-900 group-hover:text-purple-700 transition-colors duration-300">
                                {acceptedInvitations}
                            </p>
                            <p className="text-sm text-gray-600 mt-2">
                                lời mời đã chấp nhận
                            </p>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="bg-gray-50 py-12 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Recent Assignments */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    Lời mời phân công đánh giá
                                </h2>
                                <Link
                                    to="/reviewer/assignments"
                                    className="text-[#008689] hover:text-[#006666] font-medium text-sm"
                                >
                                    Xem tất cả →
                                </Link>
                            </div>

                            {assignmentsLoading ? (
                                <div className="flex justify-center py-12">
                                    <CircularProgress />
                                </div>
                            ) : pendingAssignmentsList.length > 0 ? (
                                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                                    {pendingAssignmentsList.map((assignment) => (
                                        <div
                                            key={assignment.id}
                                            className="border border-gray-200 rounded-lg p-4 hover:border-[#008689] hover:shadow-md transition-all duration-300"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                                                        {assignment.submissionTitle}
                                                    </h3>
                                                    <p className="text-xs text-gray-400">
                                                        Gửi lúc: {formatDate(assignment.deadline)}
                                                    </p>
                                                </div>
                                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-600">
                                                    Đang chờ
                                                </span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleAssignmentAction(assignment.id, 'accept')}
                                                    className="flex-1 px-3 py-2 text-center text-white bg-green-600 hover:bg-green-700 rounded transition-colors duration-200 text-sm font-medium flex items-center justify-center gap-2"
                                                >
                                                    <Check className="w-4 h-4" />
                                                    Chấp nhận
                                                </button>
                                                <button
                                                    onClick={() => handleAssignmentAction(assignment.id, 'reject')}
                                                    className="flex-1 px-3 py-2 text-center text-white bg-red-600 hover:bg-red-700 rounded transition-colors duration-200 text-sm font-medium flex items-center justify-center gap-2"
                                                >
                                                    <Close className="w-4 h-4" />
                                                    Từ chối
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <AssignmentInd className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-600">Không có lời mời đang chờ</p>
                                </div>
                            )}
                        </div>

                        {/* Pending Invitations */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    Lời mời tham gia hội nghị
                                </h2>
                                <Link
                                    to="/reviewer/invitations"
                                    className="text-[#008689] hover:text-[#006666] font-medium text-sm"
                                >
                                    Xem tất cả →
                                </Link>
                            </div>

                            {invitationsLoading ? (
                                <div className="flex justify-center py-12">
                                    <CircularProgress />
                                </div>
                            ) : pendingInvitationsList.length > 0 ? (
                                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                                    {pendingInvitationsList.map((invitation) => (
                                        <div
                                            key={invitation.id}
                                            className="border border-gray-200 rounded-lg p-4 hover:border-[#008689] hover:shadow-md transition-all duration-300"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-gray-900 mb-1">
                                                        {invitation.conferenceName}
                                                    </h3>
                                                    <p className="text-xs text-gray-400">
                                                        Gửi lúc: {formatDate(invitation.createdAt)}
                                                    </p>
                                                </div>
                                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-600">
                                                    Đang chờ
                                                </span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleInvitationAction(invitation.id, 'accept')}
                                                    className="flex-1 px-3 py-2 text-center text-white bg-green-600 hover:bg-green-700 rounded transition-colors duration-200 text-sm font-medium flex items-center justify-center gap-2"
                                                >
                                                    <Check className="w-4 h-4" />
                                                    Chấp nhận
                                                </button>
                                                <button
                                                    onClick={() => handleInvitationAction(invitation.id, 'reject')}
                                                    className="flex-1 px-3 py-2 text-center text-white bg-red-600 hover:bg-red-700 rounded transition-colors duration-200 text-sm font-medium flex items-center justify-center gap-2"
                                                >
                                                    <Close className="w-4 h-4" />
                                                    Từ chối
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <MailOutline className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-600">Không có lời mời đang chờ</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-12 bg-white rounded-xl shadow-md p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-8">
                            Thao tác nhanh
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <Link
                                to="/reviewer/assignments"
                                className="flex flex-col items-center p-6 border-2 border-gray-200 rounded-lg hover:border-[#008689] hover:bg-[#e6f7f7] transition-all duration-300 text-center group"
                            >
                                <RateReview className="w-12 h-12 text-[#008689] mb-3 group-hover:scale-110 transition-transform" />
                                <h3 className="font-semibold text-gray-900 mb-1">
                                    Viết đánh giá
                                </h3>
                                <p className="text-xs text-gray-600">
                                    Đánh giá bài báo được giao
                                </p>
                            </Link>

                            <Link
                                to="/reviewer/invitations"
                                className="flex flex-col items-center p-6 border-2 border-gray-200 rounded-lg hover:border-[#008689] hover:bg-[#e6f7f7] transition-all duration-300 text-center group"
                            >
                                <MailOutline className="w-12 h-12 text-[#008689] mb-3 group-hover:scale-110 transition-transform" />
                                <h3 className="font-semibold text-gray-900 mb-1">
                                    Quản lý lời mời
                                </h3>
                                <p className="text-xs text-gray-600">
                                    Chấp nhận hoặc từ chối lời mời
                                </p>
                            </Link>

                            <Link
                                to="/reviewer/my-reviews"
                                className="flex flex-col items-center p-6 border-2 border-gray-200 rounded-lg hover:border-[#008689] hover:bg-[#e6f7f7] transition-all duration-300 text-center group"
                            >
                                <Description className="w-12 h-12 text-[#008689] mb-3 group-hover:scale-110 transition-transform" />
                                <h3 className="font-semibold text-gray-900 mb-1">
                                    Các đánh giá của tôi
                                </h3>
                                <p className="text-xs text-gray-600">
                                    Xem lịch sử đánh giá
                                </p>
                            </Link>

                            <Link
                                to="/profile"
                                className="flex flex-col items-center p-6 border-2 border-gray-200 rounded-lg hover:border-[#008689] hover:bg-[#e6f7f7] transition-all duration-300 text-center group"
                            >
                                <AssignmentInd className="w-12 h-12 text-[#008689] mb-3 group-hover:scale-110 transition-transform" />
                                <h3 className="font-semibold text-gray-900 mb-1">
                                    Hồ sơ cá nhân
                                </h3>
                                <p className="text-xs text-gray-600">
                                    Chỉnh sửa thông tin của bạn
                                </p>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReviewerDashboard;
