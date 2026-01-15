import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { Roles } from './auth/roles.decorator';

@Controller()
export class ReviewServiceController {
  // ...existing constructor / methods...

  @Get('reviewer/assignments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('REVIEWER')
  async getMyAssignments(@Request() req) {
    const userId = req.user?.userId;
    // ...existing logic or placeholder ...
    return { message: 'assignments for reviewer', userId };
  }
}