import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewerService } from './reviewer.service';
import { ReviewerController } from './reviewer.controller';
import { ReviewerAssignmentsController } from './reviewer-assignments.controller';
import { ReviewerAssignmentsInternalController } from './reviewer-assignments-internal.controller';
import { Invitation } from './entities/invitation.entity';
import { ReviewerAssignment } from './entities/reviewer-assignment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Invitation, ReviewerAssignment])],
  controllers: [ReviewerController, ReviewerAssignmentsController, ReviewerAssignmentsInternalController],
  providers: [ReviewerService],
  exports: [ReviewerService],
})
export class ReviewerModule {}