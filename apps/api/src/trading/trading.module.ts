import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TradingService } from './trading.service';
import { TradingController } from './trading.controller';
import { MpesaModule } from '../mpesa/mpesa.module';
import { BitcoinModule } from '../bitcoin/bitcoin.module';
import { EthereumModule } from '../ethereum/ethereum.module';

@Module({
  imports: [HttpModule, MpesaModule, BitcoinModule, EthereumModule],
  controllers: [TradingController],
  providers: [TradingService],
  exports: [TradingService],
})
export class TradingModule {}
