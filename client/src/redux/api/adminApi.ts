// client/src/redux/api/adminApi.ts

/**
 * ============================================
 * BƯỚC 2: TẠO REDUX API SLICE
 * ============================================
 * 
 * File này tạo ra các hooks để gọi API từ React components
 * Sử dụng RTK Query - thư viện data fetching của Redux Toolkit
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Lấy base URL từ environment variable hoặc dùng default
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

/**
 * INTERFACE: Định nghĩa cấu trúc dữ liệu trả về từ API
 * 
 * Giải thích:
 * - TypeScript cần biết cấu trúc dữ liệu để có type safety
 * - Interface này phải khớp với dữ liệu backend trả về
 */
export interface SystemStatistics {
    users: {
        total: number;
        active: number;
    };
    conferences: {
        total: number;
        active: number;
    };
    submissions: {
        total: number;
        submitted: number;
        underReview: number;
        accepted: number;
        rejected: number;
    };
    reviews: {
        total: number;
    };
    decisions: {
        total: number;
        accepted: number;
        rejected: number;
        acceptanceRate: string;  // "56.5"
    };
}

export interface RecentActivity {
    id: string;
    user: string;
    userId: number | null;
    action: string;
    resource: string;
    entityType: string | null;
    entityId: string | null;
    timestamp: string;  // "5 phút trước"
    createdAt: Date;
}

/**
 * TẠO API SLICE
 * 
 * createApi() tự động tạo:
 * - Reducer để lưu cache
 * - Middleware để handle requests
 * - Hooks để dùng trong components
 */
export const adminApi = createApi({
    // Tên reducer trong Redux store
    reducerPath: 'adminApi',

    /**
     * BASE QUERY: Cấu hình cách gọi API
     * 
     * fetchBaseQuery: Helper function từ RTK Query
     * - baseUrl: Prefix cho tất cả endpoints
     * - prepareHeaders: Function chạy trước mỗi request
     */
    baseQuery: fetchBaseQuery({
        baseUrl: `${API_BASE_URL}/api/admin`,

        /**
         * PREPARE HEADERS: Thêm JWT token vào mọi request
         * 
         * Flow:
         * 1. Lấy token từ localStorage
         * 2. Nếu có token → thêm vào Authorization header
         * 3. Backend sẽ verify token này
         */
        prepareHeaders: (headers) => {
            const token = localStorage.getItem('accessToken');
            if (token) {
                headers.set('Authorization', `Bearer ${token}`);
            }
            return headers;
        },
    }),

    /**
     * TAG TYPES: Dùng cho cache invalidation
     * 
     * Giải thích:
     * - Khi data thay đổi, ta có thể invalidate tags
     * - RTK Query sẽ tự động refetch data
     */
    tagTypes: ['Statistics', 'Activities'],

    /**
     * ENDPOINTS: Định nghĩa các API endpoints
     * 
     * builder.query: Cho GET requests
     * builder.mutation: Cho POST/PUT/DELETE requests
     */
    endpoints: (builder) => ({
        /**
         * ENDPOINT 1: Get System Statistics
         * 
         * Tạo hook: useGetSystemStatisticsQuery()
         * URL: GET /api/admin/statistics
         * Cache tag: 'Statistics'
         */
        getSystemStatistics: builder.query<SystemStatistics, void>({
            query: () => '/statistics',
            providesTags: ['Statistics'],
        }),

        /**
         * ENDPOINT 2: Get Recent Activities
         * 
         * Tạo hook: useGetRecentActivitiesQuery()
         * URL: GET /api/admin/recent-activities
         * Cache tag: 'Activities'
         */
        getRecentActivities: builder.query<RecentActivity[], void>({
            query: () => '/recent-activities',
            providesTags: ['Activities'],
        }),
    }),
});

/**
 * EXPORT HOOKS
 * 
 * RTK Query tự động tạo hooks từ endpoints
 * Naming convention: use[EndpointName]Query
 * 
 * Cách dùng trong component:
 * ```typescript
 * const { data, isLoading, error } = useGetSystemStatisticsQuery();
 * ```
 */
export const {
    useGetSystemStatisticsQuery,
    useGetRecentActivitiesQuery,
} = adminApi;
