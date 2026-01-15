import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './auth/jwt.strategy';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { HealthController } from './health.controller';
import { ProfileController } from './profile.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewerModule } from './reviewer/reviewer.module';
import { Invitation } from './reviewer/entities/invitation.entity';
import { ReviewerAssignment } from './reviewer/entities/reviewer-assignment.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('DB_REVIEW_URL') || process.env.DB_REVIEW_URL;
        const syncEnv = config.get<string>('DB_REVIEW_SYNC') ?? process.env.DB_REVIEW_SYNC;
        // nếu biến DB_REVIEW_SYNC set thành 'true' hoặc khi không phải production thì mặc định true (dev)
        const synchronize = typeof syncEnv !== 'undefined' ? syncEnv === 'true' : (process.env.NODE_ENV !== 'production');
        
        // Log để debug
        console.log(`[TypeORM] Synchronize: ${synchronize}, NODE_ENV: ${process.env.NODE_ENV}, DB_REVIEW_SYNC: ${syncEnv}`);
        
        if (url) {
          return {
            type: 'postgres',
            url,
            entities: [Invitation, ReviewerAssignment],
            synchronize,
            ssl: config.get('DB_SSL') ? { rejectUnauthorized: false } : false,
          };
        }
        
        // Hỗ trợ cả DB_REVIEW_* và DB_* (cho docker-compose)
        const host = config.get<string>('DB_REVIEW_HOST') || process.env.DB_REVIEW_HOST || 
                     config.get<string>('DB_HOST') || process.env.DB_HOST || 'localhost';
        const port = Number(config.get<number>('DB_REVIEW_PORT') || process.env.DB_REVIEW_PORT || 
                     config.get<number>('DB_PORT') || process.env.DB_PORT || 5432);
        const username = config.get<string>('DB_REVIEW_USER') || process.env.DB_REVIEW_USER || 
                         config.get<string>('DB_USERNAME') || process.env.DB_USERNAME || 'postgres';
        const password = config.get<string>('DB_REVIEW_PASS') || process.env.DB_REVIEW_PASS || 
                         config.get<string>('DB_PASSWORD') || process.env.DB_PASSWORD || 'password';
        const database = config.get<string>('DB_REVIEW_NAME') || process.env.DB_REVIEW_NAME || 
                         config.get<string>('DB_DATABASE') || process.env.DB_DATABASE || 'db_review';
        
        const dbConfig = {
          type: 'postgres' as const,
          host,
          port,
          username,
          password,
          database,
          entities: [Invitation, ReviewerAssignment],
          synchronize,
          ssl: config.get('DB_SSL') ? { rejectUnauthorized: false } : false,
        };
        
        console.log(`[TypeORM] Connecting to: ${host}:${port}/${database}, synchronize: ${synchronize}`);
        
        return dbConfig;
      },
    }),
    ReviewerModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret =
          config.get<string>('JWT_ACCESS_SECRET') ||
          process.env.JWT_ACCESS_SECRET ||
          process.env.JWT_SECRET ||
          'dev_secret';
        return { secret, signOptions: { expiresIn: '15m' } };
      },
    }),
  ],
  controllers: [HealthController, ProfileController],
  providers: [
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
  ],
})
export class ReviewServiceModule {}