// apps/conference-service/src/admin/admin.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

import { Conference } from '../conferences/entities/conference.entity';
import { AuditLog } from '../audit/audit-log.entity';

/**
 * GIẢI THÍCH AdminService:
 * 
 * Service này có nhiệm vụ:
 * 1. Gọi Identity Service để lấy số lượng users
 * 2. Query local database để lấy số lượng conferences
 * 3. Gọi Submission Service để lấy thống kê submissions
 * 4. Gọi Review Service để lấy số lượng reviews
 * 5. Tổng hợp và format dữ liệu trả về cho frontend
 */
@Injectable()
export class AdminService {
    private readonly logger = new Logger(AdminService.name);

    constructor(
        // Inject Conference repository để query database
        @InjectRepository(Conference)
        private conferenceRepo: Repository<Conference>,

        // Inject AuditLog repository để lấy activities
        @InjectRepository(AuditLog)
        private auditLogRepo: Repository<AuditLog>,

        // HttpService để gọi API của các services khác
        private readonly httpService: HttpService,
    ) { }

    /**
     * PHƯƠNG THỨC CHÍNH 1: Lấy thống kê tổng quan
     * 
     * Flow:
     * 1. Gọi getUsersCount() → lấy từ Identity Service
     * 2. Query conferenceRepo.count() → đếm conferences trong DB
     * 3. Gọi getSubmissionsStats() → lấy từ Submission Service
     * 4. Gọi getReviewsCount() → lấy từ Review Service
     * 5. Tổng hợp và return JSON
     */
    async getSystemStatistics() {
        try {
            // Bước 1: Lấy số lượng users từ Identity Service
            const usersCount = await this.getUsersCount();

            // Bước 2: Đếm conferences trong database local
            const conferencesCount = await this.conferenceRepo.count();

            // Bước 3: Lấy thống kê submissions
            const submissionsStats = await this.getSubmissionsStats();

            // Bước 4: Lấy số lượng reviews
            const reviewsCount = await this.getReviewsCount();

            // Bước 5: Tính acceptance rate
            const totalDecisions = submissionsStats.accepted + submissionsStats.rejected;
            const acceptanceRate = totalDecisions > 0
                ? ((submissionsStats.accepted / totalDecisions) * 100).toFixed(1)
                : '0.0';

            // Bước 6: Return dữ liệu đã format
            return {
                users: {
                    total: usersCount.total,
                    active: usersCount.active,
                },
                conferences: {
                    total: conferencesCount,
                    active: await this.conferenceRepo.count({ where: { isActive: true } }),
                },
                submissions: {
                    total: submissionsStats.total,
                    submitted: submissionsStats.submitted,
                    underReview: submissionsStats.underReview,
                    accepted: submissionsStats.accepted,
                    rejected: submissionsStats.rejected,
                },
                reviews: {
                    total: reviewsCount,
                },
                decisions: {
                    total: totalDecisions,
                    accepted: submissionsStats.accepted,
                    rejected: submissionsStats.rejected,
                    acceptanceRate,
                },
            };
        } catch (error) {
            this.logger.error('Error getting system statistics:', error);
            throw error;
        }
    }

    /**
     * PHƯƠNG THỨC CHÍNH 2: Lấy hoạt động gần đây
     * 
     * Flow:
     * 1. Query audit_logs table, sắp xếp theo createdAt DESC
     * 2. Lấy 10 records đầu tiên
     * 3. Enrich với thông tin user (gọi Identity Service)
     * 4. Format timestamp thành "5 phút trước", "1 giờ trước"
     */
    async getRecentActivities(limit: number = 10) {
        try {
            // Bước 1: Query audit logs
            const activities = await this.auditLogRepo.find({
                order: { createdAt: 'DESC' },
                take: limit,
            });

            // Bước 2: Enrich với user info
            const enrichedActivities = await Promise.all(
                activities.map(async (activity) => {
                    let userName = 'Unknown User';

                    // Chỉ fetch user info nếu có userId
                    if (activity.userId) {
                        try {
                            const user = await this.getUserInfo(activity.userId);
                            userName = user?.fullName || user?.email || `User #${activity.userId}`;
                        } catch (err) {
                            this.logger.warn(`Could not fetch user info for userId ${activity.userId}`);
                        }
                    }

                    return {
                        id: activity.id,
                        user: userName,
                        userId: activity.userId,
                        action: this.formatAction(activity.action),
                        resource: this.formatResource(activity.entity || 'Unknown', activity.entityId || ''),
                        entityType: activity.entity,
                        entityId: activity.entityId,
                        timestamp: this.formatTimestamp(activity.createdAt),
                        createdAt: activity.createdAt,
                    };
                }),
            );

            return enrichedActivities;
        } catch (error) {
            this.logger.error('Error getting recent activities:', error);
            throw error;
        }
    }

