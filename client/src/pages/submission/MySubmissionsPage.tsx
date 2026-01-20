import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Search,
    Visibility,
    Edit,
    Delete,
    CloudUpload,
    Description,
    CalendarMonth
} from '@mui/icons-material';
import { useGetMySubmissionsQuery, useWithdrawSubmissionMutation } from '../../redux/api/submissionsApi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const MySubmissionsPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const { data: submissionsData, isLoading, error } = useGetMySubmissionsQuery();
    const [withdrawSubmission] = useWithdrawSubmissionMutation();

    const submissions = submissionsData?.data || [];

    // Filter submissions
    const filteredSubmissions = submissions.filter((submission: any) => {
        const matchesSearch = submission.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || submission.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'SUBMITTED':
                return 'bg-blue-100 text-blue-800';
            case 'UNDER_REVIEW':
                return 'bg-yellow-100 text-yellow-800';
            case 'ACCEPTED':
                return 'bg-green-100 text-green-800';
            case 'REJECTED':
                return 'bg-red-100 text-red-800';
            case 'WITHDRAWN':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'SUBMITTED':
                return 'Đã nộp';
            case 'UNDER_REVIEW':
                return 'Đang đánh giá';
            case 'ACCEPTED':
                return 'Chấp nhận';
            case 'REJECTED':
                return 'Từ chối';
            case 'WITHDRAWN':
                return 'Đã rút';
            default:
                return status;
        }
    };

    const canEdit = (submission: any) => {
        return submission.status === 'SUBMITTED' || submission.status === 'UNDER_REVIEW';
    };

    const handleWithdraw = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn rút bài này không?')) {
            return;
        }

        try {
            await withdrawSubmission(id).unwrap();
            toast.success('Rút bài thành công!');
        } catch (err: any) {
            console.error('Withdraw failed', err);
            const errorMsg = err?.data?.message || 'Rút bài thất bại. Vui lòng thử lại.';
            toast.error(errorMsg);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 py-8 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center py-12">
                        <div className="text-gray-600">Đang tải...</div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 py-8 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                        Không thể tải danh sách bài nộp. Vui lòng thử lại sau.
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Bài nộp của tôi
                    </h1>
                    <p className="text-gray-600">
                        Quản lý và theo dõi trạng thái các bài báo đã nộp
                    </p>
                </div>

                {/* Search and Filters */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Search */}
                        <div className="md:col-span-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm theo tiêu đề..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008689] focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Status Filter */}
                        <div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008689] focus:border-transparent"
                            >
                                <option value="all">Tất cả trạng thái</option>
                                <option value="SUBMITTED">Đã nộp</option>
                                <option value="UNDER_REVIEW">Đang đánh giá</option>
                                <option value="ACCEPTED">Chấp nhận</option>
                                <option value="REJECTED">Từ chối</option>
                                <option value="WITHDRAWN">Đã rút</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-4">
                        <p className="text-sm text-gray-600">
                            Tìm thấy <span className="font-semibold text-[#008689]">{filteredSubmissions.length}</span> bài nộp
                        </p>
                    </div>
                </div>

                {/* Submissions List */}
                <div className="space-y-4">
                    {filteredSubmissions.map((submission: any) => (
                        <div
                            key={submission.id}
                            className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 p-6"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-start gap-3 mb-2">
                                        <h3 className="text-xl font-bold text-gray-900 flex-1">
                                            {submission.title}
                                        </h3>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(submission.status)}`}>
                                            {getStatusLabel(submission.status)}
                                        </span>
                                    </div>

                                    {submission.topic && (
                                        <p className="text-sm text-gray-600 mb-2">
                                            <span className="font-medium">Chủ đề:</span> {submission.topic}
                                        </p>
                                    )}

                                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                        {submission.abstract}
                                    </p>

                                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                                        <div className="flex items-center">
                                            <CalendarMonth className="w-4 h-4 mr-1 text-gray-400" />
                                            <span>Nộp: {new Date(submission.createdAt).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-wrap gap-2">
                                <Link
                                    to={`/submissions/${submission.id}`}
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200 text-sm"
                                >
                                    <Visibility className="w-4 h-4 mr-2" />
                                    Xem chi tiết
                                </Link>

                                {canEdit(submission) && (
                                    <Link
                                        to={`/submissions/${submission.id}/edit`}
                                        className="inline-flex items-center px-4 py-2 border border-[#008689] text-[#008689] font-medium rounded-lg hover:bg-[#008689] hover:text-white transition-colors duration-200 text-sm"
                                    >
                                        <Edit className="w-4 h-4 mr-2" />
                                        Chỉnh sửa
                                    </Link>
                                )}

                                {submission.status === 'ACCEPTED' && (
                                    <Link
                                        to={`/submissions/${submission.id}/camera-ready`}
                                        className="inline-flex items-center px-4 py-2 bg-[#008689] text-white font-medium rounded-lg hover:bg-[#006666] transition-colors duration-200 text-sm"
                                    >
                                        <CloudUpload className="w-4 h-4 mr-2" />
                                        Upload Camera-ready
                                    </Link>
                                )}

                                {(submission.status === 'SUBMITTED' || submission.status === 'UNDER_REVIEW') && (
                                    <button
                                        onClick={() => handleWithdraw(submission.id)}
                                        className="inline-flex items-center px-4 py-2 border border-red-300 text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors duration-200 text-sm"
                                    >
                                        <Delete className="w-4 h-4 mr-2" />
                                        Rút bài
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {filteredSubmissions.length === 0 && (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <div className="text-gray-400 mb-4">
                            <Description className="w-16 h-16 mx-auto" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Không tìm thấy bài nộp
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {searchTerm || statusFilter !== 'all'
                                ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
                                : 'Bạn chưa nộp bài báo nào'}
                        </p>
                        {!searchTerm && statusFilter === 'all' && (
                            <Link
                                to="/submission"
                                className="inline-block px-6 py-3 bg-[#008689] hover:bg-[#006666] text-white font-medium rounded-lg transition-colors duration-200"
                            >
                                Nộp bài mới
                            </Link>
                        )}
                    </div>
                )}
            </div>
            <ToastContainer position="top-right" autoClose={3000} />
        </div>
    );
};

export default MySubmissionsPage;
