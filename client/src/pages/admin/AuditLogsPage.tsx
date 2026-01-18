import { useState } from 'react';
import {
    Search,
} from '@mui/icons-material';
import { useGetRecentActivitiesQuery } from '../../redux/api/adminApi';

interface AuditLog {
    id: string;
    user: string;
    userId: number | null;
    action: string;
    resource: string;
    entityType: string | null;
    entityId: string | null;
    timestamp: string;
    createdAt: Date;
}

const AuditLogsPage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterAction, setFilterAction] = useState('all');
    const [filterDate, setFilterDate] = useState('');

    /**
     * BƯỚC 1: Gọi API để lấy audit logs thực
     * 
     * useGetRecentActivitiesQuery() tự động:
     * - Fetch data khi component mount
     * - Cache dữ liệu
     * - Provide loading/error states
     */
    const { data: apiLogs, isLoading, error } = useGetRecentActivitiesQuery();

    /**
     * BƯỚC 2: Transform API data sang format của UI
     * 
     * API trả về: { id, user, action, resource, timestamp, ... }
     * UI cần: { id, user, role, action, resource, details, status, ... }
     */
    const logs: AuditLog[] = apiLogs || [];

    /**
     * BƯỚC 3: Loading State
     */
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#008689] mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang tải nhật ký hoạt động...</p>
                </div>
            </div>
        );
    }

    /**
     * BƯỚC 4: Error State
     */
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">Không thể tải nhật ký hoạt động</p>
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
     * BƯỚC 5: Filter logs
     */
    const filteredLogs = logs.filter((log) => {
        const matchesSearch =
            log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.resource.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesAction = filterAction === 'all' || log.action.includes(filterAction);
        const matchesDate = !filterDate || log.timestamp.includes(filterDate);
        return matchesSearch && matchesAction && matchesDate;
    });

    const getActionColor = (action: string) => {
        if (action.includes('CREATE')) return 'text-green-600 bg-green-50';
        if (action.includes('UPDATE')) return 'text-blue-600 bg-blue-50';
        if (action.includes('DELETE')) return 'text-red-600 bg-red-50';
        if (action.includes('LOGIN_FAILED')) return 'text-red-600 bg-red-50';
        if (action.includes('LOGIN')) return 'text-purple-600 bg-purple-50';
        return 'text-gray-600 bg-gray-50';
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Nhật ký hoạt động
                    </h1>
                    <p className="text-gray-600">
                        Theo dõi và kiểm tra các hoạt động trong hệ thống
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <p className="text-sm font-medium text-gray-600">Tổng hoạt động</p>
                        <p className="text-2xl font-bold text-gray-900 mt-2">{logs.length}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <p className="text-sm font-medium text-gray-600">Hoạt động hôm nay</p>
                        <p className="text-2xl font-bold text-blue-600 mt-2">
                            {logs.filter(l => {
                                const today = new Date().toISOString().split('T')[0];
                                return l.timestamp.includes(today);
                            }).length}
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <p className="text-sm font-medium text-gray-600">Lỗi / Thất bại</p>
                        <p className="text-2xl font-bold text-red-600 mt-2">
                            {logs.filter(l => l.action.includes('FAILED') || l.action.includes('ERROR')).length}
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <p className="text-sm font-medium text-gray-600">Users hoạt động</p>
                        <p className="text-2xl font-bold text-green-600 mt-2">
                            {new Set(logs.map(l => l.user)).size}
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tìm kiếm
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Tìm theo user, resource..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008689] focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Loại hoạt động
                            </label>
                            <select
                                value={filterAction}
                                onChange={(e) => setFilterAction(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008689] focus:border-transparent"
                            >
                                <option value="all">Tất cả</option>
                                <option value="LOGIN">Đăng nhập</option>
                                <option value="CREATE">Tạo mới</option>
                                <option value="UPDATE">Cập nhật</option>
                                <option value="DELETE">Xóa</option>
                                <option value="SUBMIT">Nộp bài</option>
                                <option value="REVIEW">Đánh giá</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ngày
                            </label>
                            <input
                                type="date"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008689] focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>

                {/* Logs Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Thời gian / IP
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Người dùng
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Hành động
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Chi tiết
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Trạng thái
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                            {logs.length === 0
                                                ? 'Chưa có nhật ký hoạt động nào'
                                                : 'Không tìm thấy nhật ký nào phù hợp với bộ lọc'
                                            }
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {log.timestamp}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {new Date(log.createdAt).toLocaleString('vi-VN')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold mr-3">
                                                        {log.user.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {log.user}
                                                        </div>
                                                        {log.userId && (
                                                            <div className="text-xs text-gray-500">
                                                                ID: {log.userId}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(log.action)}`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900 font-medium">
                                                    {log.resource}
                                                </div>
                                                {log.entityType && (
                                                    <div className="text-sm text-gray-500">
                                                        {log.entityType} {log.entityId && `#${log.entityId.substring(0, 8)}`}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                    <span className="w-2 h-2 mr-1.5 bg-green-400 rounded-full" />
                                                    Success
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                            Hiển thị {filteredLogs.length} / {logs.length} bản ghi
                        </span>
                        <button className="text-sm text-[#008689] hover:text-[#006666] font-medium">
                            Xem thêm logs cũ hơn →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuditLogsPage;
