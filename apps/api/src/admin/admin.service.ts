import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboard() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers, newUsersToday, pendingKyc,
      totalTransactions, pendingTransactions, failedToday,
      allTimeVolume, weekVolume, weekFees,
      recentTransactions, pendingKycList,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { gte: today } } }),
      this.prisma.kyc.count({ where: { status: 'PENDING' } }),
      this.prisma.transaction.count(),
      this.prisma.transaction.count({ where: { status: { in: ['PENDING', 'PROCESSING'] } } }),
      this.prisma.transaction.count({ where: { status: 'FAILED', createdAt: { gte: today } } }),
      this.prisma.transaction.aggregate({ _sum: { amountKes: true, feeKes: true }, where: { status: 'COMPLETED' } }),
      this.prisma.transaction.aggregate({
        _sum: { amountKes: true, feeKes: true },
        where: { status: 'COMPLETED', createdAt: { gte: new Date(Date.now() - 7 * 86400000) } },
      }),
      this.prisma.transaction.aggregate({
        _sum: { feeKes: true },
        where: { status: 'COMPLETED', createdAt: { gte: new Date(Date.now() - 7 * 86400000) } },
      }),
      this.prisma.transaction.findMany({
        take: 10, orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, firstName: true, lastName: true } } },
      }),
      this.prisma.kyc.findMany({
        where: { status: 'PENDING' }, take: 5, orderBy: { submittedAt: 'asc' },
        include: { user: { select: { email: true, firstName: true, lastName: true } } },
      }),
    ]);

    return {
      stats: {
        totalUsers, newUsersToday, pendingKyc,
        totalTransactions, pendingTransactions, failedToday,
        totalVolumeKes: allTimeVolume._sum.amountKes?.toString() || '0',
        totalFeesKes: allTimeVolume._sum.feeKes?.toString() || '0',
        weekVolumeKes: weekVolume._sum.amountKes?.toString() || '0',
        weekFeesKes: weekFees._sum.feeKes?.toString() || '0',
      },
      recentTransactions,
      pendingKycList,
    };
  }

  async getUsers(page = 1, limit = 50, search?: string, kycStatus?: string, roleFilter?: string, activeFilter?: string) {
    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }
    if (roleFilter) where.role = roleFilter;
    if (activeFilter === 'active') where.isActive = true;
    if (activeFilter === 'suspended') where.isActive = false;
    if (kycStatus) where.kyc = { status: kycStatus };

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' },
        select: {
          id: true, email: true, firstName: true, lastName: true, phone: true,
          role: true, isActive: true, isEmailVerified: true, createdAt: true, lastLoginAt: true,
          kyc: { select: { tier: true, status: true, submittedAt: true, reviewedAt: true } },
          wallet: { select: { balanceSats: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total, page, pages: Math.ceil(total / limit), limit };
  }

  async getUserDetail(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        kyc: true,
        wallet: true,
        transactions: { take: 10, orderBy: { createdAt: 'desc' } },
        loginSessions: { take: 5, orderBy: { createdAt: 'desc' } },
        auditLogs: { take: 10, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!user) throw new BadRequestException('User not found');
    return user;
  }

  async changeUserRole(userId: string, newRole: string, adminId: string, adminRole: string) {
    const adminRoles = ['ADMIN', 'SUPER_ADMIN'];
    if (!adminRoles.includes(newRole) || adminRole === 'SUPER_ADMIN') {
      // SUPER_ADMIN can assign any role; ADMIN can only assign USER/SUPPORT
      if (adminRole !== 'SUPER_ADMIN' && ['ADMIN', 'SUPER_ADMIN'].includes(newRole)) {
        throw new ForbiddenException('Only SUPER_ADMIN can assign admin roles');
      }
    }
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { role: newRole as any },
      select: { id: true, email: true, role: true },
    });
    await this.prisma.auditLog.create({
      data: { userId: adminId, action: 'USER_ROLE_CHANGED', resourceId: userId, metadata: { newRole } },
    });
    return user;
  }

  async getKycQueue(status = 'PENDING', page = 1, limit = 20) {
    const where: any = { status };
    const [items, total] = await Promise.all([
      this.prisma.kyc.findMany({
        where, skip: (page - 1) * limit, take: limit,
        orderBy: status === 'PENDING' ? { submittedAt: 'asc' } : { reviewedAt: 'desc' },
        include: { user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true, createdAt: true } } },
      }),
      this.prisma.kyc.count({ where }),
    ]);
    return { items, total, page, pages: Math.ceil(total / limit) };
  }

  async approveKyc(userId: string, adminId: string) {
    const kyc = await this.prisma.kyc.update({
      where: { userId },
      data: { status: 'APPROVED', tier: 'TIER_2', reviewedBy: adminId, reviewedAt: new Date() },
    });
    await this.prisma.auditLog.create({
      data: { userId: adminId, action: 'KYC_APPROVED', resourceId: userId },
    });
    return kyc;
  }

  async rejectKyc(userId: string, adminId: string, reason: string) {
    const kyc = await this.prisma.kyc.update({
      where: { userId },
      data: { status: 'REJECTED', reviewedBy: adminId, reviewedAt: new Date(), rejectionReason: reason },
    });
    await this.prisma.auditLog.create({
      data: { userId: adminId, action: 'KYC_REJECTED', resourceId: userId, metadata: { reason } },
    });
    return kyc;
  }

  async getTransactions(page = 1, limit = 20, filters: {
    type?: string; status?: string; search?: string;
    dateFrom?: string; dateTo?: string;
  } = {}) {
    const where: any = {};
    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;
    if (filters.search) {
      where.OR = [
        { reference: { contains: filters.search, mode: 'insensitive' } },
        { user: { email: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
    }

    const [items, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { email: true, firstName: true, lastName: true } },
          mpesaTransaction: { select: { status: true, mpesaReceiptNumber: true, resultDesc: true } },
        },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    const agg = await this.prisma.transaction.aggregate({
      where: { ...where, status: 'COMPLETED' },
      _sum: { amountKes: true, feeKes: true },
    });

    return {
      items, total, page, pages: Math.ceil(total / limit), limit,
      summary: {
        volumeKes: agg._sum.amountKes?.toString() || '0',
        feesKes: agg._sum.feeKes?.toString() || '0',
      },
    };
  }

  async getAuditLogs(page = 1, limit = 50, userId?: string, action?: string) {
    const where: any = {};
    if (userId) where.userId = userId;
    if (action) where.action = { contains: action, mode: 'insensitive' };

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, firstName: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { items, total, page, pages: Math.ceil(total / limit) };
  }

  async suspendUser(userId: string, adminId: string, reason?: string) {
    await this.prisma.user.update({ where: { id: userId }, data: { isActive: false } });
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null }, data: { revokedAt: new Date() },
    });
    await this.prisma.auditLog.create({
      data: { userId: adminId, action: 'USER_SUSPENDED', resourceId: userId, metadata: { reason } },
    });
    return { message: 'User suspended and sessions revoked' };
  }

  async unsuspendUser(userId: string, adminId: string) {
    await this.prisma.user.update({ where: { id: userId }, data: { isActive: true } });
    await this.prisma.auditLog.create({
      data: { userId: adminId, action: 'USER_UNSUSPENDED', resourceId: userId },
    });
    return { message: 'User account reinstated' };
  }
}
