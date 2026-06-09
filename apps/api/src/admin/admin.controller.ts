import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Admin')
@Controller({ path: 'admin', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Admin dashboard stats' })
  getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get('users')
  @ApiOperation({ summary: 'List all users' })
  getUsers(@Query('page') page = 1, @Query('limit') limit = 50, @Query('search') search?: string) {
    return this.adminService.getUsers(Number(page), Number(limit), search);
  }

  @Post('kyc/:userId/approve')
  @ApiOperation({ summary: 'Approve user KYC' })
  approveKyc(@Param('userId') userId: string, @CurrentUser('id') adminId: string) {
    return this.adminService.approveKyc(userId, adminId);
  }

  @Post('kyc/:userId/reject')
  @ApiOperation({ summary: 'Reject user KYC' })
  rejectKyc(
    @Param('userId') userId: string,
    @CurrentUser('id') adminId: string,
    @Body('reason') reason: string,
  ) {
    return this.adminService.rejectKyc(userId, adminId, reason);
  }

  @Post('users/:userId/suspend')
  @ApiOperation({ summary: 'Suspend a user account' })
  suspendUser(@Param('userId') userId: string, @CurrentUser('id') adminId: string) {
    return this.adminService.suspendUser(userId, adminId);
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'View audit logs' })
  getAuditLogs(@Query('page') page = 1, @Query('limit') limit = 50) {
    return this.adminService.getAuditLogs(Number(page), Number(limit));
  }
}
