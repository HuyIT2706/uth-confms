import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowBack,
    Download,
    Person,
    Event,
    School,
    Description,
    CheckCircle,
    History,
    Comment,
    Edit,
    WarningAmber,
} from '@mui/icons-material';
import { CircularProgress, Rating, Tabs, Tab } from '@mui/material';
import {
    useGetReviewerSubmissionsByConferenceQuery,
    useSubmitReviewMutation,
    useGetMyReviewQuery,
    useGetReviewHistoryQuery,
    useGetInternalDiscussionQuery,
    useGetMyReviewerAssignmentsQuery,
} from '../../redux/api/assignmentsApi';
import { showToast } from '../../utils/toast';

interface Submission {
    id: number | string;
    title: string;
    abstract?: string;
    keywords?: string[];
    topic?: string;
    status?: string;
    authorId?: number;
    authorName?: string;
    createdAt?: string;
    updatedAt?: string;
    conferenceId?: string;
    files?: Array<{
        id: number;
        submissionId: number;
        filePath: string;
        version: number;
        uploadedAt: string;
    }>;
}

const SubmissionReviewPage = () => {
    const { assignmentId, submissionId } = useParams<{ 
        assignmentId: string;
        submissionId: string;
    }>();
    const navigate = useNavigate();
    
    const { data: allAssignments } = useGetMyReviewerAssignmentsQuery();
    const [conferenceId, setConferenceId] = useState<string>('');
    
    // Find the assignment and get conference ID
    useEffect(() => {
        if (Array.isArray(allAssignments) && assignmentId) {
            const assignment = allAssignments.find(a => a.conferenceAssignmentId === assignmentId);
            if (assignment) {
                setConferenceId(assignment.conferenceId);
            }
        }
    }, [allAssignments, assignmentId]);
    
    const { data: submissionsData, isLoading: submissionsLoading } = useGetReviewerSubmissionsByConferenceQuery(conferenceId || '', { skip: !conferenceId });
    const [submitReview] = useSubmitReviewMutation();
    const { data: existingReview } = useGetMyReviewQuery(assignmentId || '', { skip: !assignmentId });
    const { data: reviewHistory } = useGetReviewHistoryQuery(assignmentId || '', { skip: !assignmentId });
    const { data: internalDiscussion } = useGetInternalDiscussionQuery(assignmentId || '', { skip: !assignmentId });
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submission, setSubmission] = useState<Submission | null>(null);
    const [tabValue, setTabValue] = useState(0);
    const [showDocumentViewer, setShowDocumentViewer] = useState(false);
    const [selectedFile, setSelectedFile] = useState<any>(null);
    const [review, setReview] = useState({
        score: 5,
        content: '',
        internalContent: '',
    });

    // Find the submission from the list
    useEffect(() => {
        if (Array.isArray(submissionsData) && submissionId) {
            // Convert submissionId to number for comparison since backend returns numeric IDs
            const submissionIdNum = Number(submissionId);
            const found = submissionsData.find(s => Number(s.id) === submissionIdNum);
            if (found) {
                setSubmission(found);
            }
        }
    }, [submissionsData, submissionId]);

    // Load existing review if available
    useEffect(() => {
        if (existingReview) {
            setReview({
                score: existingReview.score,
                content: existingReview.content,
                internalContent: existingReview.internalContent || '',
            });
        }
    }, [existingReview]);

    if (!assignmentId || !submissionId) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Lỗi</h1>
                    <p className="text-gray-600">Không tìm thấy assignment hoặc submission</p>
                </div>
            </div>
        );
    }

    const handleViewDocument = (file: any) => {
        setSelectedFile(file);
        setShowDocumentViewer(true);
    };

    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return 'N/A';
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

    const handleSubmitReview = async () => {
        if (!review.content.trim()) {
            showToast.error('Vui lòng nhập nhận xét');
            return;
        }

        if (!assignmentId) {
            showToast.error('Không tìm thấy assignment ID');
            return;
        }

        if (!submissionId) {
            showToast.error('Không tìm thấy submission ID');
            return;
        }

        setIsSubmitting(true);
        try {
            const submissionIdNum = Number(submissionId);
            await submitReview({
                assignmentId: assignmentId,
                reviewData: {
                    submissionId: submissionIdNum,
                    score: review.score,
                    content: review.content,
                    internalContent: review.internalContent || undefined,
                },
            }).unwrap();

            showToast.success('Đánh giá đã được nộp thành công');
            // Navigate back after 1.5s
            setTimeout(() => {
                navigate(-1);
            }, 1500);
        } catch (error: any) {
            console.error('Error submitting review:', error);
            const errorMessage = error?.data?.message || 'Có lỗi xảy ra khi nộp đánh giá';
            showToast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submissionsLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <CircularProgress />
            </div>
        );
    }

    if (!submission) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy bài nộp</h1>
                    <p className="text-gray-600 mb-4">Bài nộp mà bạn tìm kiếm không tồn tại hoặc đã bị xóa</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="px-6 py-2 bg-[#008689] text-white rounded-lg hover:bg-[#006666] transition-colors"
                    >
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-br from-[#008689] to-[#006666] py-12 px-6">
                <div className="max-w-6xl mx-auto">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-white/90 hover:text-white mb-4 transition-colors"
                    >
                        <ArrowBack className="w-5 h-5" />
                        Quay lại
                    </button>
                    <h1 className="text-4xl font-bold text-white mb-2">Xem & Đánh giá bài nộp</h1>
                    <p className="text-white/90">Nhập điểm số và nhận xét chi tiết cho tác giả</p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto py-12 px-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Submission Info */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Paper Info Card */}
                        <div className="bg-white rounded-lg shadow-md p-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Thông tin bài nộp</h2>

                            {/* Title */}
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Tiêu đề bài báo</h3>
                                <p className="text-gray-700 leading-relaxed text-base">
                                    {submission.title || 'Không có tiêu đề'}
                                </p>
                            </div>

                            {/* Author & Date */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-200">
                                {submission.authorName && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Person className="w-5 h-5 text-[#008689]" />
                                            <span className="text-sm font-semibold text-gray-700">Tác giả</span>
                                        </div>
                                        <p className="text-gray-900">{submission.authorName}</p>
                                    </div>
                                )}
                                {submission.createdAt && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Event className="w-5 h-5 text-[#008689]" />
                                            <span className="text-sm font-semibold text-gray-700">Ngày nộp</span>
                                        </div>
                                        <p className="text-gray-900">{formatDate(submission.createdAt)}</p>
                                    </div>
                                )}
                            </div>

                            {/* Abstract */}
                            {submission.abstract && (
                                <div className="mb-6">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Description className="w-5 h-5 text-[#008689]" />
                                        <h3 className="text-lg font-semibold text-gray-900">Tóm tắt</h3>
                                    </div>
                                    <p className="text-gray-700 leading-relaxed">
                                        {submission.abstract}
                                    </p>
                                </div>
                            )}

                            {/* Keywords */}
                            {submission.keywords && submission.keywords.length > 0 && (
                                <div className="mb-6">
                                    <div className="flex items-center gap-2 mb-3">
                                        <School className="w-5 h-5 text-[#008689]" />
                                        <h3 className="text-lg font-semibold text-gray-900">Từ khóa</h3>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {submission.keywords.map((keyword, idx) => (
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

                            {/* Download Paper */}
                            {submission.files && submission.files.length > 0 && (
                                <div className="pt-6 border-t border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Tệp bài nộp</h3>
                                    {submission.files.map((file) => (
                                        <div key={file.id} className="mb-4">
                                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-2">
                                                <div className="flex-1">
                                                    <p className="font-semibold text-gray-900">
                                                        Phiên bản {file.version}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        Tải lên: {new Date(file.uploadedAt).toLocaleDateString('vi-VN')}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleViewDocument(file)}
                                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-semibold text-sm"
                                                    >
                                                        <Description className="w-4 h-4" />
                                                        Xem trực tiếp
                                                    </button>
                                                    <button
                                                        onClick={() => window.open(file.filePath, '_blank')}
                                                        className="flex items-center gap-2 px-4 py-2 bg-[#008689] text-white rounded hover:bg-[#006666] transition-colors font-semibold text-sm"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                        Tải về
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            {/* Document Viewer */}
                                            {showDocumentViewer && selectedFile?.id === file.id && (
                                                <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
                                                    <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 flex items-center justify-between">
                                                        <span className="text-sm font-medium text-gray-700">
                                                            Xem tài liệu - Phiên bản {file.version}
                                                        </span>
                                                        <button
                                                            onClick={() => setShowDocumentViewer(false)}
                                                            className="text-gray-500 hover:text-gray-700"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                    <div className="h-[600px] w-full">
                                                        <iframe
                                                            src={file.filePath}
                                                            className="w-full h-full border-0"
                                                            title={`Xem tài liệu phiên bản ${file.version}`}
                                                            onLoad={() => console.log('Document loaded successfully')}
                                                            onError={() => console.error('Failed to load document')}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Review Form & Tabs */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-md sticky top-24">
                            {/* Tabs */}
                            <Tabs
                                value={tabValue}
                                onChange={(_event, newValue) => setTabValue(newValue)}
                                variant="fullWidth"
                                className="border-b border-gray-200"
                            >
                                <Tab label="Đánh giá" icon={<Edit />} iconPosition="start" />
                                <Tab label="Lịch sử" icon={<History />} iconPosition="start" />
                                {internalDiscussion && internalDiscussion.length > 0 && (
                                    <Tab label="Thảo luận" icon={<Comment />} iconPosition="start" />
                                )}
                            </Tabs>

                            {/* Tab 0: Review Form */}
                            {tabValue === 0 && (
                                <div className="p-8">
                                    <h2 className="text-xl font-bold text-gray-900 mb-6">Đánh giá bài báo</h2>

                                    {/* Score */}
                                    <div className="mb-8">
                                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                                            Điểm số (0-10)
                                        </label>
                                        <div className="flex items-center gap-4 mb-4">
                                            <Rating
                                                value={review.score / 2}
                                                onChange={(_event, newValue) => {
                                                    setReview({ ...review, score: (newValue || 0) * 2 });
                                                }}
                                                size="large"
                                                max={5}
                                            />
                                            <span className="text-2xl font-bold text-[#008689]">{review.score}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="10"
                                            step="1"
                                            value={review.score}
                                            onChange={(e) => setReview({ ...review, score: parseInt(e.target.value) })}
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#008689]"
                                        />
                                    </div>

                                    {/* Content for Author */}
                                    <div className="mb-8">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Nhận xét cho tác giả *
                                        </label>
                                        <textarea
                                            value={review.content}
                                            onChange={(e) => setReview({ ...review, content: e.target.value })}
                                            placeholder="Nhập nhận xét chi tiết cho tác giả (điểm mạnh, điểm yếu, đề xuất cải thiện...)..."
                                            maxLength={5000}
                                            rows={5}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008689] focus:border-transparent resize-none"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            {review.content.length}/5000
                                        </p>
                                    </div>

                                    {/* Internal Content */}
                                    <div className="mb-8">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Nhận xét nội bộ (tùy chọn)
                                        </label>
                                        <textarea
                                            value={review.internalContent || ''}
                                            onChange={(e) => setReview({ ...review, internalContent: e.target.value })}
                                            placeholder="Nhận xét chỉ dành cho chair và reviewer (không gửi cho tác giả)..."
                                            maxLength={2000}
                                            rows={4}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008689] focus:border-transparent resize-none"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            {(review.internalContent || '').length}/2000
                                        </p>
                                    </div>

                                    {/* Info Box */}
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                        <div className="flex gap-3">
                                            <WarningAmber className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                            <div className="text-sm text-blue-800">
                                                <p className="font-semibold mb-1">Lưu ý:</p>
                                                <ul className="list-disc list-inside space-y-1">
                                                    <li>Nhận xét cho tác giả sẽ được gửi cho họ</li>
                                                    <li>Nhận xét nội bộ chỉ dành cho chair và reviewer</li>
                                                    <li>Bạn có thể chỉnh sửa sau khi nộp</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        onClick={handleSubmitReview}
                                        disabled={isSubmitting || !review.content.trim()}
                                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#008689] text-white rounded-lg hover:bg-[#006666] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <CircularProgress size={20} color="inherit" />
                                                Đang nộp...
                                            </>
                                        ) : existingReview ? (
                                            <>
                                                <Edit className="w-5 h-5" />
                                                Cập nhật đánh giá
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-5 h-5" />
                                                Nộp đánh giá
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}

                            {/* Tab 1: Review History */}
                            {tabValue === 1 && (
                                <div className="p-8">
                                    <h2 className="text-xl font-bold text-gray-900 mb-6">Lịch sử chỉnh sửa</h2>
                                    {reviewHistory && reviewHistory.length > 0 ? (
                                        <div className="space-y-4">
                                            {reviewHistory.map((item, idx) => (
                                                <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <History className="w-4 h-4 text-[#008689]" />
                                                            <span className="font-semibold text-gray-900">
                                                                Điểm: {item.score}/10
                                                            </span>
                                                        </div>
                                                        <span className="text-sm text-gray-600">
                                                            {new Date(item.editedAt).toLocaleString('vi-VN')}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-700 mb-3">{item.content}</p>
                                                    {item.internalContent && (
                                                        <div className="bg-white p-3 rounded border border-blue-200 text-sm text-blue-900">
                                                            <p className="font-semibold mb-1">Nội bộ:</p>
                                                            <p>{item.internalContent}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-600">Chưa có lịch sử chỉnh sửa</p>
                                    )}
                                </div>
                            )}

                            {/* Tab 2: Internal Discussion */}
                            {tabValue === 2 && internalDiscussion && internalDiscussion.length > 0 && (
                                <div className="p-8">
                                    <h2 className="text-xl font-bold text-gray-900 mb-6">Thảo luận nội bộ</h2>
                                    <div className="space-y-4">
                                        {internalDiscussion.map((item) => (
                                            <div key={item.id} className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Person className="w-4 h-4 text-amber-600" />
                                                    <span className="font-semibold text-gray-900">{item.reviewerName}</span>
                                                    <span className="text-sm text-gray-600 ml-auto">
                                                        {new Date(item.createdAt).toLocaleString('vi-VN')}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-700">{item.internalContent}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubmissionReviewPage;
