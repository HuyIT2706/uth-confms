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
import { Submission } from './entities/submission.entity';
import { SubmissionFile } from './entities/submission-file.entity';
import { DiscussionComment } from './entities/discussion-comment.entity';
import { SubmissionClient } from './clients/submission.client';

@Module({
  imports: [TypeOrmModule.forFeature([Invitation, ReviewerAssignment, Review, ReviewHistory, Submission, SubmissionFile, DiscussionComment])],
  controllers: [ReviewerController, ReviewerAssignmentsController, ReviewerAssignmentsInternalController],
  providers: [ReviewerService, SubmissionClient],
  exports: [ReviewerService],
})
export class ReviewerModule { }