    // ============ PRIVATE HELPER METHODS ============

    /**
     * HELPER 1: Lấy số lượng users từ Identity Service
     * 
     * Giải thích:
     * - Gọi HTTP GET đến Identity Service (port 3001)
     * - Endpoint: /api/users
     * - Parse response và đếm users theo role
     */
    private async getUsersCount() {
        try {
            // ENV đã có /api: http://identity-service:3001/api
            const identityUrl = process.env.IDENTITY_SERVICE_URL || 'http://identity-service:3001/api';
            const url = `${identityUrl}/users/count`; // Không thêm /api nữa

            // Gọi API với timeout 5 giây
            const { data } = await firstValueFrom(
                this.httpService.get(url, { timeout: 5000 })
            );

            // Endpoint /count trả về { total, active } trực tiếp
            return {
                total: data.total || 0,
                active: data.active || 0,
            };
        } catch (error) {
            this.logger.error('Error fetching users count:', error);
            return { total: 0, active: 0 };
        }
    }

    /**
     * HELPER 2: Lấy thống kê submissions từ Submission Service
     */
    private async getSubmissionsStats() {
        try {
            // ENV đã có /api: http://submission-service:3003/api
            const submissionUrl = process.env.SUBMISSION_SERVICE_URL || 'http://submission-service:3003/api';
            const url = `${submissionUrl}/submissions`;

            const { data } = await firstValueFrom(
                this.httpService.get(url, { timeout: 5000 })
            );

            const submissions = Array.isArray(data) ? data : (data?.data || []);

            return {
                total: submissions.length,
                submitted: submissions.filter((s: any) => s.status === 'SUBMITTED').length,
                underReview: submissions.filter((s: any) => s.status === 'UNDER_REVIEW').length,
                accepted: submissions.filter((s: any) => s.status === 'ACCEPTED').length,
                rejected: submissions.filter((s: any) => s.status === 'REJECTED').length,
            };
        } catch (error) {
            this.logger.error('Error fetching submissions stats:', error);
            return { total: 0, submitted: 0, underReview: 0, accepted: 0, rejected: 0 };
        }
    }

    /**
     * HELPER 3: Lấy số lượng reviews từ Review Service
     */
    private async getReviewsCount() {
        try {
            // ENV đã có /api: http://review-service:3004/api
            const reviewUrl = process.env.REVIEW_SERVICE_URL || 'http://review-service:3004/api';
            const url = `${reviewUrl}/reviewer/reviews`;

            const { data } = await firstValueFrom(
                this.httpService.get(url, { timeout: 5000 })
            );

            const reviews = Array.isArray(data) ? data : (data?.data || []);
            return reviews.length;
        } catch (error) {
            this.logger.error('Error fetching reviews count:', error);
            return 0;
        }
    }

    /**
     * HELPER 4: Lấy thông tin 1 user cụ thể
     */
    private async getUserInfo(userId: number) {
        try {
            // ENV đã có /api: http://identity-service:3001/api
            const identityUrl = process.env.IDENTITY_SERVICE_URL || 'http://identity-service:3001/api';
            const url = `${identityUrl}/users/${userId}`;

            const { data } = await firstValueFrom(
                this.httpService.get(url, { timeout: 3000 })
            );

            return data;
        } catch (error) {
            return null;
        }
    }

    /**
     * HELPER 5: Format action thành tiếng Việt
     */
    private formatAction(action: string): string {
        const actionMap: Record<string, string> = {
            'CREATE_CONFERENCE': 'đã tạo hội nghị mới',
            'UPDATE_CONFERENCE': 'đã cập nhật hội nghị',
            'DELETE_CONFERENCE': 'đã xóa hội nghị',
            'INVITE_REVIEWER': 'đã mời reviewer',
            'CREATE_USER': 'đã tạo người dùng mới',
        };

        return actionMap[action] || action.toLowerCase().replace(/_/g, ' ');
    }

    /**
     * HELPER 6: Format resource name
     */
    private formatResource(entityType: string, entityId: string): string {
        if (entityType === 'Conference') {
            return `Conference #${entityId.substring(0, 8)}`;
        }
        if (entityType === 'User') {
            return `User #${entityId}`;
        }
        return `${entityType} #${entityId}`;
    }

    /**
     * HELPER 7: Format timestamp thành "5 phút trước"
     */
    private formatTimestamp(date: Date): string {
        const now = new Date();
        const diffMs = now.getTime() - new Date(date).getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Vừa xong';
        if (diffMins < 60) return `${diffMins} phút trước`;
        if (diffHours < 24) return `${diffHours} giờ trước`;
        if (diffDays < 7) return `${diffDays} ngày trước`;

        return new Date(date).toLocaleDateString('vi-VN');
    }
}
