import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private notifications: NotificationsService,
  ) {}

  async register(dto: RegisterDto, ipAddress?: string) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (existing) throw new ConflictException('Email already registered');

    if (dto.phone) {
      const phoneExists = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
      if (phoneExists) throw new ConflictException('Phone number already registered');
    }

    const rounds = this.config.get<number>('auth.bcryptRounds') || 12;
    const passwordHash = await bcrypt.hash(dto.password, rounds);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        passwordHash,
        kyc: { create: {} },
      },
    });

    const verificationToken = uuidv4();
    await this.prisma.emailVerification.create({
      data: {
        userId: user.id,
        token: verificationToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    await this.notifications.sendEmailVerification(user.email, user.firstName!, verificationToken);

    await this.prisma.auditLog.create({
      data: { userId: user.id, action: 'USER_REGISTERED', ipAddress },
    });

    return { message: 'Registration successful. Check your email to verify your account.' };
  }

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    const valid = user && (await bcrypt.compare(dto.password, user.passwordHash));

    await this.prisma.loginSession.create({
      data: {
        userId: user?.id || uuidv4(),
        ipAddress,
        userAgent,
        success: !!valid,
      },
    });

    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account has been suspended');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Please verify your email before logging in');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastLoginIp: ipAddress },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role, ipAddress, userAgent);

    await this.prisma.auditLog.create({
      data: { userId: user.id, action: 'USER_LOGIN', ipAddress, userAgent },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      ...tokens,
    };
  }

  async refreshTokens(token: string, ipAddress?: string) {
    let payload: any;
    try {
      payload = this.jwt.verify(token, {
        secret: this.config.get('auth.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokenHash = await bcrypt.hash(token, 1);
    const stored = await this.prisma.refreshToken.findFirst({
      where: { userId: payload.sub, revokedAt: null, expiresAt: { gt: new Date() } },
    });

    if (!stored) throw new UnauthorizedException('Refresh token expired or revoked');

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) throw new UnauthorizedException('Account not found or suspended');

    return this.generateTokens(user.id, user.email, user.role, ipAddress);
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await this.prisma.auditLog.create({
      data: { userId, action: 'USER_LOGOUT' },
    });
    return { message: 'Logged out successfully' };
  }

  async verifyEmail(token: string) {
    const record = await this.prisma.emailVerification.findUnique({ where: { token } });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired verification link');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { isEmailVerified: true },
      }),
      this.prisma.emailVerification.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { message: 'Email verified successfully. You can now log in.' };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return { message: 'If that email exists, a reset link has been sent.' };

    await this.prisma.passwordReset.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const token = uuidv4();
    await this.prisma.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    await this.notifications.sendPasswordReset(user.email, user.firstName!, token);
    return { message: 'If that email exists, a reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const record = await this.prisma.passwordReset.findUnique({ where: { token } });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const rounds = this.config.get<number>('auth.bcryptRounds') || 12;
    const passwordHash = await bcrypt.hash(newPassword, rounds);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordReset.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return { message: 'Password reset successful. Please log in with your new password.' };
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const payload = { sub: userId, email, role };
    const accessToken = this.jwt.sign(payload, {
      secret: this.config.get('auth.jwtSecret'),
      expiresIn: this.config.get('auth.jwtExpiresIn'),
    });
    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.get('auth.refreshSecret'),
      expiresIn: this.config.get('auth.refreshExpiresIn'),
    });

    const refreshExpiresIn = this.config.get('auth.refreshExpiresIn') || '7d';
    const days = parseInt(refreshExpiresIn) || 7;

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: refreshToken.slice(-32),
        ipAddress,
        deviceInfo: userAgent?.slice(0, 255),
        expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken, refreshToken };
  }
}
