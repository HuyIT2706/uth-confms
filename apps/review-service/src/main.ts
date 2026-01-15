import { NestFactory } from '@nestjs/core';
import { ReviewServiceModule } from './review-service.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

// Nếu đang phát triển và chưa set DB_REVIEW_SYNC, bật để TypeORM tự tạo bảng (dev only)
if (!process.env.DB_REVIEW_SYNC && process.env.NODE_ENV !== 'production') {
  process.env.DB_REVIEW_SYNC = 'true';
  console.log('DB_REVIEW_SYNC not set — enabling DB sync for dev (DB_REVIEW_SYNC=true)');
}

async function bootstrap() {
  const app = await NestFactory.create(ReviewServiceModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  // enable CORS so external clients (e.g. frontends, curl) can call the health/profile endpoints
  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('Review Service')
    .setDescription('Review service API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${globalPrefix}/docs`, app, document);

  const port = process.env.PORT ? Number(process.env.PORT) : 3004;
  await app.listen(port);
  console.log(`Review service listening on http://localhost:${port}/${globalPrefix}`);
}
bootstrap();