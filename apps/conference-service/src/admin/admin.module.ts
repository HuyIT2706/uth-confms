// apps/conference-service/src/admin/admin.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';

import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Conference } from '../conferences/entities/conference.entity';
import { AuditLog } from '../audit/audit-log.entity';

/**
 * GIẢI THÍCH AdminModule:
 * 
 * Module này đóng gói tất cả logic liên quan đến Admin:
 * - Controller: Định nghĩa API endpoints
 * - Service: Chứa business logic
 * - TypeORM: Import entities để có thể query database
 * - HttpModule: Để gọi HTTP requests đến các services khác
 * 
 * Sau khi tạo module này, chúng ta cần import nó vào
 * conference-service.module.ts để NestJS biết và load nó
 */
@Module({
    imports: [
        // Import entities để có thể inject repositories
        TypeOrmModule.forFeature([Conference, AuditLog]),

        // Import HttpModule để sử dụng HttpService
        HttpModule,
    ],
    controllers: [AdminController],
    providers: [AdminService],
    exports: [AdminService], // Export để module khác có thể dùng
})
export class AdminModule { }
