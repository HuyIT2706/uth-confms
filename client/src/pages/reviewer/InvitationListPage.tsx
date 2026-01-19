import { useState } from 'react';
import {
    MailOutline,
    CheckCircle,
    Close as CloseIcon,
    MoreVert,
    Info,
    CalendarToday,
    Search,
} from '@mui/icons-material';
import { useGetInvitationsQuery } from '../../redux/api/invitationsApi';
import { mockInvitations } from '../../mockData/reviewerMockData';

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
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'REVOKED';
    invitationDate: string;
    responseDate?: string;
    topics?: { id: string; name: string }[];
    selectedTopics?: string[];
}

type TabType = 'pending' | 'accepted' | 'rejected';

const InvitationListPage = () => {
    // Use mock data
    const invitationsData = mockInvitations;
    const [activeTab, setActiveTab] = useState<TabType>('pending');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedInvitation, setSelectedInvitation] = useState<Invitation | null>(null);
    const [showTopicModal, setShowTopicModal] = useState(false);
    const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
    const [isSubmittingAction, setIsSubmittingAction] = useState(false);

    // Parse invitations
    const invitations: Invitation[] = Array.isArray(invitationsData)
        ? invitationsData.map((item: any) => ({
            id: item.id || item.uuid || '',
            uuid: item.uuid,
            conferenceId: item.conferenceId || item.conference?.id || '',
            conference: item.conference,
            conferenceName: item.conferenceName || item.conference?.name || 'Unknown',
            status: item.status || 'PENDING',
            invitationDate: item.invitationDate || item.createdAt || new Date().toISOString(),
            responseDate: item.responseDate || item.updatedAt,
            topics: item.topics || item.conference?.topics || [],
            selectedTopics: item.selectedTopics || [],
        }))
        : (invitationsData as any)?.data || [];

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
        if (invitation.topics && invitation.topics.length > 0) {
            setSelectedInvitation(invitation);
            setSelectedTopics([]);
            setShowTopicModal(true);
        } else {
            handleConfirmAction('ACCEPT');
        }
    };

    const handleConfirmTopics = async () => {
        if (selectedInvitation && selectedTopics.length > 0) {
            setIsSubmittingAction(true);
            try {
                // TODO: Call API to accept invitation with topics
                // await acceptInvitation({ invitationId: selectedInvitation.id, topics: selectedTopics });
                await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
                setShowTopicModal(false);
                // Refetch invitations
                alert('Bạn đã chấp nhận lời mời và chọn chuyên đề');
            } catch (error) {
                alert('Có lỗi xảy ra khi chấp nhận lời mời');
            } finally {
                setIsSubmittingAction(false);
            }
        } else {
            alert('Vui lòng chọn ít nhất một chuyên đề');
        }
    };

    const handleRejectClick = (invitation: Invitation) => {
        if (window.confirm(`Bạn có chắc chắn muốn từ chối lời mời từ ${invitation.conferenceName}?`)) {
            handleConfirmAction('REJECT');
        }
    };

    const handleConfirmAction = async (action: string) => {
        setIsSubmittingAction(true);
        try {
            // TODO: Call API for action
            // await updateInvitation({ invitationId: selectedInvitation?.id, status: action });
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
            alert(`Lời mời đã được ${action === 'ACCEPT' ? 'chấp nhận' : 'từ chối'}`);
            // Refetch invitations
        } catch (error) {
            alert('Có lỗi xảy ra');
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
                            onClick={() => setActiveTab('pending')}
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
                            onClick={() => setActiveTab('accepted')}
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
                            onClick={() => setActiveTab('rejected')}
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
                    {filteredInvitations.length === 0 ? (
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
                                        <div className="flex items-center justify-end gap-3">
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
                                            {invitation.status !== 'PENDING' && (
                                                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold flex items-center gap-2">
                                                    <MoreVert className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Topic Selection Modal */}
            {showTopicModal && selectedInvitation && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-[#008689] to-[#006666] px-8 py-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-white">Chọn chuyên đề</h2>
                                <p className="text-white/90 text-sm">
                                    {selectedInvitation.conferenceName}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowTopicModal(false)}
                                className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
                            >
                                <CloseIcon className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="px-8 py-6">
                            <p className="text-gray-700 mb-6">
                                Vui lòng chọn một hoặc nhiều chuyên đề bạn có thể đánh giá:
                            </p>

                            {selectedInvitation.topics && selectedInvitation.topics.length > 0 ? (
                                <div className="space-y-3 max-h-96 overflow-y-auto mb-6">
                                    {selectedInvitation.topics.map((topic) => (
                                        <label
                                            key={topic.id}
                                            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedTopics.includes(topic.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedTopics((prev) => [...prev, topic.id]);
                                                    } else {
                                                        setSelectedTopics((prev) =>
                                                            prev.filter((id) => id !== topic.id)
                                                        );
                                                    }
                                                }}
                                                className="w-5 h-5 rounded accent-[#008689]"
                                            />
                                            <span className="font-medium text-gray-900">{topic.name}</span>
                                        </label>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                    <Info className="w-5 h-5 text-blue-600 inline mr-2" />
                                    <span className="text-blue-900">
                                        Không có chuyên đề nào cho hội nghị này
                                    </span>
                                </div>
                            )}

                            {/* Selected count */}
                            <div className="text-sm text-gray-600 mb-6">
                                Đã chọn: <span className="font-semibold">{selectedTopics.length}</span> chuyên đề
                            </div>

                            {/* Modal Actions */}
                            <div className="flex gap-4 justify-end">
                                <button
                                    onClick={() => setShowTopicModal(false)}
                                    className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleConfirmTopics}
                                    disabled={isSubmittingAction || selectedTopics.length === 0}
                                    className="px-6 py-2 bg-[#008689] text-white rounded-lg hover:bg-[#006666] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isSubmittingAction ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Đang xử lý...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-5 h-5" />
                                            Chấp nhận & Xác nhận
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InvitationListPage;
