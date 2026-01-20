import { useState, useEffect } from 'react';
import { useCreateSubmissionMutation } from '../../redux/api/submissionsApi';
import { useGetConferencesQuery } from '../../redux/api/conferencesApi';
import { createSubmissionFormData } from '../../utils/api-helpers';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Add, CloudUpload, Close } from '@mui/icons-material';
import bgUth from '../../assets/bg_uth.svg';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface CoAuthor {
    id: number;
    name: string;
    email: string;
    affiliation: string;
}

const SubmitPaperPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [coAuthors, setCoAuthors] = useState<CoAuthor[]>([
        { id: 1, name: '', email: '', affiliation: '' }
    ]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [title, setTitle] = useState('');
    const [abstract, setAbstract] = useState('');
    const [keywords, setKeywords] = useState('');
    const [topic, setTopic] = useState('');
    const [conferenceId, setConferenceId] = useState('');
    const [createSubmission, { isLoading }] = useCreateSubmissionMutation();
    const { data: conferencesData, isLoading: loadingConferences } = useGetConferencesQuery();

    // Auto-select conference from URL parameter
    useEffect(() => {
        const confIdFromUrl = searchParams.get('conferenceId');
        if (confIdFromUrl) {
            setConferenceId(confIdFromUrl);
        }
    }, [searchParams]);

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
        if (!selectedFile) {
            toast.error('Vui lòng chọn file PDF để nộp');
            return;
        }
        if (!conferenceId) {
            toast.error('Vui lòng chọn hội nghị');
            return;
        }
        if (!topic) {
            toast.error('Vui lòng nhập chủ đề bài báo');
            return;
        }

        const data = {
            title,
            abstract,
            keywords,
            topic,
            conferenceId,
        };

        const formData = createSubmissionFormData(data, selectedFile);

        try {
            await createSubmission(formData).unwrap();
            toast.success('Nộp bài thành công!');
            setTimeout(() => navigate('/my-submissions'), 1500);
        } catch (err: any) {
            console.error('Submit failed', err);
            const errorMsg = err?.data?.message || 'Nộp bài thất bại. Vui lòng thử lại.';
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
                {/* Page Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                Nộp Bài / Tóm Tắt và Cập Nhật
                            </h1>
                            <p className="text-sm text-gray-600">
                                Vui lòng điền đầy đủ thông tin bên dưới để nộp bài nghiên cứu của bạn
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-500">Thời hạn nộp bài</p>
                            <p className="text-base font-semibold text-[#008689]">01/12/2026</p>
                            <p className="text-xs text-gray-500">(Còn 6 tháng)</p>
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
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Nhập tiêu đề bài nghiên cứu của bạn"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#008689] focus:border-[#008689] text-sm bg-gray-50"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Tóm tắt *
                                </label>
                                <textarea
                                    value={abstract}
                                    onChange={(e) => setAbstract(e.target.value)}
                                    placeholder="Nhập tóm tắt bài viết (tối đa 250 từ - 300 từ)"
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#008689] focus:border-[#008689] resize-none text-sm bg-gray-50"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Tối đa 250-300 từ. Mô tả ngắn gọn về nội dung nghiên cứu của bạn
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Từ khóa *
                                </label>
                                <input
                                    type="text"
                                    value={keywords}
                                    onChange={(e) => setKeywords(e.target.value)}
                                    placeholder="Nhập các từ khóa, cách nhau bằng dấu phẩy"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#008689] focus:border-[#008689] text-sm bg-gray-50"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Select Conference & Topic */}
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                        <h2 className="text-base font-bold text-gray-900 mb-4">Thông tin hội nghị</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    {searchParams.get('conferenceId') ? 'Hội nghị đã chọn' : 'Chọn hội nghị *'}
                                </label>
                                {searchParams.get('conferenceId') ? (
                                    // Show selected conference info (read-only)
                                    loadingConferences ? (
                                        <div className="text-sm text-gray-500">Đang tải thông tin hội nghị...</div>
                                    ) : (() => {
                                        const conferences = Array.isArray(conferencesData) ? conferencesData : conferencesData?.data || [];
                                        const selectedConf = conferences.find((c: any) => String(c.id) === String(conferenceId));

                                        // If conference found, show info; otherwise show dropdown
                                        return selectedConf ? (
                                            <div className="w-full px-4 py-3 border-2 border-[#008689] bg-[#e6f7f7] rounded-md text-sm">
                                                <div>
                                                    <div className="font-semibold text-gray-900">{selectedConf.name} ({selectedConf.acronym})</div>
                                                    <div className="text-xs text-gray-600 mt-1">
                                                        Deadline: {new Date(selectedConf.deadlines?.submission || '').toLocaleDateString('vi-VN')}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            // Fallback to dropdown if conference not found
                                            <select
                                                value={conferenceId}
                                                onChange={(e) => setConferenceId(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#008689] focus:border-[#008689] text-sm bg-gray-50"
                                                required
                                            >
                                                <option value="">-- Chọn hội nghị --</option>
                                                {conferences.map((conf: any) => (
                                                    <option key={conf.id} value={conf.id}>
                                                        {conf.name} ({conf.acronym}) - Deadline: {new Date(conf.deadlines?.submission || '').toLocaleDateString('vi-VN')}
                                                    </option>
                                                ))}
                                            </select>
                                        );
                                    })()
                                ) : loadingConferences ? (
                                    <div className="text-sm text-gray-500">Đang tải danh sách hội nghị...</div>
                                ) : (
                                    // Show dropdown for manual selection
                                    <select
                                        value={conferenceId}
                                        onChange={(e) => setConferenceId(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#008689] focus:border-[#008689] text-sm bg-gray-50"
                                        required
                                    >
                                        <option value="">-- Chọn hội nghị --</option>
                                        {(Array.isArray(conferencesData) ? conferencesData : conferencesData?.data || []).map((conf: any) => (
                                            <option key={conf.id} value={conf.id}>
                                                {conf.name} ({conf.acronym}) - Deadline: {new Date(conf.deadlines?.submission || '').toLocaleDateString('vi-VN')}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Chủ đề bài báo *</label>
                                <input
                                    type="text"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="Nhập chủ đề bài báo (ví dụ: Machine Learning, AI, etc.)"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#008689] focus:border-[#008689] text-sm bg-gray-50"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Chủ đề nghiên cứu của bài báo
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Main Author Information */}
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                        <h2 className="text-base font-bold text-gray-900 mb-4">
                            Thông tin tác giả chính
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Họ và tên *
                                </label>
                                <input
                                    type="text"
                                    placeholder="Nguyễn Văn A"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#008689] focus:border-[#008689] text-sm bg-gray-50"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    placeholder="email@gmail.com"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#008689] focus:border-[#008689] text-sm bg-gray-50"
                                    required
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Cơ quan / Tổ chức *
                                </label>
                                <input
                                    type="text"
                                    placeholder="Trường Đại học Giao thông Vận tải TP.HCM"
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
                            Tải lên file PDF
                        </h2>

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
                        <Link
                            to="/"
                            className="px-5 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors duration-200 text-sm"
                        >
                            Lưu bản nháp
                        </Link>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-6 py-2 bg-[#008689] hover:bg-[#006666] text-white font-medium rounded-md transition-colors duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Đang nộp...' : 'Nộp bài'}
                        </button>
                    </div>
                </form>
            </div>
            <ToastContainer position="top-right" autoClose={3000} />
        </div>
    );
};

export default SubmitPaperPage;
