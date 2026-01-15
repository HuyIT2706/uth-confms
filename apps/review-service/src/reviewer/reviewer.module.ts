import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewerService } from './reviewer.service';
import { ReviewerController } from './reviewer.controller';
import { Invitation } from './entities/invitation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Invitation])],
  controllers: [ReviewerController],
  providers: [ReviewerService],
  exports: [ReviewerService],
})
export class ReviewerModule {}
