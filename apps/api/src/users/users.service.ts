import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, firstName: true, lastName: true, phone: true,
        role: true, isEmailVerified: true, createdAt: true,
        kyc: { select: { tier: true, status: true, idType: true, submittedAt: true } },
        wallet: { select: { address: true, balanceSats: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, data: { firstName?: string; lastName?: string; phone?: string }) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, email: true, firstName: true, lastName: true, phone: true },
    });
  }

  async submitKyc(userId: string, data: {
    idType: string;
    idNumber: string;
    idFrontUrl?: string;
    idBackUrl?: string;
    selfieUrl?: string;
  }) {
    const kyc = await this.prisma.kyc.upsert({
      where: { userId },
      create: { userId, ...data, status: 'PENDING', tier: 'TIER_2', submittedAt: new Date() },
      update: { ...data, status: 'PENDING', submittedAt: new Date() },
    });
    return { message: 'KYC submitted for review', kycId: kyc.id };
  }

  async getWallet(userId: string) {
    const wallet = await this.prisma.bitcoinWallet.findUnique({ where: { userId } });
    if (!wallet) return null;
    return {
      address: wallet.address,
      balanceSats: wallet.balanceSats.toString(),
      totalReceivedSats: wallet.totalReceivedSats.toString(),
    };
  }
}
