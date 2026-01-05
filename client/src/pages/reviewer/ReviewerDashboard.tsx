import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import reviewerApi from '../../api/reviewer.api';
import type { ReviewerAssignment } from '../../api/reviewer.api';

const ReviewerDashboard = () => {
  const [assignments, setAssignments] = useState<ReviewerAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    reviewerApi
      .getAssignments()
      .then((res) => setAssignments(res.data))
      .finally(() => setLoading(false));
  }, []);

  // =========================
  // 🔹 THÊM PHẦN THỐNG KÊ
  // =========================
  const total = assignments.length;
  const reviewed = assignments.filter((a) => a.status === 'SUBMITTED').length;
  const pending = assignments.filter((a) => a.status !== 'SUBMITTED').length;
  const dueSoon = pending; // tạm thời, sau này gắn deadline thật

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Reviewer Dashboard</h1>
      <p className="text-gray-600 mb-6">
        Danh sách các bài báo được giao đánh giá
      </p>

      {/* ========================= */}
      {/* 🔹 DASHBOARD THỐNG KÊ */}
      {/* ========================= */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg p-4 shadow">
          <p className="text-sm text-gray-500">Tổng bài được giao</p>
          <p className="text-2xl font-bold">{total}</p>
        </div>

        <div className="bg-green-50 rounded-lg p-4 shadow">
          <p className="text-sm text-green-700">Đã đánh giá</p>
          <p className="text-2xl font-bold text-green-700">{reviewed}</p>
        </div>

        <div className="bg-yellow-50 rounded-lg p-4 shadow">
          <p className="text-sm text-yellow-700">Chưa đánh giá</p>
          <p className="text-2xl font-bold text-yellow-700">{pending}</p>
        </div>

        <div className="bg-red-50 rounded-lg p-4 shadow">
          <p className="text-sm text-red-700">Cần xử lý</p>
          <p className="text-2xl font-bold text-red-700">{dueSoon}</p>
        </div>
      </div>

      {/* ========================= */}
      {/* 🔹 DANH SÁCH BÀI */}
      {/* ========================= */}
      {loading && <p>Đang tải dữ liệu...</p>}

      {!loading && assignments.length === 0 && (
        <p>Chưa có bài được giao</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {assignments.map((a) => (
          <div
            key={a.assignmentId}
            className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition"
          >
            <h2 className="font-semibold text-lg">{a.paperTitle}</h2>
            <p className="text-sm text-gray-600">{a.conferenceName}</p>

            <div className="mt-4 flex items-center justify-between">
              <span
                className={`text-sm px-3 py-1 rounded-full ${
                  a.status === 'SUBMITTED'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                {a.status === 'SUBMITTED'
                  ? 'Đã gửi review'
                  : 'Chưa review'}
              </span>

              <button
                className="text-teal-600 font-medium hover:underline"
                onClick={() =>
                  navigate(`/reviewer/review/${a.assignmentId}`)
                }
              >
                Đánh giá →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewerDashboard;
