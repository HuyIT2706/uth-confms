import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Add, CloudUpload, Close, ArrowBack } from '@mui/icons-material';
import bgUth from '../../assets/bg_uth.svg';
import { useGetSubmissionByIdQuery, useUpdateSubmissionMutation } from '../../redux/api/submissionsApi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface CoAuthor {
    id: number;
    name: string;
    email: string;
    affiliation: string;
}

const EditSubmissionPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: submissionData, isLoading, error } = useGetSubmissionByIdQuery(id || '');
    const [updateSubmission, { isLoading: isUpdating }] = useUpdateSubmissionMutation();

    const submission = submissionData?.data;

    const [title, setTitle] = useState('');
    const [abstract, setAbstract] = useState('');
    const [keywords, setKeywords] = useState('');
    const [topic, setTopic] = useState('');
    const [coAuthors, setCoAuthors] = useState<CoAuthor[]>([{ id: 1, name: '', email: '', affiliation: '' }]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [currentPdfFile, setCurrentPdfFile] = useState('');

    useEffect(() => {
        if (submission) {
            setTitle(submission.title || '');
            setAbstract(submission.abstract || '');
            setKeywords(submission.keywords || '');
            setTopic((submission as any).topic || '');
            setCurrentPdfFile((submission as any).fileUrl || '');
        }
    }, [submission]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 py-16 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="text-gray-600">Đang tải...</div>
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
                        Bài nộp bạn muốn chỉnh sửa không tồn tại.
                    </p>
                    <button
                        onClick={() => navigate('/my-submissions')}
                        className="inline-flex items-center px-6 py-3 bg-[#008689] hover:bg-[#006666] text-white font-medium rounded-lg transition-colors duration-200"
                    >
                        <ArrowBack className="w-5 h-5 mr-2" />
                        Quay lại danh sách
                    </button>
                </div>
            </div>
        );
    }

    const addCoAuthor = () => {
        const newId = coAuthors.length > 0 ? Math.max(...coAuthors.map(a => a.id)) + 1 : 1;
        setCoAuthors([...coAuthors, { id: newId, name: '', email: '', affiliation: '' }]);
    };

    const removeCoAuthor = (id: number) => {
        if (coAuthors.length > 1) {
            setCoAuthors(coAuthors.filter(author => author.id !== id));
        }
    };

    const updateCoAuthor = (id: number, field: keyof CoAuthor, value: string) => {
        setCoAuthors(coAuthors.map(author =>
            author.id === id ? { ...author, [field]: value } : author
        ));
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setSelectedFile(event.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const updateData: any = {
                title,
                abstract,
                keywords,
                topic,
            };

            console.log('📝 Submitting update...');
            console.log('📎 Selected File:', selectedFile);

            const payload = {
                id: id!,
                data: updateData,
                file: selectedFile || undefined
            };
            console.log('📦 API Payload:', payload);

            await updateSubmission(payload).unwrap();
            toast.success('Cập nhật bài nộp thành công!');
            setTimeout(() => navigate('/my-submissions'), 1500);
        } catch (err: any) {
            console.error('Update failed', err);
            const errorMsg = err?.data?.message || 'Cập nhật thất bại. Vui lòng thử lại.';
            toast.error(errorMsg);
        }
    };

    return (
        <div
            className="min-h-screen py-8 px-4"
            style={{
                backgroundImage: `url(${bgUth})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundColor: '#e0f2f1',
            }}
        >
            <div className="max-w-5xl mx-auto">
                {/* Back Button */}
                <button
                    onClick={() => navigate(`/submissions/${id}`)}
                    className="flex items-center text-gray-600 hover:text-[#008689] mb-6 transition-colors"
                >
                    <ArrowBack className="w-5 h-5 mr-2" />
                    Quay lại chi tiết bài nộp
                </button>

                {/* Page Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                Chỉnh sửa Bài nộp
                            </h1>
                            <p className="text-sm text-gray-600">
                                Cập nhật thông tin bài nghiên cứu của bạn
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Paper Information */}
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                        <h2 className="text-base font-bold text-gray-900 mb-4">
                            Thông tin bài viết
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Tiêu đề của bài viết *
                                </label>
                                <input
                                    type="text"
                                    placeholder="Nhập tiêu đề bài nghiên cứu của bạn"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#008689] focus:border-[#008689] text-sm bg-gray-50"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Tóm tắt *
                                </label>
                                <textarea
                                    placeholder="Nhập tóm tắt bài viết (tối đa 250 từ - 300 từ)"
                                    rows={4}
                                    value={abstract}
                                    onChange={(e) => setAbstract(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#008689] focus:border-[#008689] resize-none text-sm bg-gray-50"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Từ khóa *
                                </label>
                                <input
                                    type="text"
                                    placeholder="Nhập các từ khóa, cách nhau bằng dấu phẩy"
                                    value={keywords}
                                    onChange={(e) => setKeywords(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#008689] focus:border-[#008689] text-sm bg-gray-50"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Chủ đề bài báo *
                                </label>
                                <input
                                    type="text"
                                    placeholder="Nhập chủ đề bài báo"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#008689] focus:border-[#008689] text-sm bg-gray-50"
                                    required
                                />
                            </div>
                        </div>
                    </div>



                    {/* Co-Authors */}
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-bold text-gray-900">
                                Đồng tác giả
                            </h2>
                            <button
                                type="button"
                                onClick={addCoAuthor}
                                className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-white border border-[#008689] text-[#008689] hover:bg-[#008689] hover:text-white rounded-md transition-colors duration-200"
                            >
                                <Add className="w-4 h-4" />
                                <span>Thêm đồng tác giả</span>
                            </button>
                        </div>

                        <div className="space-y-3">
                            {coAuthors.map((author) => (
                                <div key={author.id} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Họ và tên
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Nguyễn Văn A"
                                            value={author.name}
                                            onChange={(e) => updateCoAuthor(author.id, 'name', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#008689] focus:border-[#008689] text-sm bg-gray-50"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            placeholder="email@gmail.com"
                                            value={author.email}
                                            onChange={(e) => updateCoAuthor(author.id, 'email', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#008689] focus:border-[#008689] text-sm bg-gray-50"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Cơ quan
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Tên cơ quan"
                                            value={author.affiliation}
                                            onChange={(e) => updateCoAuthor(author.id, 'affiliation', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#008689] focus:border-[#008689] text-sm bg-gray-50"
                                        />
                                    </div>

                                    {coAuthors.length > 1 && (
                                        <div className="pb-0.5">
                                            <button
                                                type="button"
                                                onClick={() => removeCoAuthor(author.id)}
                                                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                                                title="Xóa đồng tác giả"
                                            >
                                                <Close className="w-5 h-5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* PDF Upload */}
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                        <h2 className="text-base font-bold text-gray-900 mb-4">
                            Tải lên file PDF mới (tùy chọn)
                        </h2>

                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-800">
                                <span className="font-medium">File hiện tại:</span> {currentPdfFile}
                            </p>
                            <p className="text-xs text-blue-600 mt-1">
                                Chỉ upload file mới nếu bạn muốn thay thế file hiện tại
                            </p>
                        </div>

                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-[#008689] transition-colors">
                            <input
                                type="file"
                                accept=".docx"
                                onChange={handleFileSelect}
                                className="hidden"
                                id="pdf-upload"
                            />
                            <label htmlFor="pdf-upload" className="cursor-pointer">
                                <CloudUpload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                                {selectedFile ? (
                                    <div>
                                        <p className="text-sm font-medium text-[#008689] mb-1">
                                            {selectedFile.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                        <p className="text-xs text-[#008689] mt-1">
                                            Click để chọn file khác
                                        </p>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">
                                            Kéo thả file DOCX vào đây
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Chỉ chấp nhận file DOCX, tối đa 10MB
                                        </p>
                                    </div>
                                )}
                            </label>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between">
                        <button
                            type="button"
                            onClick={() => navigate(`/submissions/${id}`)}
                            className="px-5 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors duration-200 text-sm"
                        >
                            Hủy
                        </button>

                        <button
                            type="submit"
                            disabled={isUpdating}
                            className="px-6 py-2 bg-[#008689] hover:bg-[#006666] text-white font-medium rounded-md transition-colors duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isUpdating ? 'Đang cập nhật...' : 'Cập nhật bài nộp'}
                        </button>
                    </div>
                </form>
            </div>
            <ToastContainer position="top-right" autoClose={3000} />
        </div>
    );
};

export default EditSubmissionPage;
