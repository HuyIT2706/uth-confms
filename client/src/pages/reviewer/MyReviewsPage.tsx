import { useState } from 'react';
import {
    ArrowBack,
    RateReview,
    CheckCircle,
    Close as CloseIcon,
    Schedule,
    TrendingUp,
    FilterList,
    Search,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { mockSubmittedReviews } from '../../mockData/reviewerMockData';

interface SubmittedReview {
    id: string;
    assignmentId: string;
    submissionTitle: string;
    conferenceName: string;
    score: number;
    recommendation: 'ACCEPT' | 'REJECT' | 'MINOR_REVISION' | 'MAJOR_REVISION';
    submittedDate: string;
    paperAuthors?: string;
}

type FilterType = 'ALL' | 'ACCEPT' | 'REJECT' | 'MINOR_REVISION' | 'MAJOR_REVISION';

const MyReviewsPage = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<FilterType>('ALL');

    // Use mock data
    const allReviews: SubmittedReview[] = mockSubmittedReviews.map((review: any) => ({
        id: review.id,
        assignmentId: review.assignmentId,
        submissionTitle: review.submissionTitle,
        conferenceName: review.conferenceName,
        score: review.score,
        recommendation: review.recommendation,
        submittedDate: review.submittedDate,
        paperAuthors: review.paperAuthors,
    }));

    // Filter reviews
    const filteredReviews = allReviews.filter((review) => {
        const matchesSearch =
            review.submissionTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
            review.conferenceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (review.paperAuthors && review.paperAuthors.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesFilter = filterType === 'ALL' || review.recommendation === filterType;
        return matchesSearch && matchesFilter;
    });

    // Calculate stats
    const stats = {
        total: allReviews.length,
        accepted: allReviews.filter((r) => r.recommendation === 'ACCEPT').length,
        rejected: allReviews.filter((r) => r.recommendation === 'REJECT').length,
        minorRevision: allReviews.filter((r) => r.recommendation === 'MINOR_REVISION').length,
        majorRevision: allReviews.filter((r) => r.recommendation === 'MAJOR_REVISION').length,
    };

    const getRecommendationColor = (rec: string) => {
        switch (rec) {
            case 'ACCEPT':
                return 'bg-green-50 border-green-200 text-green-700';
            case 'REJECT':
                return 'bg-red-50 border-red-200 text-red-700';
            case 'MINOR_REVISION':
                return 'bg-yellow-50 border-yellow-200 text-yellow-700';
            case 'MAJOR_REVISION':
                return 'bg-orange-50 border-orange-200 text-orange-700';
            default:
                return 'bg-gray-50 border-gray-200 text-gray-700';
        }
    };

    const getRecommendationLabel = (rec: string) => {
        switch (rec) {
            case 'ACCEPT':
                return '✓ Chấp nhận';
            case 'REJECT':
                return '✕ Từ chối';
            case 'MINOR_REVISION':
                return '~ Sửa nhỏ';
            case 'MAJOR_REVISION':
                return '⟳ Sửa lớn';
            default:
                return rec;
        }
    };

    const getScoreColor = (score: number) => {
        if (score <= 3) return 'text-red-600';
        if (score <= 5) return 'text-orange-600';
        if (score <= 7) return 'text-blue-600';
        return 'text-green-600';
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

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
                    <button
                        onClick={() => navigate('/reviewer/dashboard')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                        title="Quay lại"
                    >
                        <ArrowBack className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Lịch sử đánh giá</h1>
                        <p className="text-sm text-gray-600">Các bài báo đã được đánh giá</p>
                    </div>
                </div>
            </div>

            {/* Hero Section */}
            <div className="bg-gradient-to-br from-[#008689] to-[#006666] py-12 px-6">
                <div className="max-w-7xl mx-auto">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
                            <p className="text-white/80 text-sm mb-1">Tổng cộng</p>
                            <p className="text-3xl font-bold text-white">{stats.total}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
                            <p className="text-white/80 text-sm mb-1">Chấp nhận</p>
                            <p className="text-3xl font-bold text-green-300">{stats.accepted}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
                            <p className="text-white/80 text-sm mb-1">Sửa nhỏ</p>
                            <p className="text-3xl font-bold text-yellow-300">{stats.minorRevision}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
                            <p className="text-white/80 text-sm mb-1">Sửa lớn</p>
                            <p className="text-3xl font-bold text-orange-300">{stats.majorRevision}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
                            <p className="text-white/80 text-sm mb-1">Từ chối</p>
                            <p className="text-3xl font-bold text-red-300">{stats.rejected}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter & Search */}
            <div className="bg-white py-6 px-6 border-b border-gray-200 sticky top-16 z-20">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col lg:flex-row gap-4 items-end justify-between">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm bài báo, hội nghị, tác giả..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008689] focus:border-transparent"
                            />
                        </div>

                        {/* Filters */}
                        <div className="flex gap-2 flex-wrap">
                            <button
                                onClick={() => setFilterType('ALL')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                                    filterType === 'ALL'
                                        ? 'bg-[#008689] text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                <FilterList className="w-4 h-4" />
                                Tất cả
                            </button>
                            <button
                                onClick={() => setFilterType('ACCEPT')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                    filterType === 'ACCEPT'
                                        ? 'bg-green-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Chấp nhận
                            </button>
                            <button
                                onClick={() => setFilterType('MINOR_REVISION')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                    filterType === 'MINOR_REVISION'
                                        ? 'bg-yellow-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Sửa nhỏ
                            </button>
                            <button
                                onClick={() => setFilterType('MAJOR_REVISION')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                    filterType === 'MAJOR_REVISION'
                                        ? 'bg-orange-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Sửa lớn
                            </button>
                            <button
                                onClick={() => setFilterType('REJECT')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                    filterType === 'REJECT'
                                        ? 'bg-red-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Từ chối
                            </button>
                        </div>
                    </div>

                    {/* Result count */}
                    <div className="mt-4 text-sm text-gray-600">
                        Hiển thị <span className="font-semibold">{filteredReviews.length}</span> trong{' '}
                        <span className="font-semibold">{allReviews.length}</span> đánh giá
                    </div>
                </div>
            </div>

            {/* Reviews List */}
            <div className="py-8 px-6">
                <div className="max-w-7xl mx-auto">
                    {filteredReviews.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-md p-12 text-center">
                            <RateReview className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                Không tìm thấy đánh giá
                            </h3>
                            <p className="text-gray-600">
                                {searchTerm
                                    ? 'Hãy thử điều chỉnh từ khóa tìm kiếm'
                                    : 'Chưa có đánh giá nào'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredReviews.map((review) => (
                                <div
                                    key={review.id}
                                    className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border-l-4 border-[#008689] overflow-hidden"
                                >
                                    <div className="p-6">
                                        {/* Top Row - Title */}
                                        <div className="mb-4">
                                            <h3 className="text-lg font-bold text-gray-900 mb-2">
                                                {review.submissionTitle}
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                {review.conferenceName}
                                                {review.paperAuthors && (
                                                    <span className="ml-3 font-medium">
                                                        Tác giả: {review.paperAuthors}
                                                    </span>
                                                )}
                                            </p>
                                        </div>

                                        {/* Middle Row - Score & Recommendation */}
                                        <div className="flex items-center justify-between gap-4 mb-4 pb-4 border-b border-gray-200">
                                            <div className="flex items-center gap-6">
                                                {/* Score */}
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
                                                        Điểm số
                                                    </p>
                                                    <p className={`text-3xl font-bold ${getScoreColor(review.score)}`}>
                                                        {review.score.toFixed(1)}
                                                    </p>
                                                </div>

                                                {/* Recommendation Badge */}
                                                <div
                                                    className={`px-4 py-3 rounded-lg border-2 font-semibold ${getRecommendationColor(
                                                        review.recommendation
                                                    )}`}
                                                >
                                                    {getRecommendationLabel(review.recommendation)}
                                                </div>
                                            </div>

                                            {/* Date */}
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Schedule className="w-5 h-5" />
                                                <span className="font-medium">{formatDate(review.submittedDate)}</span>
                                            </div>
                                        </div>

                                        {/* View Details Button */}
                                        <button className="w-full text-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm">
                                            Xem chi tiết
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MyReviewsPage;
