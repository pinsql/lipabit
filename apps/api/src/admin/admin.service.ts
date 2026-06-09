import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboard() {
    const [totalUsers, pendingKyc, totalTransactions, recentTransactions] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.kyc.count({ where: { status: 'PENDING' } }),
      this.prisma.transaction.count(),
      this.prisma.transaction.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, firstName: true } } },
      }),
    ]);

    const volume = await this.prisma.transaction.aggregate({
      _sum: { amountKes: true, feeKes: true },
      where: { status: 'COMPLETED' },
    });

    return {
      stats: {
        totalUsers,
        pendingKyc,
        totalTransactions,
        totalVolumeKes: volume._sum.amountKes?.toString() || '0',
        totalFeesKes: volume._sum.feeKes?.toString() || '0',
      },
      recentTransactions,
    };
  }

  async getUsers(page = 1, limit = 50, search?: string) {
    const where = search
      ? { OR: [{ email: { contains: search } }, { firstName: { contains: search } }] }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { kyc: { select: { tier: true, status: true } } },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total, page, pages: Math.ceil(total / limit) };
  }

  async approveKyc(userId: string, adminId: string) {
    return this.prisma.kyc.update({
      where: { userId },
      data: { status: 'APPROVED', reviewedBy: adminId, reviewedAt: new Date() },
    });
  }

  async rejectKyc(userId: string, adminId: string, reason: string) {
    return this.prisma.kyc.update({
      where: { userId },
      data: { status: 'REJECTED', reviewedBy: adminId, reviewedAt: new Date(), rejectionReason: reason },
    });
  }

  async getAuditLogs(page = 1, limit = 50) {
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true } } },
      }),
      this.prisma.auditLog.count(),
    ]);
    return { items, total, page, pages: Math.ceil(total / limit) };
  }

  async suspendUser(userId: string, adminId: string) {
    await this.prisma.user.update({ where: { id: userId }, data: { isActive: false } });
    await this.prisma.auditLog.create({
      data: { userId: adminId, action: 'USER_SUSPENDED', resourceId: userId },
    });
    return { message: 'User suspended' };
  }
}
