import { useParams, useNavigate } from 'react-router-dom';
import { ArrowBack, CheckCircle } from '@mui/icons-material';

const ReviewerDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Back */}
        <button
          onClick={() => navigate('/reviewer')}
          className="flex items-center text-gray-600 hover:text-[#008689] mb-6"
        >
          <ArrowBack className="mr-2" />
          Quay lại danh sách
        </button>

        {/* Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold mb-2">
            Ứng dụng Deep Learning trong nhận diện khuôn mặt
          </h1>
          <p className="text-gray-600">Hội nghị: ICCS 2026</p>
          <p className="text-sm text-gray-500">Mã bài: {id}</p>
        </div>

        {/* Review Form */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <CheckCircle className="mr-2 text-[#008689]" />
            Đánh giá bài báo
          </h2>

          <label className="block mb-2 font-medium">Nhận xét</label>
          <textarea
            rows={5}
            className="w-full border rounded-lg p-3 mb-4 focus:ring-2 focus:ring-[#008689]"
            placeholder="Nhập nhận xét chi tiết..."
          />

          <label className="block mb-2 font-medium">Điểm đánh giá</label>
          <select className="w-full border rounded-lg p-3 mb-6 focus:ring-2 focus:ring-[#008689]">
            <option>5 - Xuất sắc</option>
            <option>4 - Tốt</option>
            <option>3 - Trung bình</option>
            <option>2 - Yếu</option>
            <option>1 - Kém</option>
          </select>

          <button className="w-full px-6 py-3 bg-[#008689] hover:bg-[#006666] text-white font-semibold rounded-lg transition">
            Gửi đánh giá
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewerDetailPage;
