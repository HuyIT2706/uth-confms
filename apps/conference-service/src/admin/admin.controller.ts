// apps/conference-service/src/admin/admin.controller.ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleName } from '../common/role.enum';
import { AdminService } from './admin.service';

/**
 * ADMIN CONTROLLER
 * 
 * Mục đích: Định nghĩa các API endpoints cho Admin Dashboard
 * 
 * Decorators giải thích:
 * - @ApiTags('Admin'): Nhóm endpoints vào section "Admin" trong Swagger
 * - @ApiBearerAuth(): Yêu cầu JWT token trong Authorization header
 * - @Controller('api/admin'): Base URL là /api/admin
 * - @UseGuards: Bảo vệ endpoints bằng JWT + Role check
 * - @Roles(RoleName.ADMIN): Chỉ user có role ADMIN mới truy cập được
 */
@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')  // ← SỬA: Bỏ 'api/' vì NestJS đã có globalPrefix '/api'
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.ADMIN)
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    /**
     * ENDPOINT 1: Lấy thống kê tổng quan hệ thống
     * 
     * URL: GET /api/admin/statistics
     * 
     * Trả về:
     * - Tổng số users (total, active)
     * - Tổng số conferences (total, active)
     * - Thống kê submissions (total, submitted, underReview, accepted, rejected)
     * - Tổng số reviews
     * - Thống kê decisions (total, accepted, rejected, acceptanceRate)
     * 
     * Flow:
     * 1. Frontend gọi: useGetSystemStatisticsQuery()
     * 2. Request đến API Gateway
     * 3. Forward đến Conference Service
     * 4. AdminService tổng hợp dữ liệu từ 4 services
     * 5. Return JSON cho frontend
     */
    @Get('statistics')
    @ApiOperation({ summary: 'Get system-wide statistics for admin dashboard' })
    async getSystemStatistics() {
        return this.adminService.getSystemStatistics();
    }

    /**
     * ENDPOINT 2: Lấy hoạt động gần đây từ audit logs
     * 
     * URL: GET /api/admin/recent-activities
     * 
     * Trả về: 10 activities gần nhất từ audit_logs table
     * 
     * Mỗi activity bao gồm:
     * - id: UUID của activity
     * - user: Tên người thực hiện
     * - action: Hành động (đã format tiếng Việt)
     * - resource: Tài nguyên bị ảnh hưởng
     * - timestamp: Thời gian (format: "5 phút trước")
     * 
     * Flow:
     * 1. Query audit_logs table
     * 2. Enrich với user info từ Identity Service
     * 3. Format action và timestamp
     * 4. Return array
     */
    @Get('recent-activities')
    @ApiOperation({ summary: 'Get recent activities from audit logs' })
    async getRecentActivities() {
        return this.adminService.getRecentActivities();
    }
}
