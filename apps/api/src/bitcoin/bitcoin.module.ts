import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BitcoinService } from './bitcoin.service';

@Module({
  imports: [HttpModule],
  providers: [BitcoinService],
  exports: [BitcoinService],
})
export class BitcoinModule {}

