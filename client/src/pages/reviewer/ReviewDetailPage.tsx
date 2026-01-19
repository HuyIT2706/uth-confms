import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowBack,
    Save,
    Send,
    Close as CloseIcon,
    Info,
    CheckCircle,
    ErrorOutline,
    Warning,
    Edit,
    AccessTime,
} from '@mui/icons-material';
import { mockAssignments } from '../../mockData/reviewerMockData';

interface Assignment {
    id: string;
    conferenceAssignmentId?: string;
    uuid?: string;
    submissionId: string;
    submission?: { 
        title: string; 
        id: string;
        abstract?: string;
        authors?: string;
        keywords?: string;
    };
    submissionInfo?: {
        title?: string;
        abstract?: string;
        keywords?: string[];
    };
    submissionTitle: string;
    conferenceId: string;
    conference?: { name: string; acronym: string; id: string };
    conferenceName: string;
    status: 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'REJECTED';
    deadline: string;
    topic?: string;
}

interface ReviewFormData {
    score: number; // 0-10
    content: string; // Nhận xét cho tác giả (max 5000)
    internalContent: string; // Nhận xét nội bộ (max 2000)
    strengths?: string;
    weaknesses?: string;
    comments?: string;
}

const ReviewDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // Use mock data
    const assignments: Assignment[] = mockAssignments.map((item: any) => ({
        id: item.id || item.uuid || '',
        conferenceAssignmentId: item.id,
        uuid: item.uuid,
        submissionId: item.submissionId || item.submission?.id || '',
        submission: item.submission,
        submissionInfo: item.submission,
        submissionTitle: item.submissionTitle || item.submission?.title || 'Untitled',
        conferenceId: item.conferenceId || item.conference?.id || '',
        conferenceName: item.conferenceName || item.conference?.name || 'Unknown',
        conference: item.conference,
        status: item.status || 'PENDING',
        deadline: item.deadline || new Date().toISOString(),
        topic: item.topic,
    }));

    const assignment = assignments.find((a) => a.id === id);

    const [formData, setFormData] = useState<ReviewFormData>({
        score: 5,
        content: '',
        internalContent: '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const [showSuccessAlert, setShowSuccessAlert] = useState(false);
    const [formErrors, setFormErrors] = useState<string[]>([]);

    // Calculate progress
    const fillProgress = useMemo(() => {
        let filled = 0;
        if (formData.score > 0 && formData.score <= 10) filled++;
        if (formData.content.trim().length > 20) filled++;
        if (formData.internalContent.trim().length > 0) filled++;
        return Math.round((filled / 3) * 100);
    }, [formData]);

    // Validation
    const validateForm = (): boolean => {
        const errors: string[] = [];

        if (formData.score < 0 || formData.score > 10) {
            errors.push('Điểm số phải từ 0 đến 10');
        }

        if (formData.content.trim().length < 20) {
            errors.push('Nhận xét cho tác giả phải có ít nhất 20 ký tự');
        }

        if (formData.content.length > 5000) {
            errors.push('Nhận xét cho tác giả không được vượt quá 5000 ký tự');
        }

        if (formData.internalContent.length > 2000) {
            errors.push('Nhận xét nội bộ không được vượt quá 2000 ký tự');
        }

        setFormErrors(errors);
        return errors.length === 0;
    };

    const handleInputChange = (field: keyof ReviewFormData, value: string | number) => {
        if (field === 'score') {
            const numValue = Math.min(Math.max(parseInt(String(value)) || 0, 0), 10);
            setFormData((prev) => ({ ...prev, [field]: numValue }));
        } else {
            setFormData((prev) => ({ ...prev, [field]: value }));
        }
        // Clear error for this field
        setFormErrors((prev) => prev.filter((err) => !err.toLowerCase().includes(field.toLowerCase())));
    };

    const handleScoreChange = (direction: number) => {
        setFormData((prev) => ({
            ...prev,
            score: Math.min(Math.max(prev.score + direction, 0), 10),
        }));
        setFormErrors((prev) => prev.filter((err) => !err.includes('Điểm')));
    };

    const handleSaveDraft = async () => {
        setIsSavingDraft(true);
        try {
            localStorage.setItem(`review-draft-${id}`, JSON.stringify(formData));
            await new Promise((resolve) => setTimeout(resolve, 800));
            alert('Đánh giá đã được lưu nháp thành công!');
        } finally {
            setIsSavingDraft(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        try {
            // TODO: Call API to submit review
            // const response = await submitReviewApi(assignment.conferenceAssignmentId, formData);
            await new Promise((resolve) => setTimeout(resolve, 1500));
            setShowSuccessAlert(true);
            setTimeout(() => {
                navigate('/reviewer/my-reviews');
            }, 2000);
        } catch (error: any) {
            setFormErrors([error.message || 'Có lỗi xảy ra khi gửi đánh giá']);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!assignment) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
                <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
                    <ErrorOutline className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy bài báo</h2>
                    <p className="text-gray-600 mb-6">Bài báo được giao không tồn tại hoặc đã bị xóa</p>
                    <button
                        onClick={() => navigate('/reviewer/assignments')}
                        className="w-full bg-gradient-to-r from-[#008689] to-[#006666] text-white py-2 rounded-lg hover:shadow-lg transition"
                    >
                        Quay lại danh sách
                    </button>
                </div>
            </div>
        );
    }

    const scoreColor = (score: number) => {
        if (score <= 3) return 'from-red-500 to-red-600';
        if (score <= 5) return 'from-orange-500 to-orange-600';
        if (score <= 7) return 'from-blue-500 to-blue-600';
        return 'from-green-500 to-green-600';
    };

    const scoreLabel = (score: number) => {
        if (score <= 3) return 'Không tốt';
        if (score <= 5) return 'Trung bình';
        if (score <= 7) return 'Tốt';
        return 'Rất tốt';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header with Progress Bar */}
            <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-6xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/reviewer/assignments')}
                                className="p-2 hover:bg-gray-100 rounded-lg transition"
                            >
                                <ArrowBack className="w-5 h-5 text-gray-600" />
                            </button>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Đánh giá bài báo</h1>
                                <p className="text-sm text-gray-500">{assignment.conferenceName}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                                assignment.status === 'ACCEPTED'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-yellow-100 text-yellow-700'
                            }`}>
                                {assignment.status === 'ACCEPTED' ? 'Đã chấp nhận' : 'Chờ chấp nhận'}
                            </span>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-gradient-to-r from-[#008689] to-[#006666] h-2 rounded-full transition-all duration-300"
                            style={{ width: `${fillProgress}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Tiến độ hoàn thành: {fillProgress}%</p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-8">
                {/* Validation Errors */}
                {formErrors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                        <div className="flex gap-3">
                            <ErrorOutline className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-semibold text-red-900 mb-2">Vui lòng kiểm tra các lỗi sau:</h3>
                                <ul className="space-y-1">
                                    {formErrors.map((err, idx) => (
                                        <li key={idx} className="text-sm text-red-700">
                                            • {err}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* Success Alert */}
                {showSuccessAlert && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-green-900">Đánh giá đã được nộp thành công!</h3>
                            <p className="text-sm text-green-700 mt-1">Đang chuyển hướng...</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Form */}
                    <div className="lg:col-span-2">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Paper Info Section */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
                                <h2 className="text-lg font-bold text-gray-900 mb-4 flex gap-3 items-center">
                                    <Info className="w-6 h-6 text-teal-600" />
                                    Thông tin bài báo
                                </h2>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Tiêu đề</label>
                                        <p className="text-base text-gray-900">{assignment.submissionTitle}</p>
                                    </div>

                                    {assignment.submissionInfo?.abstract && (
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Tóm tắt</label>
                                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-48 overflow-y-auto">
                                                <p className="text-sm text-gray-700 leading-relaxed">
                                                    {assignment.submissionInfo.abstract}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {assignment.submissionInfo?.keywords && (
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Từ khóa</label>
                                            <div className="flex flex-wrap gap-2">
                                                {(Array.isArray(assignment.submissionInfo.keywords)
                                                    ? assignment.submissionInfo.keywords
                                                    : assignment.submissionInfo.keywords?.split(',') || []
                                                ).map((keyword: string, idx: number) => (
                                                    <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                                        {keyword}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {assignment.topic && (
                                        <div className="pt-2 border-t border-gray-200">
                                            <p className="text-xs text-gray-500">
                                                <Info className="w-3 h-3 inline mr-1" />
                                                Chuyên đề: <span className="font-semibold">{assignment.topic}</span>
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Score Section */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
                                <h2 className="text-lg font-bold text-gray-900 mb-4 flex gap-3 items-center">
                                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${scoreColor(formData.score)} flex items-center justify-center flex-shrink-0`}>
                                        <span className="text-lg font-bold text-white">{formData.score}</span>
                                    </div>
                                    Điểm số đánh giá
                                </h2>
                                <p className="text-sm text-gray-600 mb-6">
                                    {scoreLabel(formData.score)} - Chọn điểm từ 0 (Không tốt) đến 10 (Rất tốt)
                                </p>

                                {/* Score Controls */}
                                <div className="flex items-center justify-center gap-4 mb-6">
                                    <button
                                        type="button"
                                        onClick={() => handleScoreChange(-1)}
                                        className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition"
                                    >
                                        −
                                    </button>
                                    <input
                                        type="range"
                                        min="0"
                                        max="10"
                                        value={formData.score}
                                        onChange={(e) => handleInputChange('score', parseInt(e.target.value))}
                                        className="flex-1 h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-teal-600"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleScoreChange(1)}
                                        className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition"
                                    >
                                        +
                                    </button>
                                </div>

                                {/* Score Guide */}
                                <div className="grid grid-cols-4 gap-2 text-center">
                                    {[
                                        { range: '0-3', label: 'Không tốt', color: 'from-red-50 to-red-100 border-red-200' },
                                        { range: '4-5', label: 'Trung bình', color: 'from-orange-50 to-orange-100 border-orange-200' },
                                        { range: '6-7', label: 'Tốt', color: 'from-blue-50 to-blue-100 border-blue-200' },
                                        { range: '8-10', label: 'Rất tốt', color: 'from-green-50 to-green-100 border-green-200' },
                                    ].map((guide, idx) => (
                                        <div key={idx} className={`bg-gradient-to-br ${guide.color} border rounded-lg p-2`}>
                                            <p className="text-xs font-semibold text-gray-700">{guide.range}</p>
                                            <p className="text-xs text-gray-600">{guide.label}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Review Content Section */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
                                <h2 className="text-lg font-bold text-gray-900 mb-4 flex gap-3 items-center">
                                    <Info className="w-6 h-6 text-orange-600" />
                                    Nhận xét cho tác giả
                                </h2>
                                <p className="text-xs text-gray-600 mb-4 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                                    <Info className="w-3 h-3 inline mr-1" />
                                    Nhận xét này sẽ được gửi đến tác giả. Hãy ghi rõ những điểm mạnh, yếu và đề xuất cải thiện.
                                </p>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-baseline">
                                        <label className="block text-sm font-semibold text-gray-700">
                                            Nhận xét chi tiết
                                            <span className="text-red-500">*</span>
                                        </label>
                                        <span className={`text-xs font-medium ${
                                            formData.content.length > 5000
                                                ? 'text-red-600'
                                                : formData.content.length > 4000
                                                ? 'text-orange-600'
                                                : 'text-gray-500'
                                        }`}>
                                            {formData.content.length} / 5000
                                        </span>
                                    </div>
                                    <textarea
                                        name="content"
                                        value={formData.content}
                                        onChange={(e) => handleInputChange('content', e.target.value)}
                                        placeholder="Mô tả chi tiết nhận xét của bạn về bài báo. Bao gồm:&#10;- Điểm mạnh: Những khía cạnh tích cực&#10;- Điểm yếu: Những vấn đề cần cải thiện&#10;- Đề xuất: Các cách để cải thiện công việc&#10;- Câu hỏi: Những câu hỏi cho tác giả"
                                        rows={8}
                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none ${
                                            formErrors.some((e) => e.includes('Nhận xét'))
                                                ? 'border-red-300 bg-red-50'
                                                : 'border-gray-300'
                                        }`}
                                    />
                                </div>
                            </div>

                            {/* Internal Comments Section */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
                                <h2 className="text-lg font-bold text-gray-900 mb-4 flex gap-3 items-center">
                                    <Warning className="w-6 h-6 text-purple-600" />
                                    Nhận xét nội bộ
                                </h2>
                                <p className="text-xs text-gray-600 mb-4 bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
                                    <Info className="w-3 h-3 inline mr-1" />
                                    Chỉ Chủ tịch hội nghị và các reviewer khác có thể thấy. Dùng để thảo luận công khai.
                                </p>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-baseline">
                                        <label className="block text-sm font-semibold text-gray-700">
                                            Ghi chú bí mật (tùy chọn)
                                        </label>
                                        <span className={`text-xs font-medium ${
                                            formData.internalContent.length > 2000
                                                ? 'text-red-600'
                                                : formData.internalContent.length > 1500
                                                ? 'text-orange-600'
                                                : 'text-gray-500'
                                        }`}>
                                            {formData.internalContent.length} / 2000
                                        </span>
                                    </div>
                                    <textarea
                                        name="internalContent"
                                        value={formData.internalContent}
                                        onChange={(e) => handleInputChange('internalContent', e.target.value)}
                                        placeholder="Ghi chú nội bộ (tùy chọn)...&#10;Ví dụ: Tôi nghĩ bài báo này phù hợp với hội nghị&#10;hoặc Cần thêm thông tin từ tác giả"
                                        rows={6}
                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none ${
                                            formErrors.some((e) => e.includes('nội bộ'))
                                                ? 'border-red-300 bg-red-50'
                                                : 'border-gray-300'
                                        }`}
                                    />
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Deadline Info */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
                            <div className="flex gap-3 mb-3">
                                <AccessTime className="w-5 h-5 text-blue-600" />
                                <h3 className="font-bold text-gray-900">Hạn chót nộp</h3>
                            </div>
                            <p className="text-2xl font-bold text-gray-900 mb-2">
                                {new Date(assignment.deadline).toLocaleDateString('vi-VN')}
                            </p>
                            <p className="text-xs text-gray-600">
                                {Math.ceil((new Date(assignment.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} ngày còn lại
                            </p>
                        </div>

                        {/* Conference Info */}
                        <div className="bg-gradient-to-br from-teal-50 to-teal-100 border border-teal-200 rounded-xl shadow-sm p-6">
                            <h3 className="font-bold text-teal-900 mb-3">Hội nghị</h3>
                            <p className="text-sm text-teal-800 mb-1">{assignment.conferenceName}</p>
                            <p className="text-xs text-teal-700">
                                {assignment.conference?.acronym && `Viết tắt: ${assignment.conference.acronym}`}
                            </p>
                        </div>

                        {/* Progress Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
                            <h3 className="font-bold text-gray-900 mb-4">Tiến độ làm việc</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Điểm số</span>
                                    <CheckCircle className={`w-5 h-5 ${formData.score > 0 && formData.score <= 10 ? 'text-green-600' : 'text-gray-300'}`} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Nhận xét</span>
                                    <CheckCircle className={`w-5 h-5 ${formData.content.trim().length > 20 ? 'text-green-600' : 'text-gray-300'}`} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Ghi chú nội bộ</span>
                                    <CheckCircle className={`w-5 h-5 ${formData.internalContent.trim().length > 0 ? 'text-green-600' : 'text-gray-300'}`} />
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="w-full bg-gradient-to-r from-[#008689] to-[#006666] text-white py-3 rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                            >
                                <Send className="w-4 h-4" />
                                {isSubmitting ? 'Đang nộp...' : 'Nộp đánh giá'}
                            </button>

                            <button
                                onClick={handleSaveDraft}
                                disabled={isSavingDraft || isSubmitting}
                                className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                {isSavingDraft ? 'Đang lưu...' : 'Lưu nháp'}
                            </button>

                            <button
                                onClick={() => navigate('/reviewer/assignments')}
                                className="w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2"
                            >
                                <CloseIcon className="w-4 h-4" />
                                Hủy bỏ
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReviewDetailPage;
