import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Description,
  School,
  AssignmentTurnedIn,
  Assessment,
  HourglassBottom,
  DoneAll,
} from '@mui/icons-material';

interface ReviewerAssignment {
  id: number;
  paperTitle: string;
  conferenceName: string;
  topic: string;
  status: 'Pending' | 'Reviewed';
}

const ReviewerListPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] =
    useState<'all' | 'Pending' | 'Reviewed'>('all');

  // Mock data
  const assignments: ReviewerAssignment[] = [
    {
      id: 1,
      paperTitle: 'Ứng dụng Deep Learning trong nhận diện khuôn mặt',
      conferenceName: 'ICCS 2026',
      topic: 'AI',
      status: 'Pending',
    },
    {
      id: 2,
      paperTitle: 'Phân tích dữ liệu lớn với Apache Spark',
      conferenceName: 'VSEC 2026',
      topic: 'Big Data',
      status: 'Reviewed',
    },
    {
      id: 3,
      paperTitle: 'Blockchain trong quản lý chuỗi cung ứng',
      conferenceName: 'ISIT 2026',
      topic: 'Blockchain',
      status: 'Pending',
    },
  ];

  const filteredAssignments = assignments.filter((a) => {
    const matchesSearch =
      a.paperTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.conferenceName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || a.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const total = assignments.length;
  const reviewed = assignments.filter((a) => a.status === 'Reviewed').length;
  const pending = assignments.filter((a) => a.status === 'Pending').length;

  const getStatusStyle = (status: string) =>
    status === 'Reviewed'
      ? 'bg-green-100 text-green-700'
      : 'bg-yellow-100 text-yellow-700';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e6f7f6] to-[#dff5f3] relative overflow-hidden">
      {/* Background decoration giống trang Chair */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#008689] rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-24 w-96 h-96 bg-[#00b3a4] rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#7fe3da] rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto py-10 px-4">

        {/* Header */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            Reviewer Dashboard
          </h1>
          <p className="text-gray-600">
            Quản lý và thực hiện đánh giá các bài báo được phân công
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/95 backdrop-blur rounded-xl p-5 shadow">
            <div className="flex items-center justify-between">
              <Assessment className="text-[#008689]" />
              <span className="text-sm text-gray-500">Tổng bài</span>
            </div>
            <p className="text-3xl font-bold mt-2">{total}</p>
          </div>

          <div className="bg-green-50/90 backdrop-blur rounded-xl p-5 shadow border border-green-100">
            <div className="flex items-center justify-between">
              <DoneAll className="text-green-600" />
              <span className="text-sm text-green-700">Đã đánh giá</span>
            </div>
            <p className="text-3xl font-bold mt-2 text-green-700">
              {reviewed}
            </p>
          </div>

          <div className="bg-yellow-50/90 backdrop-blur rounded-xl p-5 shadow border border-yellow-100">
            <div className="flex items-center justify-between">
              <HourglassBottom className="text-yellow-600" />
              <span className="text-sm text-yellow-700">Chưa đánh giá</span>
            </div>
            <p className="text-3xl font-bold mt-2 text-yellow-700">
              {pending}
            </p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="bg-white/95 backdrop-blur rounded-xl shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên bài hoặc hội nghị..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008689]"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008689]"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="Pending">Chưa đánh giá</option>
              <option value="Reviewed">Đã đánh giá</option>
            </select>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssignments.map((item) => (
            <div
              key={item.id}
              className="bg-white/95 backdrop-blur rounded-xl shadow-md hover:shadow-xl transition overflow-hidden relative border border-gray-100"
            >
              {/* Status badge */}
              <span
                className={`absolute top-4 right-4 text-xs px-3 py-1 rounded-full font-semibold ${getStatusStyle(
                  item.status
                )}`}
              >
                {item.status === 'Reviewed'
                  ? 'Đã đánh giá'
                  : 'Chưa đánh giá'}
              </span>

              <div className="p-6">
                {/* chừa khoảng cho badge */}
                <h3 className="text-lg font-bold text-gray-900 mb-3 pr-24">
                  {item.paperTitle}
                </h3>

                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex items-center">
                    <School className="w-4 h-4 mr-2 text-[#008689]" />
                    {item.conferenceName}
                  </div>
                  <div className="flex items-center">
                    <Description className="w-4 h-4 mr-2 text-[#008689]" />
                    Chủ đề: {item.topic}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t">
                <Link
                  to={`/reviewer/review/${item.id}`}
                  className={`flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg font-medium transition
                    ${
                      item.status === 'Reviewed'
                        ? 'bg-gray-300 text-gray-600 cursor-not-allowed pointer-events-none'
                        : 'bg-[#008689] hover:bg-[#006666] text-white'
                    }`}
                >
                  <AssignmentTurnedIn className="w-4 h-4" />
                  {item.status === 'Reviewed'
                    ? 'Đã đánh giá'
                    : 'Đánh giá bài'}
                </Link>
              </div>
            </div>
          ))}
        </div>

        {filteredAssignments.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center mt-10">
            <p className="text-gray-600">
              Không tìm thấy bài phù hợp
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewerListPage;
