import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    MailOutline,
    CheckCircle,
    Close as CloseIcon,
    MoreVert,
    Info,
    CalendarToday,
    Search,
    ArrowBack,
    Visibility,
    Description,
    Event,
    Schedule,
    School,
} from '@mui/icons-material';
import { CircularProgress } from '@mui/material';
import { useGetInvitationsQuery, useUpdateInvitationStatusMutation } from '../../redux/api/invitationsApi';
import { showToast } from '../../utils/toast';

interface Invitation {
    id: string;
    uuid?: string;
    conferenceId: string;
    conference?: { 
        name: string; 
        acronym: string; 
        id: string;
        startDate?: string;
        endDate?: string;
    };
    conferenceName: string;
    acronym?: string;
    conferenceDescription?: string;
    startDate?: string;
    endDate?: string;
    deadlines?: {
        submission?: string;
        review?: string;
        cameraReady?: string;
    };
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'REVOKED';
    invitationDate: string;
    responseDate?: string;
    topics?: string[];
    selectedTopics?: string[];
    raw?: any;
}

type TabType = 'pending' | 'accepted' | 'rejected';

const InvitationListPage = () => {
    // Use real API
    const { data: invitationsData, isLoading, refetch } = useGetInvitationsQuery();
    const [updateInvitationStatus] = useUpdateInvitationStatusMutation();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    
    // Lấy tab từ URL query param, mặc định là 'pending'
    const tabFromUrl = (searchParams.get('tab') || 'pending') as TabType;
    const [activeTab, setActiveTab] = useState<TabType>(tabFromUrl);

    // Sync activeTab với URL query param
    useEffect(() => {
        const tab = (searchParams.get('tab') || 'pending') as TabType;
        if (['pending', 'accepted', 'rejected'].includes(tab)) {
            setActiveTab(tab);
        }
    }, [searchParams]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedInvitation, setSelectedInvitation] = useState<Invitation | null>(null);
    const [isSubmittingAction, setIsSubmittingAction] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [detailInvitation, setDetailInvitation] = useState<Invitation | null>(null);

    // Parse invitations from API
    const invitations: Invitation[] = Array.isArray(invitationsData)
        ? invitationsData.map((item: any) => ({
            id: item.id || item.uuid || '',
            uuid: item.uuid,
            conferenceId: item.conferenceId || item.conference?.id || '',
            conference: item.conference,
            conferenceName: item.conferenceName || item.conference?.name || item.raw?.conference?.name || 'Unknown',
            acronym: item.acronym || item.conference?.acronym || item.raw?.conference?.acronym,
            conferenceDescription: item.conferenceDescription || item.conference?.description || item.raw?.conference?.description,
            startDate: item.startDate || item.conference?.startDate || item.raw?.conference?.startDate,
            endDate: item.endDate || item.conference?.endDate || item.raw?.conference?.endDate,
            deadlines: item.deadlines || item.raw?.conference?.deadlines,
            status: (item.status || 'pending').toUpperCase() as 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'REVOKED',
            invitationDate: item.invitationDate || item.createdAt || new Date().toISOString(),
            responseDate: item.responseDate || item.updatedAt,
            topics: Array.isArray(item.topics)
                ? item.topics.map((t: any) => String(t))
                : Array.isArray(item.conference?.topics)
                    ? item.conference.topics.map((t: any) => String(t))
                    : Array.isArray(item.raw?.conference?.topics)
                        ? item.raw.conference.topics.map((t: any) => String(t))
                        : [],
            // Chỉ hiển thị selectedTopics khi status không phải PENDING
            selectedTopics: (item.status || 'pending').toLowerCase() === 'pending' 
                ? [] 
                : (item.selectedTopics || item.reviewerTopics || []),
            raw: item.raw,
        }))
        : [];

    // Filter invitations by tab and search
    const filteredInvitations = invitations.filter((inv) => {
        const matchesTab = inv.status.toUpperCase() === activeTab.toUpperCase();
        const matchesSearch = inv.conferenceName
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        return matchesTab && matchesSearch;
    });

    // Calculate stats
    const stats = {
        pending: invitations.filter((i) => i.status === 'PENDING').length,
        accepted: invitations.filter((i) => i.status === 'ACCEPTED').length,
        rejected: invitations.filter((i) => i.status === 'REJECTED').length,
        total: invitations.length,
    };

    const getStatusColor = (status: string) => {
        switch (status.toUpperCase()) {
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
        switch (status.toUpperCase()) {
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
        switch (status.toUpperCase()) {
            case 'ACCEPTED':
                return <CheckCircle className="w-5 h-5" />;
            case 'REJECTED':
                return <CloseIcon className="w-5 h-5" />;
            default:
                return <MailOutline className="w-5 h-5" />;
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

    const handleAcceptClick = (invitation: Invitation) => {
        setSelectedInvitation(invitation);
        handleConfirmAction('accept');
    };

    const handleRejectClick = (invitation: Invitation) => {
        setSelectedInvitation(invitation);
        handleConfirmAction('reject');
    };

    const handleRevertToPendingClick = (invitation: Invitation) => {
        setSelectedInvitation(invitation);
        handleConfirmAction('pending');
    };

    const handleViewDetails = (invitation: Invitation) => {
        setDetailInvitation(invitation);
        setShowDetailModal(true);
    };

    const handleConfirmAction = async (action: 'accept' | 'reject' | 'pending') => {
        if (!selectedInvitation) return;
        
        setIsSubmittingAction(true);
        try {
            // Call API for action
            await updateInvitationStatus({
                invitationId: selectedInvitation.id,
                action,
            }).unwrap();
            
            refetch();
            const messages = {
                accept: 'Đã chấp nhận lời mời thành công',
                reject: 'Đã từ chối lời mời',
                pending: 'Đã đưa lời mời về trạng thái chưa trả lời',
            };
            showToast[action === 'accept' ? 'success' : 'info'](messages[action]);
            setSelectedInvitation(null);
        } catch (error) {
            showToast.error('Có lỗi xảy ra khi cập nhật lời mời');
            console.error(error);
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
                        <h1 className="text-4xl font-bold text-white mb-2">Lời mời hội nghị</h1>
                        <p className="text-white/90">
                            Quản lý lời mời tham gia đánh giá từ các hội nghị khoa học
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
                            placeholder="Tìm kiếm hội nghị..."
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
                    {isLoading ? (
                        <div className="bg-white rounded-xl shadow-md p-12 flex justify-center items-center min-h-96">
                            <CircularProgress />
                        </div>
                    ) : filteredInvitations.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-md p-12 text-center">
                            <MailOutline className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                Không tìm thấy lời mời
                            </h3>
                            <p className="text-gray-600">
                                {searchTerm
                                    ? 'Hãy thử điều chỉnh từ khóa tìm kiếm'
                                    : `Chưa có lời mời trong mục "${activeTab}"`}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredInvitations.map((invitation) => (
                                <div
                                    key={invitation.id}
                                    className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border-l-4"
                                    style={{
                                        borderLeftColor:
                                            invitation.status === 'ACCEPTED'
                                                ? '#10b981'
                                                : invitation.status === 'REJECTED'
                                                ? '#ef4444'
                                                : '#f59e0b',
                                    }}
                                >
                                    <div className="p-6">
                                        {/* Top Row - Title & Status */}
                                        <div className="flex items-start justify-between gap-4 mb-4">
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                                    {invitation.conferenceName}
                                                    {invitation.conference?.acronym && (
                                                        <span className="text-sm font-normal text-gray-600 ml-2">
                                                            ({invitation.conference.acronym})
                                                        </span>
                                                    )}
                                                </h3>
                                            </div>
                                            <div
                                                className={`flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(
                                                    invitation.status
                                                )}`}
                                            >
                                                {getStatusIcon(invitation.status)}
                                                {getStatusLabel(invitation.status)}
                                            </div>
                                        </div>

                                        {/* Middle Row - Info */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pb-4 border-b border-gray-200">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <CalendarToday className="w-4 h-4" />
                                                <span className="text-sm">
                                                    Nhận lời mời: {formatDate(invitation.invitationDate)}
                                                </span>
                                            </div>
                                            {invitation.responseDate && (
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <CalendarToday className="w-4 h-4" />
                                                    <span className="text-sm">
                                                        Phản hồi: {formatDate(invitation.responseDate)}
                                                    </span>
                                                </div>
                                            )}
                                            {invitation.selectedTopics && invitation.selectedTopics.length > 0 && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-[#008689]">
                                                        {invitation.selectedTopics.length} chuyên đề đã chọn
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Topics Display */}
                                        {invitation.selectedTopics && invitation.selectedTopics.length > 0 && (
                                            <div className="mb-4 pb-4 border-b border-gray-200">
                                                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                                                    Các chuyên đề đã chọn
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {invitation.selectedTopics.map((topic, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="px-3 py-1 bg-[#008689]/10 text-[#008689] rounded-full text-sm font-medium"
                                                        >
                                                            {topic}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="flex items-center justify-between gap-3">
                                            <button
                                                onClick={() => handleViewDetails(invitation)}
                                                className="px-4 py-2 border-2 border-[#008689] text-[#008689] rounded-lg hover:bg-[#008689]/10 transition-colors font-semibold flex items-center gap-2"
                                            >
                                                <Visibility className="w-4 h-4" />
                                                Xem chi tiết
                                            </button>
                                            <div className="flex items-center gap-3">
                                            {invitation.status === 'PENDING' && (
                                                <>
                                                    <button
                                                        onClick={() => handleRejectClick(invitation)}
                                                        disabled={isSubmittingAction}
                                                        className="px-4 py-2 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-semibold disabled:opacity-50"
                                                    >
                                                        <CloseIcon className="w-4 h-4 inline mr-2" />
                                                        Từ chối
                                                    </button>
                                                    <button
                                                        onClick={() => handleAcceptClick(invitation)}
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
                                            {invitation.status === 'ACCEPTED' && (
                                                <div className="flex items-center gap-3">
                                                    {invitation.topics && invitation.topics.length > 0 && (
                                                        <button
                                                            onClick={() => navigate(`/reviewer/invitations/${invitation.id}/topics`)}
                                                            className="px-4 py-2 bg-[#008689] text-white rounded-lg hover:bg-[#006666] transition-colors font-semibold flex items-center gap-2"
                                                        >
                                                            <MoreVert className="w-4 h-4" />
                                                            Khai báo chuyên môn
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleRevertToPendingClick(invitation)}
                                                        disabled={isSubmittingAction}
                                                        className="px-4 py-2 border-2 border-orange-500 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors font-semibold disabled:opacity-50 flex items-center gap-2"
                                                    >
                                                        <ArrowBack className="w-4 h-4" />
                                                        Về trạng thái chưa trả lời
                                                    </button>
                                                </div>
                                            )}
                                            {invitation.status === 'REJECTED' && (
                                                <button
                                                    onClick={() => handleRevertToPendingClick(invitation)}
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
            {showDetailModal && detailInvitation && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDetailModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="bg-gradient-to-r from-[#008689] to-[#006666] px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <Info className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Chi tiết hội nghị</h2>
                                    <p className="text-white/90 text-sm">
                                        {detailInvitation.conferenceName}
                                        {detailInvitation.acronym && ` (${detailInvitation.acronym})`}
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
                                {/* Description */}
                                {detailInvitation.conferenceDescription && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <Description className="w-5 h-5 text-[#008689]" />
                                            <h3 className="text-lg font-bold text-gray-900">Mô tả</h3>
                                        </div>
                                        <p className="text-gray-700 leading-relaxed">
                                            {detailInvitation.conferenceDescription}
                                        </p>
                                    </div>
                                )}

                                {/* Dates */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {detailInvitation.startDate && (
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Event className="w-5 h-5 text-[#008689]" />
                                                <h4 className="font-semibold text-gray-900">Ngày bắt đầu</h4>
                                            </div>
                                            <p className="text-gray-700">{formatDate(detailInvitation.startDate)}</p>
                                        </div>
                                    )}
                                    {detailInvitation.endDate && (
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Event className="w-5 h-5 text-[#008689]" />
                                                <h4 className="font-semibold text-gray-900">Ngày kết thúc</h4>
                                            </div>
                                            <p className="text-gray-700">{formatDate(detailInvitation.endDate)}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Deadlines */}
                                {detailInvitation.deadlines && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <Schedule className="w-5 h-5 text-[#008689]" />
                                            <h3 className="text-lg font-bold text-gray-900">Thời hạn</h3>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {detailInvitation.deadlines.submission && (
                                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                                    <p className="text-xs font-semibold text-blue-700 uppercase mb-1">Nộp bài</p>
                                                    <p className="text-blue-900 font-medium">{formatDate(detailInvitation.deadlines.submission)}</p>
                                                </div>
                                            )}
                                            {detailInvitation.deadlines.review && (
                                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                                    <p className="text-xs font-semibold text-orange-700 uppercase mb-1">Đánh giá</p>
                                                    <p className="text-orange-900 font-medium">{formatDate(detailInvitation.deadlines.review)}</p>
                                                </div>
                                            )}
                                            {detailInvitation.deadlines.cameraReady && (
                                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                                    <p className="text-xs font-semibold text-green-700 uppercase mb-1">Camera Ready</p>
                                                    <p className="text-green-900 font-medium">{formatDate(detailInvitation.deadlines.cameraReady)}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Topics */}
                                {detailInvitation.topics && detailInvitation.topics.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <School className="w-5 h-5 text-[#008689]" />
                                            <h3 className="text-lg font-bold text-gray-900">Chuyên đề</h3>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {detailInvitation.topics.map((topic, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-4 py-2 bg-gradient-to-r from-[#008689] to-[#006666] text-white rounded-lg text-sm font-medium"
                                                >
                                                    {topic}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Invitation Info */}
                                <div className="border-t border-gray-200 pt-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-gray-500 mb-1">Ngày nhận lời mời</p>
                                            <p className="font-medium text-gray-900">{formatDate(detailInvitation.invitationDate)}</p>
                                        </div>
                                        {detailInvitation.responseDate && (
                                            <div>
                                                <p className="text-gray-500 mb-1">Ngày phản hồi</p>
                                                <p className="font-medium text-gray-900">{formatDate(detailInvitation.responseDate)}</p>
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-gray-500 mb-1">Trạng thái</p>
                                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(detailInvitation.status)}`}>
                                                {getStatusIcon(detailInvitation.status)}
                                                {getStatusLabel(detailInvitation.status)}
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
                            {detailInvitation.status === 'PENDING' && (
                                <>
                                    <button
                                        onClick={() => {
                                            setShowDetailModal(false);
                                            handleRejectClick(detailInvitation);
                                        }}
                                        className="px-6 py-2 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-semibold flex items-center gap-2"
                                    >
                                        <CloseIcon className="w-4 h-4" />
                                        Từ chối
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowDetailModal(false);
                                            handleAcceptClick(detailInvitation);
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

export default InvitationListPage;
