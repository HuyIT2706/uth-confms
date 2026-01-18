import { Link } from 'react-router-dom';
import {
    People,
    Settings,
    Description,
    Assessment,
    CalendarMonth,
    BarChart as BarChartIcon,
    Dashboard as DashboardIcon,
} from '@mui/icons-material';
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
/**
 * BƯỚC 3.1: Import hooks từ adminApi
 * 
 * Giải thích:
 * - useGetSystemStatisticsQuery: Hook để lấy thống kê tổng quan
 * - useGetRecentActivitiesQuery: Hook để lấy hoạt động gần đây
 * 
 * RTK Query tự động:
 * - Gọi API khi component mount
 * - Cache dữ liệu
 * - Provide loading/error states
 */
import { useGetSystemStatisticsQuery, useGetRecentActivitiesQuery } from '../../redux/api/adminApi';

const AdminDashboard = () => {
    /**
     * BƯỚC 3.2: Gọi API hooks
     * 
     * Giải thích destructuring:
     * - data: Dữ liệu trả về từ API (undefined khi chưa có)
     * - isLoading: true khi đang fetch
     * - error: Chứa lỗi nếu API call thất bại
     * 
     * Đặt alias:
     * - data: stats → dễ đọc hơn
     * - isLoading: statsLoading → phân biệt với loading khác
     */
    const { data: stats, isLoading: statsLoading, error: statsError } = useGetSystemStatisticsQuery();
    const { data: activities } = useGetRecentActivitiesQuery();

    /**
     * BƯỚC 3.3: Hiển thị Loading State
     * 
     * Khi đang fetch data:
     * - Hiển thị spinner
     * - Ngăn render phần còn lại (tránh lỗi undefined)
     */
    if (statsLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#008689] mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang tải dữ liệu thống kê...</p>
                </div>
            </div>
        );
    }

    /**
     * BƯỚC 3.4: Hiển thị Error State
     * 
     * Khi API call thất bại:
     * - Hiển thị thông báo lỗi
     * - Cung cấp nút "Thử lại"
     */
    if (statsError) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">Không thể tải dữ liệu thống kê</p>
                    <p className="text-sm text-gray-600 mb-4">
                        Vui lòng kiểm tra Conference Service có đang chạy không
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-[#008689] text-white rounded hover:bg-[#006666]"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    /**
     * BƯỚC 3.5: Thay thế Mock Data bằng Real Data
     * 
     * Trước: Hard-coded values
     * Sau: Lấy từ stats object (với fallback)
     * 
     * Optional chaining (?.) và nullish coalescing (||):
     * - stats?.submissions.total: Nếu stats undefined → không lỗi
     * - || '0': Nếu giá trị null/undefined → dùng '0'
     */
    const systemStats = [
        {
            label: 'Tổng bài nộp',
            value: stats?.submissions.total.toString() || '0',
            icon: Description,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            trend: `${stats?.submissions.underReview || 0} đang xét duyệt`,
        },
        {
            label: 'Tỷ lệ chấp nhận',
            value: `${stats?.decisions.acceptanceRate || '0'}%`,
            icon: Assessment,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            trend: `${stats?.decisions.accepted || 0}/${stats?.decisions.total || 0} được chấp nhận`,
        },
        {
            label: 'Người dùng',
            value: stats?.users.total.toString() || '0',
            icon: People,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            trend: `${stats?.users.active || 0} đang hoạt động`,
        },
        {
            label: 'Hội nghị',
            value: stats?.conferences.total.toString() || '0',
            icon: CalendarMonth,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
            trend: `${stats?.conferences.active || 0} đang hoạt động`,
        },
    ];

    const quickActions = [
        {
            title: 'Tạo hội nghị mới',
            description: 'Tạo một hội nghị mới trong hệ thống',
            icon: DashboardIcon,
            path: '/chair/conferences/create',
            color: 'text-[#008689]',
            bgColor: 'bg-[#e6f7f7]',
            borderColor: 'border-[#008689]/30',
        },
        {
            title: 'Chức năng Chair',
            description: 'Truy cập tất cả chức năng quản lý hội nghị',
            icon: DashboardIcon,
            path: '/chair/conferences',
            color: 'text-indigo-600',
            bgColor: 'bg-indigo-50',
            borderColor: 'border-indigo-200',
        },
        {
            title: 'Quản lý người dùng',
            description: 'Xem, tạo, sửa, xóa users và phân quyền',
            icon: People,
            path: '/admin/users',
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200',
        },
        {
            title: 'Tất cả hội nghị',
            description: 'Quản lý toàn bộ conferences trong hệ thống',
            icon: CalendarMonth,
            path: '/admin/conferences',
            color: 'text-[#008689]',
            bgColor: 'bg-[#e6f7f7]',
            borderColor: 'border-[#008689]/30',
        },
        {
            title: 'Cài đặt hệ thống',
            description: 'SMTP, quotas, và cấu hình nền tảng',
            icon: Settings,
            path: '/admin/settings',
            color: 'text-gray-600',
            bgColor: 'bg-gray-50',
            borderColor: 'border-gray-200',
        },
    ];

    /**
     * BƯỚC 3.6: Sử dụng Recent Activities từ API
     * 
     * Trước: Mock data array
     * Sau: activities từ useGetRecentActivitiesQuery()
     * 
     * Fallback: Nếu activities undefined → dùng empty array []
     */
    const recentActivity = activities || [];

    /**
     * BƯỚC 3.7: Cập nhật biểu đồ với dữ liệu thực
     * 
     * Bar Chart: Hiển thị tổng số submissions, reviews, decisions
     * (Simplified vì chưa có API cho track-specific data)
     */
    const submissionsByTrack = [
        {
            name: 'Tổng hợp',
            'Bài nộp': stats?.submissions.total || 0,
            'Quyết định': stats?.decisions.total || 0,
            'Đã đánh giá': stats?.reviews.total || 0
        },
    ];

    /**
     * Pie Chart: Tỷ lệ chấp nhận theo loại
     * Sử dụng dữ liệu thực từ stats.decisions
     */
    const acceptanceData = [
        {
            name: 'Chấp nhận',
            value: stats?.decisions.accepted || 0,
            color: '#10b981'
        },
        {
            name: 'Từ chối',
            value: stats?.decisions.rejected || 0,
            color: '#ef4444'
        },
        {
            name: 'Đang xét',
            value: stats?.submissions.underReview || 0,
            color: '#f59e0b'
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Section */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Bảng điều khiển Admin
                    </h1>
                    <p className="text-gray-600">
                        Quản lý toàn bộ hệ thống UTH-ConfMS
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {systemStats.map((stat, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className={`${stat.bgColor} ${stat.color} p-3 rounded-lg`}>
                                    <stat.icon className="w-6 h-6" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-gray-900 mb-1">
                                {stat.value}
                            </p>
                            <p className="text-sm font-medium text-gray-600 mb-2">
                                {stat.label}
                            </p>
                            <p className="text-xs text-gray-500">
                                {stat.trend}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Quick Actions */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                        Chức năng quản trị
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {quickActions.map((action, index) => (
                            <Link
                                key={index}
                                to={action.path}
                                className={`bg-white rounded-lg p-5 border-2 ${action.borderColor} hover:shadow-lg transition-all duration-300 group`}
                            >
                                <div className="flex items-start">
                                    <div className={`${action.bgColor} ${action.color} p-3 rounded-lg mr-4 group-hover:scale-110 transition-transform duration-200`}>
                                        <action.icon className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900 mb-1">
                                            {action.title}
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            {action.description}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Bar Chart - Submissions by Track */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                            Thống kê bài nộp theo phân ban
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={submissionsByTrack}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" angle={-15} textAnchor="end" height={80} />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="submissions" fill="#3b82f6" name="Bài nộp" />
                                <Bar dataKey="reviews" fill="#10b981" name="Đã đánh giá" />
                                <Bar dataKey="decisions" fill="#f59e0b" name="Quyết định" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Pie Chart - Acceptance Rate */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                            Tỷ lệ chấp nhận theo loại
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={acceptanceData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {acceptanceData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Statistics Table - Removed until we have API endpoint for school-specific data */}

                {/* Recent Activity */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900">
                            Hoạt động gần đây
                        </h2>
                        <Link
                            to="/admin/audit-logs"
                            className="text-sm text-[#008689] hover:text-[#006666] font-medium"
                        >
                            Xem tất cả →
                        </Link>
                    </div>

                    <div className="space-y-3">
                        {recentActivity.map((activity) => (
                            <div
                                key={activity.id}
                                className="flex items-start p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-200"
                            >
                                <div className="flex-1">
                                    <p className="text-sm text-gray-900">
                                        <span className="font-semibold">{activity.user}</span>
                                        {' '}{activity.action}
                                        {' '}
                                        <span className="text-[#008689] font-medium">
                                            {activity.resource}
                                        </span>
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {activity.timestamp}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
