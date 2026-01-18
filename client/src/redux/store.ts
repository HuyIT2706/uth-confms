// src/redux/store.ts  (hoặc src/store.ts)

import { configureStore } from '@reduxjs/toolkit';

// Chỉ import api slices VÀO store, KHÔNG import store VÀO api slice
import { invitationsApi } from './api/invitationsApi';      // ← đường dẫn tương đối từ store.ts
import { assignmentsApi } from './api/assignmentsApi';
import { apiSlice } from './api/apiSlice';                 // nếu còn dùng
// BƯỚC 2.2: Import adminApi
import { adminApi } from './api/adminApi';

/**
 * CONFIGURE STORE
 * 
 * Giải thích:
 * - reducer: Đăng ký tất cả reducers (bao gồm API slices)
 * - middleware: Thêm middleware của RTK Query để handle caching, refetching
 */
export const store = configureStore({
  reducer: {
    [invitationsApi.reducerPath]: invitationsApi.reducer,
    [assignmentsApi.reducerPath]: assignmentsApi.reducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
    // BƯỚC 2.2: Đăng ký adminApi reducer
    [adminApi.reducerPath]: adminApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      invitationsApi.middleware,
      assignmentsApi.middleware,
      apiSlice.middleware,
      // BƯỚC 2.2: Thêm adminApi middleware
      adminApi.middleware,
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;