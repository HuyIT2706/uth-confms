import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Search,
    ArrowBack,
    DocumentScanner,
    Person,
    Event,
} from '@mui/icons-material';
import { CircularProgress } from '@mui/material';
import { useGetReviewerSubmissionsByConferenceQuery } from '../../redux/api/assignmentsApi';

interface ReviewerSubmission {
    id: string;
    title: string;
    abstract?: string;
    keywords?: string[];
    status?: string;
    authorId?: number;
    authorName?: string;
    createdAt?: string;
    updatedAt?: string;
}

const SubmissionListPage = () => {
    const { conferenceId } = useParams<{ conferenceId: string }>();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');

    if (!conferenceId) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Lỗi</h1>
                    <p className="text-gray-600">Không tìm thấy hội nghị</p>
                </div>
            </div>
        );
    }

    const { data: submissionsData, isLoading } = useGetReviewerSubmissionsByConferenceQuery(conferenceId);
    const submissions: ReviewerSubmission[] = Array.isArray(submissionsData) ? submissionsData : [];

    const filteredSubmissions = submissions.filter((submission) => {
        return (
            submission.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            submission.authorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            submission.abstract?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

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
            {/* Header Section */}
            <div className="bg-gradient-to-br from-[#008689] to-[#006666] py-12 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <button
                            onClick={() => navigate('/reviewer/dashboard')}
                            className="flex items-center gap-2 text-white/90 hover:text-white mb-4 transition-colors"
                        >
                            <ArrowBack className="w-5 h-5" />
                            Quay lại
                        </button>
                        <h1 className="text-4xl font-bold text-white mb-2">
                            Danh sách bài nộp
                        </h1>
                        <p className="text-white/90">
                            Xem và đánh giá các bài nộp được giao cho bạn
                        </p>
                    </div>

                    {/* Stats Card */}
                    <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20 inline-block">
                        <p className="text-white/80 text-sm mb-1">Tổng bài nộp</p>
                        <p className="text-3xl font-bold text-white">{submissions.length}</p>
                    </div>
                </div>
            </div>

            {/* Search & Content */}
            <div className="bg-white py-6 px-6 border-b border-gray-200 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tiêu đề, tác giả..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008689] focus:border-transparent"
                        />
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
                    ) : filteredSubmissions.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-md p-12 text-center">
                            <DocumentScanner className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                Không tìm thấy bài nộp
                            </h3>
                            <p className="text-gray-600">
                                {searchTerm
                                    ? 'Hãy thử điều chỉnh từ khóa tìm kiếm'
                                    : 'Chưa có bài nộp nào'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredSubmissions.map((submission) => (
                                <div
                                    key={submission.id}
                                    onClick={() => navigate(`/reviewer/submissions/${submission.id}`)}
                                    className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-[#008689] cursor-pointer group overflow-hidden"
                                >
                                    {/* Header */}
                                    <div className="p-6 pb-4">
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="p-2 bg-[#008689]/10 rounded-lg group-hover:bg-[#008689]/20 transition-colors">
                                                <DocumentScanner className="w-6 h-6 text-[#008689]" />
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#008689] transition-colors line-clamp-2 flex-1">
                                                {submission.title || 'Không có tiêu đề'}
                                            </h3>
                                        </div>

                                        {/* Abstract */}
                                        {submission.abstract && (
                                            <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                                                {submission.abstract}
                                            </p>
                                        )}

                                        {/* Info */}
                                        <div className="space-y-2 text-sm text-gray-600">
                                            {submission.authorName && (
                                                <div className="flex items-center gap-2">
                                                    <Person className="w-4 h-4" />
                                                    <span>{submission.authorName}</span>
                                                </div>
                                            )}
                                            {submission.createdAt && (
                                                <div className="flex items-center gap-2">
                                                    <Event className="w-4 h-4" />
                                                    <span>{formatDate(submission.createdAt)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Keywords */}
                                    {submission.keywords && submission.keywords.length > 0 && (
                                        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
                                            <div className="flex flex-wrap gap-2">
                                                {submission.keywords.slice(0, 3).map((keyword, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="px-2 py-1 bg-[#008689]/10 text-[#008689] rounded text-xs font-medium"
                                                    >
                                                        {keyword}
                                                    </span>
                                                ))}
                                                {submission.keywords.length > 3 && (
                                                    <span className="px-2 py-1 text-gray-600 text-xs">
                                                        +{submission.keywords.length - 3} khác
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Footer */}
                                    <div className="px-6 py-3 border-t border-gray-200 bg-white group-hover:bg-[#008689]/5 transition-colors">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/reviewer/submissions/${submission.id}`);
                                            }}
                                            className="w-full py-2 px-3 text-[#008689] font-semibold text-sm hover:bg-[#008689]/10 rounded transition-colors"
                                        >
                                            Xem & Đánh giá →
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

export default SubmissionListPage;
