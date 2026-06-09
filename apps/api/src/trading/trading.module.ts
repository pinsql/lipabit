import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TradingService } from './trading.service';
import { TradingController } from './trading.controller';
import { MpesaModule } from '../mpesa/mpesa.module';

@Module({
  imports: [HttpModule, MpesaModule],
  controllers: [TradingController],
  providers: [TradingService],
  exports: [TradingService],
})
export class TradingModule {}
