import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

const READ_ROLES = ['ADMIN', 'SUPER_ADMIN', 'SUPPORT'];
const WRITE_ROLES = ['ADMIN', 'SUPER_ADMIN'];
const SUPER_ONLY = ['SUPER_ADMIN'];

@ApiTags('Admin')
@Controller({ path: 'admin', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @Roles(...READ_ROLES)
  @ApiOperation({ summary: 'Admin dashboard stats' })
  getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get('users')
  @Roles(...READ_ROLES)
  @ApiOperation({ summary: 'List users with filters' })
  getUsers(
    @Query('page') page = '1',
    @Query('limit') limit = '50',
    @Query('search') search?: string,
    @Query('kycStatus') kycStatus?: string,
    @Query('role') role?: string,
    @Query('active') active?: string,
  ) {
    return this.adminService.getUsers(+page, Math.min(+limit, 100), search, kycStatus, role, active);
  }

  @Get('users/:userId')
  @Roles(...READ_ROLES)
  @ApiOperation({ summary: 'Get user detail' })
  getUserDetail(@Param('userId') userId: string) {
    return this.adminService.getUserDetail(userId);
  }

  @Patch('users/:userId/role')
  @Roles(...SUPER_ONLY)
  @ApiOperation({ summary: 'Change user role (SUPER_ADMIN only)' })
  changeRole(
    @Param('userId') userId: string,
    @Body('role') role: string,
    @CurrentUser('id') adminId: string,
    @CurrentUser('role') adminRole: string,
  ) {
    return this.adminService.changeUserRole(userId, role, adminId, adminRole);
  }

  @Post('users/:userId/suspend')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Suspend a user account' })
  suspendUser(
    @Param('userId') userId: string,
    @CurrentUser('id') adminId: string,
    @Body('reason') reason?: string,
  ) {
    return this.adminService.suspendUser(userId, adminId, reason);
  }

  @Post('users/:userId/unsuspend')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Reinstate a suspended user' })
  unsuspendUser(@Param('userId') userId: string, @CurrentUser('id') adminId: string) {
    return this.adminService.unsuspendUser(userId, adminId);
  }

  @Get('kyc')
  @Roles(...READ_ROLES)
  @ApiOperation({ summary: 'KYC review queue' })
  getKycQueue(
    @Query('status') status = 'PENDING',
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.adminService.getKycQueue(status, +page, +limit);
  }

  @Post('kyc/:userId/approve')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Approve user KYC' })
  approveKyc(@Param('userId') userId: string, @CurrentUser('id') adminId: string) {
    return this.adminService.approveKyc(userId, adminId);
  }

  @Post('kyc/:userId/reject')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Reject user KYC' })
  rejectKyc(
    @Param('userId') userId: string,
    @CurrentUser('id') adminId: string,
    @Body('reason') reason: string,
  ) {
    return this.adminService.rejectKyc(userId, adminId, reason);
  }

  @Get('transactions')
  @Roles(...READ_ROLES)
  @ApiOperation({ summary: 'Admin transaction list with filters' })
  getTransactions(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.adminService.getTransactions(+page, Math.min(+limit, 100), { type, status, search, dateFrom, dateTo });
  }

  @Get('audit-logs')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'View audit logs' })
  getAuditLogs(
    @Query('page') page = '1',
    @Query('limit') limit = '50',
    @Query('userId') userId?: string,
    @Query('action') action?: string,
  ) {
    return this.adminService.getAuditLogs(+page, Math.min(+limit, 100), userId, action);
  }
}
