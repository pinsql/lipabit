import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TradingService } from './trading.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { IsNumber, IsString, Min, Max, Matches } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

const KE_PHONE = /^\+254[0-9]{9}$/;
const KE_PHONE_MSG = 'Must be a valid Kenyan number (+254XXXXXXXXX)';

class BuyBtcDto {
  @ApiProperty({ example: 5000 })
  @IsNumber() @Min(500) @Max(500000) @Type(() => Number)
  amountKes: number;

  @ApiProperty({ example: '+254712345678' })
  @IsString() @Matches(KE_PHONE, { message: KE_PHONE_MSG })
  phone: string;
}

class SellBtcDto {
  @ApiProperty({ example: 50000, description: 'Amount in satoshis' })
  @IsNumber() @Min(1000) @Type(() => Number)
  amountSats: number;

  @ApiProperty({ example: '+254712345678' })
  @IsString() @Matches(KE_PHONE, { message: KE_PHONE_MSG })
  phone: string;
}

@ApiTags('Trading')
@Controller({ path: 'trading', version: '1' })
export class TradingController {
  constructor(private readonly tradingService: TradingService) {}

  @Get('rate')
  @Throttle({ short: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Get current BTC/KES exchange rate (public)' })
  getRate() {
    return this.tradingService.getExchangeRate();
  }

  @Get('quote')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a price quote before trading' })
  getQuote(
    @CurrentUser('id') userId: string,
    @Query('type') type: 'BUY_BTC' | 'SELL_BTC',
    @Query('amountKes') amountKes: number,
  ) {
    return this.tradingService.getQuote(userId, type, Number(amountKes));
  }

  @Post('buy')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buy Bitcoin with M-Pesa (STK Push)' })
  buyBtc(@CurrentUser('id') userId: string, @Body() dto: BuyBtcDto) {
    return this.tradingService.initiateBuyBtc(userId, dto.amountKes, dto.phone);
  }

  @Post('sell')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sell Bitcoin and receive M-Pesa payout' })
  sellBtc(@CurrentUser('id') userId: string, @Body() dto: SellBtcDto) {
    return this.tradingService.initiateSellBtc(userId, dto.amountSats, dto.phone);
  }

  @Get('transactions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get transaction history' })
  getHistory(
    @CurrentUser('id') userId: string,
    @Query('page') @Type(() => Number) @Min(1) page: number = 1,
    @Query('limit') @Type(() => Number) @Min(1) @Max(100) limit: number = 20,
  ) {
    return this.tradingService.getTransactionHistory(userId, Number(page), Math.min(Number(limit), 100));
  }

  @Get('transactions/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific transaction' })
  getTransaction(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.tradingService.getTransactionById(userId, id);
  }
}
