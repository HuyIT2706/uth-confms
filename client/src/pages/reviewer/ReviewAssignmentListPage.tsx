import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Search,
    RateReview,
    Schedule,
    CheckCircle,
    Close as CloseIcon,
    ArrowForward,
    CalendarMonth,
} from '@mui/icons-material';
import { useGetMyAssignmentsQuery } from '../../redux/api/reviewsApi';
import { mockAssignments } from '../../mockData/reviewerMockData';

interface Assignment {
    id: string;
    uuid?: string;
    submissionId: string;
    submission?: { title: string; id: string };
    submissionTitle: string;
    conferenceId: string;
    conference?: { name: string; acronym: string; id: string };
    conferenceName: string;
    status: 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'REJECTED';
    deadline: string;
}

type FilterStatus = 'ALL' | 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'REJECTED';

const ReviewAssignmentListPage = () => {
    // Use mock data
    const assignmentsData = mockAssignments;
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Parse assignments
    const assignments: Assignment[] = Array.isArray(assignmentsData)
        ? assignmentsData.map((item: any) => ({
            id: item.id || item.uuid || '',
            uuid: item.uuid,
            submissionId: item.submissionId || item.submission?.id || '',
            submission: item.submission,
            submissionTitle: item.submissionTitle || item.submission?.title || 'Untitled',
            conferenceId: item.conferenceId || item.conference?.id || '',
            conference: item.conference,
            conferenceName: item.conferenceName || item.conference?.name || 'Unknown',
            status: item.status || 'PENDING',
            deadline: item.deadline || new Date().toISOString(),
        }))
        : (assignmentsData as any)?.data || [];

    // Filter assignments
    const filteredAssignments = assignments.filter((assignment) => {
        const matchesSearch =
            assignment.submissionTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
            assignment.conferenceName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'ALL' || assignment.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    // Calculate stats
    const stats = {
        total: assignments.length,
        pending: assignments.filter((a) => a.status === 'PENDING' || a.status === 'ACCEPTED').length,
        completed: assignments.filter((a) => a.status === 'COMPLETED').length,
        rejected: assignments.filter((a) => a.status === 'REJECTED').length,
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return 'text-green-600 bg-green-50 border-green-200';
            case 'PENDING':
                return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'ACCEPTED':
                return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'REJECTED':
                return 'text-red-600 bg-red-50 border-red-200';
            default:
                return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return 'Hoàn thành';
            case 'PENDING':
                return 'Chưa xử lý';
            case 'ACCEPTED':
                return 'Đã chấp nhận';
            case 'REJECTED':
                return 'Từ chối';
            default:
                return status;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return <CheckCircle className="w-5 h-5" />;
            case 'REJECTED':
                return <CloseIcon className="w-5 h-5" />;
            case 'ACCEPTED':
                return <RateReview className="w-5 h-5" />;
            default:
                return <Schedule className="w-5 h-5" />;
        }
    };

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            const today = new Date();
            const diffTime = date.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays < 0) return `Quá hạn ${Math.abs(diffDays)} ngày`;
            if (diffDays === 0) return 'Hôm nay';
            if (diffDays === 1) return 'Ngày mai';
            return date.toLocaleDateString('vi-VN');
        } catch {
            return 'N/A';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Section */}
            <div className="bg-gradient-to-br from-[#008689] to-[#006666] py-12 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2">
                                Bài báo được giao
                            </h1>
                            <p className="text-white/90">
                                Quản lý và đánh giá các bài báo được giao từ các hội nghị
                            </p>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
                            <p className="text-white/80 text-sm mb-1">Tổng cộng</p>
                            <p className="text-3xl font-bold text-white">{stats.total}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
                            <p className="text-white/80 text-sm mb-1">Đang chờ</p>
                            <p className="text-3xl font-bold text-white">{stats.pending}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
                            <p className="text-white/80 text-sm mb-1">Hoàn thành</p>
                            <p className="text-3xl font-bold text-white">{stats.completed}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
                            <p className="text-white/80 text-sm mb-1">Từ chối</p>
                            <p className="text-3xl font-bold text-white">{stats.rejected}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter & Search Section */}
            <div className="bg-white py-6 px-6 border-b border-gray-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col lg:flex-row gap-4 items-end justify-between">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm bài báo hoặc hội nghị..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008689] focus:border-transparent"
                            />
                        </div>

                        {/* Filters */}
                        <div className="flex gap-2 flex-wrap">
                            <button
                                onClick={() => setFilterStatus('ALL')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                    filterStatus === 'ALL'
                                        ? 'bg-[#008689] text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Tất cả
                            </button>
                            <button
                                onClick={() => setFilterStatus('PENDING')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                    filterStatus === 'PENDING'
                                        ? 'bg-orange-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Đang chờ
                            </button>
                            <button
                                onClick={() => setFilterStatus('ACCEPTED')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                    filterStatus === 'ACCEPTED'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Đã chấp nhận
                            </button>
                            <button
                                onClick={() => setFilterStatus('COMPLETED')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                    filterStatus === 'COMPLETED'
                                        ? 'bg-green-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Hoàn thành
                            </button>
                        </div>

                        {/* View Mode Toggle */}
                        <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`px-3 py-2 rounded transition-all ${
                                    viewMode === 'grid'
                                        ? 'bg-white text-[#008689] shadow'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                Grid
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-3 py-2 rounded transition-all ${
                                    viewMode === 'list'
                                        ? 'bg-white text-[#008689] shadow'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                List
                            </button>
                        </div>
                    </div>

                    {/* Result count */}
                    <div className="mt-4 text-sm text-gray-600">
                        Hiển thị <span className="font-semibold">{filteredAssignments.length}</span> trong{' '}
                        <span className="font-semibold">{assignments.length}</span> bài báo
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="py-8 px-6">
                <div className="max-w-7xl mx-auto">
                    {filteredAssignments.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-md p-12 text-center">
                            <RateReview className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                Không tìm thấy bài báo
                            </h3>
                            <p className="text-gray-600">
                                {searchTerm
                                    ? 'Hãy thử điều chỉnh từ khóa tìm kiếm'
                                    : 'Chưa có bài báo được giao'}
                            </p>
                        </div>
                    ) : viewMode === 'grid' ? (
                        // Grid View
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredAssignments.map((assignment) => (
                                <Link
                                    key={assignment.id}
                                    to={`/reviewer/assignments/${assignment.id}`}
                                    className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden hover:-translate-y-1"
                                >
                                    {/* Card Header - Status Color */}
                                    <div
                                        className={`h-1 bg-gradient-to-r ${
                                            assignment.status === 'COMPLETED'
                                                ? 'from-green-400 to-green-600'
                                                : assignment.status === 'ACCEPTED'
                                                ? 'from-blue-400 to-blue-600'
                                                : assignment.status === 'REJECTED'
                                                ? 'from-red-400 to-red-600'
                                                : 'from-orange-400 to-orange-600'
                                        }`}
                                    />

                                    {/* Card Content */}
                                    <div className="p-6">
                                        {/* Title */}
                                        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-[#008689] transition-colors">
                                            {assignment.submissionTitle}
                                        </h3>

                                        {/* Conference */}
                                        <p className="text-sm text-gray-600 mb-4">
                                            {assignment.conferenceName}
                                        </p>

                                        {/* Status Badge */}
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(assignment.status)}`}>
                                                {getStatusIcon(assignment.status)}
                                                {getStatusLabel(assignment.status)}
                                            </div>
                                        </div>

                                        {/* Deadline */}
                                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4 pb-4 border-b border-gray-200">
                                            <CalendarMonth className="w-4 h-4" />
                                            <span>{formatDate(assignment.deadline)}</span>
                                        </div>

                                        {/* CTA Button */}
                                        <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#008689] text-white rounded-lg hover:bg-[#006666] transition-colors font-medium group-hover:gap-3">
                                            Xem chi tiết
                                            <ArrowForward className="w-4 h-4" />
                                        </button>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        // List View
                        <div className="space-y-4">
                            {filteredAssignments.map((assignment) => (
                                <Link
                                    key={assignment.id}
                                    to={`/reviewer/assignments/${assignment.id}`}
                                    className="block bg-white rounded-lg shadow-md hover:shadow-lg hover:border-[#008689] border-2 border-transparent transition-all duration-300 p-6"
                                >
                                    <div className="flex items-center justify-between gap-6">
                                        {/* Left - Info */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1 hover:text-[#008689]">
                                                {assignment.submissionTitle}
                                            </h3>
                                            <p className="text-sm text-gray-600 mb-3">
                                                {assignment.conferenceName}
                                            </p>

                                            <div className="flex items-center gap-4 text-sm">
                                                <div className="flex items-center gap-1 text-gray-600">
                                                    <CalendarMonth className="w-4 h-4" />
                                                    {formatDate(assignment.deadline)}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right - Status & Action */}
                                        <div className="flex items-center gap-4">
                                            <div className={`flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(assignment.status)}`}>
                                                {getStatusIcon(assignment.status)}
                                                {getStatusLabel(assignment.status)}
                                            </div>
                                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-[#008689]">
                                                <ArrowForward className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReviewAssignmentListPage;
