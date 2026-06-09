import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BitcoinModule } from './bitcoin/bitcoin.module';
import { MpesaModule } from './mpesa/mpesa.module';
import { TradingModule } from './trading/trading.module';
import { AdminModule } from './admin/admin.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PrismaModule } from './prisma/prisma.module';
import appConfig from './config/app.config';
import authConfig from './config/auth.config';
import mpesaConfig from './config/mpesa.config';
import bitcoinConfig from './config/bitcoin.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, authConfig, mpesaConfig, bitcoinConfig],
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 60000, limit: 100 },
      { name: 'long', ttl: 3600000, limit: 1000 },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    BitcoinModule,
    MpesaModule,
    TradingModule,
    AdminModule,
    NotificationsModule,
  ],
})
export class AppModule {}
