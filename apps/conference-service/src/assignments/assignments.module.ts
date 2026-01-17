import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';

import { Assignment } from './entities/assignment.entity';
import { Invitation } from '../invitations/entities/invitation.entity';
import { AssignmentsService } from './assignments.service';
import { AssignmentsController } from './assignments.controller';

import { ConferencesModule } from '../conferences/conferences.module';
import { AuditModule } from '../audit/audit.module';
import { UsersModule } from '../users/users.module';
import { SubmissionsClient } from '../integrations/submissions.client';
import { AiModule } from '../ai/ai.module';
import { EmailsModule } from '../emails/emails.module';
import { InvitationsModule } from '../invitations/invitations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Assignment, Invitation]),
    ConferencesModule,
    AuditModule,
    UsersModule,
    InvitationsModule,
    HttpModule,
    AiModule,
    EmailsModule,
  ],
  providers: [AssignmentsService, SubmissionsClient],
  controllers: [AssignmentsController],
  exports: [AssignmentsService],
})
export class AssignmentsModule { }