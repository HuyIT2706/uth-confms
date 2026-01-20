import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewerService } from './reviewer.service';
import { ReviewerController } from './reviewer.controller';
import { ReviewerAssignmentsController } from './reviewer-assignments.controller';
import { ReviewerAssignmentsInternalController } from './reviewer-assignments-internal.controller';
import { Invitation } from './entities/invitation.entity';
import { ReviewerAssignment } from './entities/reviewer-assignment.entity';
import { Review } from './entities/review.entity';
import { ReviewHistory } from './entities/review-history.entity';
import { SubmissionClient } from './clients/submission.client';

@Module({
  imports: [TypeOrmModule.forFeature([Invitation, ReviewerAssignment, Review, ReviewHistory])],
  controllers: [ReviewerController, ReviewerAssignmentsController, ReviewerAssignmentsInternalController],
  providers: [ReviewerService, SubmissionClient],
  exports: [ReviewerService],
})
export class ReviewerModule { }