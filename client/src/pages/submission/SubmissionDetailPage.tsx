
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    ArrowBack,
    Description,
    CalendarMonth,
    CheckCircle,
    Schedule,
    Download,
} from '@mui/icons-material';
import { useGetSubmissionByIdQuery } from '../../redux/api/submissionsApi';

const SubmissionDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // Fetch submission data from API
    const { data: submissionData, isLoading, error } = useGetSubmissionByIdQuery(id || '');
    const submission = submissionData?.data;

    // Debug: Log submission data
    console.log('🔍 Submission Data:', submission);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 py-16 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="text-xl text-gray-600">Đang tải...</div>
                </div>
            </div>
        );
    }

    if (error || !submission) {
        return (
            <div className="min-h-screen bg-gray-50 py-16 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        Không tìm thấy bài nộp
                    </h1>
                    <p className="text-gray-600 mb-8">
                        Bài nộp bạn đang tìm kiếm không tồn tại.
                    </p>
                    <Link
                        to="/my-submissions"
                        className="inline-flex items-center px-6 py-3 bg-[#008689] hover:bg-[#006666] text-white font-medium rounded-lg transition-colors duration-200"
                    >
                        <ArrowBack className="w-5 h-5 mr-2" />
                        Quay lại danh sách
                    </Link>
                </div>
            </div>
        );
    }

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

    const getStatusText = (status: string) => {
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

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-5xl mx-auto">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/my-submissions')}
                    className="flex items-center text-gray-600 hover:text-[#008689] mb-6 transition-colors"
                >
                    <ArrowBack className="w-5 h-5 mr-2" />
                    Quay lại danh sách bài nộp
                </button>

                {/* Paper Header */}
                <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-gray-900 mb-3">
                                {submission.title}
                            </h1>
                            <p className="text-gray-600 mb-2">
                                <span className="font-medium">Chủ đề:</span> {(submission as any).topic || 'N/A'}
                            </p>
                        </div>
                        <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(submission.status)}`}>
                            {getStatusText(submission.status)}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="flex items-center text-gray-700">
                            <CalendarMonth className="w-5 h-5 mr-2 text-[#008689]" />
                            <div>
                                <p className="text-sm text-gray-500">Ngày nộp</p>
                                <p className="font-medium">
                                    {(submission as any).created_at
                                        ? new Date((submission as any).created_at).toLocaleDateString('vi-VN')
                                        : submission.createdAt
                                            ? new Date(submission.createdAt).toLocaleDateString('vi-VN')
                                            : 'N/A'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center text-gray-700">
                            <Schedule className="w-5 h-5 mr-2 text-[#008689]" />
                            <div>
                                <p className="text-sm text-gray-500">Cập nhật lần cuối</p>
                                <p className="font-medium">
                                    {(submission as any).updated_at
                                        ? new Date((submission as any).updated_at).toLocaleDateString('vi-VN')
                                        : submission.updatedAt
                                            ? new Date(submission.updatedAt).toLocaleDateString('vi-VN')
                                            : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Abstract */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">
                                Abstract
                            </h3>
                            <p className="text-gray-700 leading-relaxed">
                                {submission.abstract}
                            </p>
                        </div>

                        {/* Keywords */}
                        {submission.keywords && (
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-4">
                                    Keywords
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {submission.keywords.split(',').map((keyword: string, index: number) => (
                                        <span
                                            key={index}
                                            className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-md"
                                        >
                                            {keyword.trim()}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* File Info */}
                        {(submission as any).files && (submission as any).files.length > 0 && (
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                    <Description className="w-6 h-6 mr-2 text-[#008689]" />
                                    Files
                                </h3>
                                <div className="space-y-2">
                                    {(submission as any).files.map((file: any, index: number) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                                            <div>
                                                <p className="font-medium text-gray-900">Version {file.version}</p>
                                                <p className="text-sm text-gray-500">
                                                    {(file as any).uploaded_at
                                                        ? new Date((file as any).uploaded_at).toLocaleDateString('vi-VN')
                                                        : file.uploadedAt
                                                            ? new Date(file.uploadedAt).toLocaleDateString('vi-VN')
                                                            : 'N/A'}
                                                </p>
                                            </div>
                                            <a
                                                href={(file as any).file_path || file.filePath}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                download
                                                className="flex items-center text-[#008689] hover:text-[#006666] font-medium text-sm transition-colors"
                                            >
                                                <Download className="w-4 h-4 mr-1" />
                                                Tải xuống
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Timeline */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <CheckCircle className="w-6 h-6 mr-2 text-[#008689]" />
                                Status Timeline
                            </h3>
                            <div className="space-y-4">
                                <div className="relative pl-6 pb-4 border-l-2 border-[#008689]">
                                    <div className="absolute left-0 top-0 w-3 h-3 bg-[#008689] rounded-full -translate-x-[7px]"></div>
                                    <p className="font-medium text-gray-900 text-sm mb-1">
                                        Submitted
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        {(submission as any).created_at
                                            ? new Date((submission as any).created_at).toLocaleDateString('vi-VN')
                                            : submission.createdAt
                                                ? new Date(submission.createdAt).toLocaleDateString('vi-VN')
                                                : 'N/A'}
                                    </p>
                                </div>

                                {submission.status !== 'SUBMITTED' && (
                                    <div className="relative pl-6">
                                        <div className={`absolute left-0 top-0 w-3 h-3 rounded-full -translate-x-[7px] ${submission.status === 'ACCEPTED' ? 'bg-green-600' :
                                            submission.status === 'REJECTED' ? 'bg-red-600' :
                                                submission.status === 'WITHDRAWN' ? 'bg-gray-600' :
                                                    'bg-yellow-600'
                                            }`}></div>
                                        <p className="font-medium text-gray-900 text-sm mb-1">
                                            {getStatusText(submission.status)}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            {(submission as any).updated_at
                                                ? new Date((submission as any).updated_at).toLocaleDateString('vi-VN')
                                                : submission.updatedAt
                                                    ? new Date(submission.updatedAt).toLocaleDateString('vi-VN')
                                                    : 'N/A'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default SubmissionDetailPage;
