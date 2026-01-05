import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowBack,
  Description,
  School,
  Send,
} from '@mui/icons-material';

const ReviewDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    originality: '',
    quality: '',
    clarity: '',
    commentToAuthor: '',
    commentToChair: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    // TODO: gọi API submit review
    console.log(form);
    alert('Gửi đánh giá thành công!');
    navigate('/reviewer');
  };

  return (
    <div className="min-h-screen bg-[#e6f6f6] py-12 px-6">
      <div className="max-w-7xl mx-auto">

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#008689] mb-6 hover:underline"
        >
          <ArrowBack fontSize="small" />
          Quay lại Dashboard
        </button>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lx overflow-hidden">

          {/* Header */}
          <div className="px-8 py-6 border-b bg-gradient-to-r from-[#008689] to-[#00a5a8] text-white">
            <h1 className="text-2xl font-bold mb-1">
              Đánh giá bài báo #{id}
            </h1>
            <p className="text-sm opacity-90">
              Thực hiện đánh giá học thuật cho bài được phân công
            </p>
          </div>

          {/* Content */}
          <div className="p-8 space-y-8">

            {/* Paper info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 rounded-xl p-5">
              <div className="flex items-center gap-2 text-gray-700">
                <School className="text-[#008689]" />
                <span className="font-medium">ICCS 2026</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Description className="text-[#008689]" />
                Ứng dụng Deep Learning trong nhận diện khuôn mặt
              </div>
            </div>

            {/* Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <div>
                <label className="font-medium text-gray-700">
                  Tính mới (Originality)
                </label>
                <input
                  name="originality"
                  value={form.originality}
                  onChange={handleChange}
                  placeholder="Nhận xét về tính mới"
                  className="mt-2 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#008689]"
                />
              </div>

              <div>
                <label className="font-medium text-gray-700">
                  Chất lượng (Quality)
                </label>
                <input
                  name="quality"
                  value={form.quality}
                  onChange={handleChange}
                  placeholder="Đánh giá chất lượng nội dung"
                  className="mt-2 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#008689]"
                />
              </div>

              <div>
                <label className="font-medium text-gray-700">
                  Độ rõ ràng (Clarity)
                </label>
                <input
                  name="clarity"
                  value={form.clarity}
                  onChange={handleChange}
                  placeholder="Mức độ rõ ràng, dễ hiểu"
                  className="mt-2 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#008689]"
                />
              </div>
            </div>

            <div>
              <label className="font-medium text-gray-700">
                Nhận xét gửi tác giả
              </label>
              <textarea
                name="commentToAuthor"
                value={form.commentToAuthor}
                onChange={handleChange}
                rows={4}
                placeholder="Nhận xét này sẽ được gửi cho tác giả"
                className="mt-2 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#008689]"
              />
            </div>

            <div>
              <label className="font-medium text-gray-700">
                Nhận xét gửi Chủ tịch hội nghị
              </label>
              <textarea
                name="commentToChair"
                value={form.commentToChair}
                onChange={handleChange}
                rows={4}
                placeholder="Chỉ Chủ tịch hội nghị xem được"
                className="mt-2 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#008689]"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              <button
                onClick={() => navigate(-1)}
                className="px-6 py-2 rounded-lg border text-gray-600 hover:bg-gray-100"
              >
                Hủy
              </button>

              <button
                onClick={handleSubmit}
                className="flex items-center gap-2 px-6 py-2 rounded-lg bg-[#008689] hover:bg-[#006666] text-white font-medium"
              >
                <Send fontSize="small" />
                Gửi đánh giá
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewDetailPage;
