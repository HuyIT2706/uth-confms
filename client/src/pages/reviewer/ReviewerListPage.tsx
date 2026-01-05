import { Link } from 'react-router-dom';

interface ReviewerAssignment {
  id: number;
  paperTitle: string;
  status: 'Pending' | 'Reviewed';
}

const ReviewerListPage = () => {
  const assignments: ReviewerAssignment[] = [
    {
      id: 1,
      paperTitle: 'Ứng dụng Deep Learning trong nhận diện khuôn mặt',
      status: 'Pending',
    },
    {
      id: 2,
      paperTitle: 'Blockchain trong quản lý chuỗi cung ứng',
      status: 'Pending',
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2>Danh sách bài được phân công</h2>

      {assignments.map((item) => (
        <div
          key={item.id}
          style={{
            border: '1px solid #ddd',
            padding: 16,
            marginTop: 12,
            borderRadius: 8,
          }}
        >
          <p><b>{item.paperTitle}</b></p>

          <Link to={`/reviewer/review/${item.id}`}>
            <button>
              Đánh giá bài
            </button>
          </Link>
        </div>
      ))}
    </div>
  );
};

export default ReviewerListPage;
