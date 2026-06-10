import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { EthereumService } from './ethereum.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [HttpModule, PrismaModule],
  providers: [EthereumService],
  exports: [EthereumService],
})
export class EthereumModule {}
