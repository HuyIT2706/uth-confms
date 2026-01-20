import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Assignment,
    CheckCircle,
    Close as CloseIcon,
    Search,
    Visibility,
    Description,
    Event,
    ArrowBack,
    Info,
    School,
    Lock,
    LockOpen,
    DocumentScanner,
} from '@mui/icons-material';
import { CircularProgress } from '@mui/material';
import { 
    useGetMyReviewerAssignmentsQuery, 
    useAcceptReviewerAssignmentMutation,
    useRejectReviewerAssignmentMutation,
    useResetReviewerAssignmentStatusMutation,
    useGetReviewerSubmissionsByConferenceQuery,
} from '../../redux/api/assignmentsApi';
import { useGetInvitationsQuery } from '../../redux/api/invitationsApi';
import { showToast } from '../../utils/toast';

interface ReviewerAssignment {
    conferenceAssignmentId: string;
    conferenceId: string;
    submissionId?: string;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    topic?: string;
    submissionInfo?: {
        title?: string;
        abstract?: string;
        keywords?: string[];
    };
    conferenceName?: string;
    reviewDeadline?: string;
    createdAt: string;
    updatedAt: string;
}

type TabType = 'pending' | 'accepted' | 'rejected';

const AssignmentListPage = () => {
    const { data: assignmentsData, isLoading: assignmentsLoading, refetch: refetchAssignments } = useGetMyReviewerAssignmentsQuery();
    const { data: invitationsData, isLoading: invitationsLoading } = useGetInvitationsQuery();
    const [acceptAssignment] = useAcceptReviewerAssignmentMutation();
    const [rejectAssignment] = useRejectReviewerAssignmentMutation();
    const [resetAssignmentStatus] = useResetReviewerAssignmentStatusMutation();
    
    const [searchParams, setSearchParams] = useSearchParams();
    
    const tabFromUrl = (searchParams.get('tab') || 'pending') as TabType;
    const [activeTab, setActiveTab] = useState<TabType>(tabFromUrl);

    useEffect(() => {
        const tab = (searchParams.get('tab') || 'pending') as TabType;
        if (['pending', 'accepted', 'rejected'].includes(tab)) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAssignment, setSelectedAssignment] = useState<ReviewerAssignment | null>(null);
    const [isSubmittingAction, setIsSubmittingAction] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [detailAssignment, setDetailAssignment] = useState<ReviewerAssignment | null>(null);
    const [expandedSubmissions, setExpandedSubmissions] = useState<Record<string, boolean>>({});

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

    // Parse assignments from API
    const assignments: ReviewerAssignment[] = Array.isArray(assignmentsData)
        ? assignmentsData.map((item: any) => {
            const confId = item.conferenceId || '';
            const invitationInfo = invitationsMap[confId] || {};
            return {
                conferenceAssignmentId: item.conferenceAssignmentId || item.id || '',
                conferenceId: confId,
                submissionId: item.submissionId,
                status: (item.status || 'PENDING').toUpperCase() as 'PENDING' | 'ACCEPTED' | 'REJECTED',
                topic: item.topic,
                submissionInfo: item.submissionInfo,
                conferenceName: invitationInfo.conferenceName,
                reviewDeadline: invitationInfo.reviewDeadline,
                createdAt: item.createdAt || new Date().toISOString(),
                updatedAt: item.updatedAt || new Date().toISOString(),
            };
        })
        : [];

    // Filter assignments by tab and search
    const toggleSubmissions = (conferenceId: string) => {
        setExpandedSubmissions(prev => ({
            ...prev,
            [conferenceId]: !prev[conferenceId],
        }));
    };

    const filteredAssignments = assignments.filter((assignment) => {
        const matchesTab = assignment.status === activeTab.toUpperCase();
        const matchesSearch = (assignment.topic || '')
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
            (assignment.submissionInfo?.title || '')
                .toLowerCase()
                .includes(searchTerm.toLowerCase());
        return matchesTab && matchesSearch;
    });

    // Calculate stats
    const stats = {
        pending: assignments.filter((a) => a.status === 'PENDING').length,
        accepted: assignments.filter((a) => a.status === 'ACCEPTED').length,
        rejected: assignments.filter((a) => a.status === 'REJECTED').length,
        total: assignments.length,
    };

    const getStatusColor = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'ACCEPTED':
                return 'text-green-600 bg-green-50 border-green-200';
            case 'PENDING':
                return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'REJECTED':
                return 'text-red-600 bg-red-50 border-red-200';
            default:
                return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'ACCEPTED':
                return 'Đã chấp nhận';
            case 'PENDING':
                return 'Chưa trả lời';
            case 'REJECTED':
                return 'Từ chối';
            default:
                return status;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'ACCEPTED':
                return <CheckCircle className="w-5 h-5" />;
            case 'REJECTED':
                return <CloseIcon className="w-5 h-5" />;
            default:
                return <Assignment className="w-5 h-5" />;
        }
    };

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        } catch {
            return 'N/A';
        }
    };

    const handleAcceptClick = (assignment: ReviewerAssignment) => {
        setSelectedAssignment(assignment);
        handleConfirmAction('accept');
    };

    const handleRejectClick = (assignment: ReviewerAssignment) => {
        setSelectedAssignment(assignment);
        handleConfirmAction('reject');
    };

    const handleRevertToPendingClick = (assignment: ReviewerAssignment) => {
        setSelectedAssignment(assignment);
        handleConfirmAction('pending');
    };

    // Component to display submissions for a conference
    const SubmissionsList = ({ conferenceId, isLocked }: { conferenceId: string; isLocked: boolean }) => {
        const { data: submissionsData, isLoading } = useGetReviewerSubmissionsByConferenceQuery(conferenceId);
        const submissions = Array.isArray(submissionsData) ? submissionsData : [];

        if (isLoading) {
            return (
                <div className="mt-3 p-4 bg-gray-50 rounded-lg flex justify-center">
                    <CircularProgress size={24} />
                </div>
            );
        }

        if (submissions.length === 0) {
            return (
                <div className="mt-3 p-4 bg-gray-50 rounded-lg text-center text-gray-600">
                    Chưa có bài nộp nào
                </div>
            );
        }

        return (
            <div className="mt-3 space-y-2">
                {submissions.map((submission: any) => (
                    <button
                        key={submission.id}
                        onClick={() => {
                            if (isLocked) {
                                showToast.warning('Bạn phải chấp nhận lời mời thì mới xem được danh sách bài nộp');
                                return;
                            }
                            // Navigate to submission list of this conference
                            window.location.href = `/reviewer/submissions/${conferenceId}`;
                        }}
                        disabled={isLocked}
                        className={`w-full text-left p-3 border rounded-lg transition-colors duration-200 group ${
                            isLocked
                                ? 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-50'
                                : 'bg-gray-50 hover:bg-blue-50 border-gray-200 cursor-pointer'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <h4 className={`font-semibold truncate ${
                                    isLocked ? 'text-gray-600' : 'text-gray-900 group-hover:text-blue-600'
                                }`}>
                                    {submission.title || 'Không có tiêu đề'}
                                </h4>
                                {submission.authorName && (
                                    <p className="text-xs text-gray-600 mt-1">
                                        Tác giả: {submission.authorName}
                                    </p>
                                )}
                            </div>
                            <DocumentScanner className={`w-4 h-4 ml-2 flex-shrink-0 ${
                                isLocked ? 'text-gray-400' : 'text-gray-400 group-hover:text-blue-600'
                            }`} />
                        </div>
                    </button>
                ))}
            </div>
        );
    };

    const handleViewDetails = (assignment: ReviewerAssignment) => {
        setDetailAssignment(assignment);
        setShowDetailModal(true);
    };

    const handleConfirmAction = async (action: 'accept' | 'reject' | 'pending') => {
        if (!selectedAssignment) return;

        setIsSubmittingAction(true);
        try {
            const assignmentId = selectedAssignment.conferenceAssignmentId;
            console.log('Performing action:', action, 'on assignmentId:', assignmentId);
            
            if (action === 'accept') {
                const result = await acceptAssignment(assignmentId).unwrap();
                console.log('Accept result:', result);
            } else if (action === 'reject') {
                const result = await rejectAssignment(assignmentId).unwrap();
                console.log('Reject result:', result);
            } else if (action === 'pending') {
                const result = await resetAssignmentStatus(assignmentId).unwrap();
                console.log('Reset result:', result);
            }

            refetchAssignments();
            const messages = {
                accept: 'Đã chấp nhận phân công thành công',
                reject: 'Đã từ chối phân công',
                pending: 'Đã đưa phân công về trạng thái chưa trả lời',
            };
            showToast[action === 'accept' ? 'success' : 'info'](messages[action]);
            setSelectedAssignment(null);
        } catch (error) {
            console.error('Error performing action:', error);
            showToast.error('Có lỗi xảy ra khi cập nhật phân công');
        } finally {
            setIsSubmittingAction(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Section */}
            <div className="bg-gradient-to-br from-[#008689] to-[#006666] py-12 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-white mb-2">
                            Danh sách phân công đánh giá bài báo
                        </h1>
                        <p className="text-white/90">
                            Quản lý các bài báo được giao cho bạn để đánh giá
                        </p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
                            <p className="text-white/80 text-sm mb-1">Tổng cộng</p>
                            <p className="text-3xl font-bold text-white">{stats.total}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
                            <p className="text-white/80 text-sm mb-1">Chưa trả lời</p>
                            <p className="text-3xl font-bold text-white">{stats.pending}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
                            <p className="text-white/80 text-sm mb-1">Đã chấp nhận</p>
                            <p className="text-3xl font-bold text-white">{stats.accepted}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
                            <p className="text-white/80 text-sm mb-1">Từ chối</p>
                            <p className="text-3xl font-bold text-white">{stats.rejected}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search & Tabs */}
            <div className="bg-white py-6 px-6 border-b border-gray-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto">
                    {/* Search */}
                    <div className="mb-6 relative">
                        <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo chuyên đề hoặc tiêu đề bài báo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008689] focus:border-transparent"
                        />
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 border-b border-gray-200">
                        <button
                            onClick={() => {
                                setActiveTab('pending');
                                setSearchParams({ tab: 'pending' });
                            }}
                            className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
                                activeTab === 'pending'
                                    ? 'text-[#008689] border-[#008689]'
                                    : 'text-gray-600 border-transparent hover:text-gray-900'
                            }`}
                        >
                            Chưa trả lời
                            <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">
                                {stats.pending}
                            </span>
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('accepted');
                                setSearchParams({ tab: 'accepted' });
                            }}
                            className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
                                activeTab === 'accepted'
                                    ? 'text-[#008689] border-[#008689]'
                                    : 'text-gray-600 border-transparent hover:text-gray-900'
                            }`}
                        >
                            Đã chấp nhận
                            <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                                {stats.accepted}
                            </span>
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('rejected');
                                setSearchParams({ tab: 'rejected' });
                            }}
                            className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
                                activeTab === 'rejected'
                                    ? 'text-[#008689] border-[#008689]'
                                    : 'text-gray-600 border-transparent hover:text-gray-900'
                            }`}
                        >
                            Từ chối
                            <span className="ml-2 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                                {stats.rejected}
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="py-8 px-6">
                <div className="max-w-7xl mx-auto">
                    {assignmentsLoading || invitationsLoading ? (
                        <div className="bg-white rounded-xl shadow-md p-12 flex justify-center items-center min-h-96">
                            <CircularProgress />
                        </div>
                    ) : filteredAssignments.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-md p-12 text-center">
                            <Assignment className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                Không tìm thấy phân công
                            </h3>
                            <p className="text-gray-600">
                                {searchTerm
                                    ? 'Hãy thử điều chỉnh từ khóa tìm kiếm'
                                    : `Chưa có phân công trong mục "${activeTab}"`}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredAssignments.map((assignment) => (
                                <div
                                    key={assignment.conferenceAssignmentId}
                                    className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border-l-4"
                                    style={{
                                        borderLeftColor:
                                            assignment.status === 'ACCEPTED'
                                                ? '#10b981'
                                                : assignment.status === 'REJECTED'
                                                ? '#ef4444'
                                                : '#f59e0b',
                                    }}
                                >
                                    <div className="p-6">
                                        {/* Top Row - Title & Status */}
                                        <div className="flex items-start justify-between gap-4 mb-4">
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                                    {assignment.conferenceName || 'Hội nghị không xác định'}
                                                </h3>
                                                {assignment.topic && (
                                                    <p className="text-sm text-gray-600 mb-2">
                                                        <span className="font-semibold">Chuyên đề:</span> {assignment.topic}
                                                    </p>
                                                )}
                                                {assignment.submissionInfo?.title && (
                                                    <p className="text-sm text-gray-600 mb-2">
                                                        <span className="font-semibold">Bài báo:</span> {assignment.submissionInfo.title}
                                                    </p>
                                                )}
                                            </div>
                                            <div
                                                className={`flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(
                                                    assignment.status
                                                )}`}
                                            >
                                                {getStatusIcon(assignment.status)}
                                                {getStatusLabel(assignment.status)}
                                            </div>
                                        </div>

                                        {/* Middle Row - Info */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pb-4 border-b border-gray-200">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Event className="w-4 h-4" />
                                                <span className="text-sm">
                                                    Nhận phân công: {formatDate(assignment.createdAt)}
                                                </span>
                                            </div>
                                            {assignment.reviewDeadline && (
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Event className="w-4 h-4" />
                                                    <span className="text-sm">
                                                        Deadline đánh giá: {formatDate(assignment.reviewDeadline)}
                                                    </span>
                                                </div>
                                            )}
                                            {assignment.updatedAt && assignment.updatedAt !== assignment.createdAt && (
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Event className="w-4 h-4" />
                                                    <span className="text-sm">
                                                        Cập nhật: {formatDate(assignment.updatedAt)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Keywords Display */}
                                        {assignment.submissionInfo?.keywords && assignment.submissionInfo.keywords.length > 0 && (
                                            <div className="mb-4 pb-4 border-b border-gray-200">
                                                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                                                    Từ khóa
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {assignment.submissionInfo.keywords.map((keyword, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="px-3 py-1 bg-[#008689]/10 text-[#008689] rounded-full text-sm font-medium"
                                                        >
                                                            {keyword}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Submissions List */}
                                        <div className="mb-4 pb-4 border-b border-gray-200">
                                            <button
                                                onClick={() => {
                                                    if (assignment.status === 'PENDING') {
                                                        showToast.warning('Bạn phải chấp nhận lời mời thì mới xem được danh sách bài nộp');
                                                        return;
                                                    }
                                                    toggleSubmissions(assignment.conferenceId);
                                                }}
                                                disabled={assignment.status === 'PENDING'}
                                                className={`w-full flex items-center justify-between p-3 rounded-lg font-semibold transition-colors ${
                                                    assignment.status === 'PENDING'
                                                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                                        : 'bg-[#008689]/10 text-[#008689] hover:bg-[#008689]/20'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {assignment.status === 'PENDING' ? (
                                                        <Lock className="w-4 h-4" />
                                                    ) : (
                                                        <LockOpen className="w-4 h-4" />
                                                    )}
                                                    <DocumentScanner className="w-4 h-4" />
                                                    Danh sách bài nộp
                                                </div>
                                                <span className="text-xs bg-[#008689]/20 px-2 py-1 rounded-full">
                                                    {assignment.status === 'PENDING' ? '🔒 Khóa' : '🔓 Mở'}
                                                </span>
                                            </button>
                                            
                                            {expandedSubmissions[assignment.conferenceId] && assignment.status === 'ACCEPTED' && (
                                                <SubmissionsList conferenceId={assignment.conferenceId} isLocked={false} />
                                            )}
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex items-center justify-between gap-3">
                                            <button
                                                onClick={() => handleViewDetails(assignment)}
                                                className="px-4 py-2 border-2 border-[#008689] text-[#008689] rounded-lg hover:bg-[#008689]/10 transition-colors font-semibold flex items-center gap-2"
                                            >
                                                <Visibility className="w-4 h-4" />
                                                Xem chi tiết
                                            </button>
                                            <div className="flex items-center gap-3">
                                                {assignment.status === 'PENDING' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleRejectClick(assignment)}
                                                            disabled={isSubmittingAction}
                                                            className="px-4 py-2 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-semibold disabled:opacity-50"
                                                        >
                                                            <CloseIcon className="w-4 h-4 inline mr-2" />
                                                            Từ chối
                                                        </button>
                                                        <button
                                                            onClick={() => handleAcceptClick(assignment)}
                                                            disabled={isSubmittingAction}
                                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 flex items-center gap-2"
                                                        >
                                                            {isSubmittingAction ? (
                                                                <>
                                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                                    Đang xử lý...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <CheckCircle className="w-4 h-4" />
                                                                    Chấp nhận
                                                                </>
                                                            )}
                                                        </button>
                                                    </>
                                                )}
                                                {assignment.status === 'ACCEPTED' && (
                                                    <button
                                                        onClick={() => handleRevertToPendingClick(assignment)}
                                                        disabled={isSubmittingAction}
                                                        className="px-4 py-2 border-2 border-orange-500 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors font-semibold disabled:opacity-50 flex items-center gap-2"
                                                    >
                                                        <ArrowBack className="w-4 h-4" />
                                                        Về trạng thái chưa trả lời
                                                    </button>
                                                )}
                                                {assignment.status === 'REJECTED' && (
                                                    <button
                                                        onClick={() => handleRevertToPendingClick(assignment)}
                                                        disabled={isSubmittingAction}
                                                        className="px-4 py-2 border-2 border-orange-500 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors font-semibold disabled:opacity-50 flex items-center gap-2"
                                                    >
                                                        <ArrowBack className="w-4 h-4" />
                                                        Về trạng thái chưa trả lời
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Detail Modal */}
            {showDetailModal && detailAssignment && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDetailModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="bg-gradient-to-r from-[#008689] to-[#006666] px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <Info className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Chi tiết phân công</h2>
                                    <p className="text-white/90 text-sm">
                                        {detailAssignment.conferenceName || 'Hội nghị không xác định'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
                            >
                                <CloseIcon className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="overflow-y-auto flex-1 p-6">
                            <div className="space-y-6">
                                {/* Conference Name */}
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Description className="w-5 h-5 text-[#008689]" />
                                        <h3 className="text-lg font-bold text-gray-900">Hội nghị</h3>
                                    </div>
                                    <p className="text-gray-700 leading-relaxed text-lg font-semibold">
                                        {detailAssignment.conferenceName || 'Không xác định'}
                                    </p>
                                </div>

                                {/* Review Deadline */}
                                {detailAssignment.reviewDeadline && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <Event className="w-5 h-5 text-[#008689]" />
                                            <h3 className="text-lg font-bold text-gray-900">Deadline đánh giá</h3>
                                        </div>
                                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                            <p className="text-orange-900 font-medium text-lg">{formatDate(detailAssignment.reviewDeadline)}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Submissions List */}
                                {detailAssignment.status === 'PENDING' ? (
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <Lock className="w-5 h-5 text-gray-500" />
                                            <h3 className="text-lg font-bold text-gray-900">Danh sách bài nộp</h3>
                                        </div>
                                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-gray-600">
                                            🔒 Khóa - Chấp nhận lời mời để xem danh sách bài nộp
                                        </div>
                                    </div>
                                ) : (
                                    <SubmissionsList conferenceId={detailAssignment.conferenceId} isLocked={false} />
                                )}

                                {/* Topic */}
                                {detailAssignment.topic && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <School className="w-5 h-5 text-[#008689]" />
                                            <h3 className="text-lg font-bold text-gray-900">Chuyên đề</h3>
                                        </div>
                                        <span className="px-4 py-2 bg-gradient-to-r from-[#008689] to-[#006666] text-white rounded-lg text-sm font-medium inline-block">
                                            {detailAssignment.topic}
                                        </span>
                                    </div>
                                )}

                                {/* Abstract */}
                                {detailAssignment.submissionInfo?.abstract && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <Description className="w-5 h-5 text-[#008689]" />
                                            <h3 className="text-lg font-bold text-gray-900">Tóm tắt</h3>
                                        </div>
                                        <p className="text-gray-700 leading-relaxed">
                                            {detailAssignment.submissionInfo.abstract}
                                        </p>
                                    </div>
                                )}

                                {/* Keywords */}
                                {detailAssignment.submissionInfo?.keywords && detailAssignment.submissionInfo.keywords.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <School className="w-5 h-5 text-[#008689]" />
                                            <h3 className="text-lg font-bold text-gray-900">Từ khóa</h3>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {detailAssignment.submissionInfo.keywords.map((keyword, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-4 py-2 bg-[#008689]/10 text-[#008689] rounded-lg text-sm font-medium"
                                                >
                                                    {keyword}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Assignment Info */}
                                <div className="border-t border-gray-200 pt-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <p className="text-gray-500 mb-1">Ngày nhận phân công</p>
                                            <p className="font-medium text-gray-900">{formatDate(detailAssignment.createdAt)}</p>
                                        </div>
                                        {detailAssignment.reviewDeadline && (
                                            <div>
                                                <p className="text-gray-500 mb-1">Deadline đánh giá</p>
                                                <p className="font-medium text-orange-700">{formatDate(detailAssignment.reviewDeadline)}</p>
                                            </div>
                                        )}
                                        {detailAssignment.updatedAt && detailAssignment.updatedAt !== detailAssignment.createdAt && (
                                            <div>
                                                <p className="text-gray-500 mb-1">Ngày cập nhật</p>
                                                <p className="font-medium text-gray-900">{formatDate(detailAssignment.updatedAt)}</p>
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-gray-500 mb-1">Trạng thái</p>
                                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(detailAssignment.status)}`}>
                                                {getStatusIcon(detailAssignment.status)}
                                                {getStatusLabel(detailAssignment.status)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3">
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
                            >
                                Đóng
                            </button>
                            {detailAssignment.status === 'PENDING' && (
                                <>
                                    <button
                                        onClick={() => {
                                            setShowDetailModal(false);
                                            handleRejectClick(detailAssignment);
                                        }}
                                        className="px-6 py-2 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-semibold flex items-center gap-2"
                                    >
                                        <CloseIcon className="w-4 h-4" />
                                        Từ chối
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowDetailModal(false);
                                            handleAcceptClick(detailAssignment);
                                        }}
                                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center gap-2"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        Chấp nhận
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssignmentListPage;
