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
import { IsNumber, IsString, IsPhoneNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class BuyBtcDto {
  @ApiProperty({ example: 5000 })
  @IsNumber()
  @Min(500)
  @Type(() => Number)
  amountKes: number;

  @ApiProperty({ example: '+254712345678' })
  @IsString()
  phone: string;
}

class SellBtcDto {
  @ApiProperty({ example: 50000, description: 'Amount in satoshis' })
  @IsNumber()
  @Min(1000)
  @Type(() => Number)
  amountSats: number;

  @ApiProperty({ example: '+254712345678' })
  @IsString()
  phone: string;
}

@ApiTags('Trading')
@Controller({ path: 'trading', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TradingController {
  constructor(private readonly tradingService: TradingService) {}

  @Get('rate')
  @ApiOperation({ summary: 'Get current BTC/KES exchange rate' })
  getRate() {
    return this.tradingService.getExchangeRate();
  }

  @Get('quote')
  @ApiOperation({ summary: 'Get a price quote before trading' })
  getQuote(
    @CurrentUser('id') userId: string,
    @Query('type') type: 'BUY_BTC' | 'SELL_BTC',
    @Query('amountKes') amountKes: number,
  ) {
    return this.tradingService.getQuote(userId, type, Number(amountKes));
  }

  @Post('buy')
  @ApiOperation({ summary: 'Buy Bitcoin with M-Pesa (STK Push)' })
  buyBtc(@CurrentUser('id') userId: string, @Body() dto: BuyBtcDto) {
    return this.tradingService.initiateBuyBtc(userId, dto.amountKes, dto.phone);
  }

  @Post('sell')
  @ApiOperation({ summary: 'Sell Bitcoin and receive M-Pesa payout' })
  sellBtc(@CurrentUser('id') userId: string, @Body() dto: SellBtcDto) {
    return this.tradingService.initiateSellBtc(userId, dto.amountSats, dto.phone);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get transaction history' })
  getHistory(
    @CurrentUser('id') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.tradingService.getTransactionHistory(userId, Number(page), Number(limit));
  }

  @Get('transactions/:id')
  @ApiOperation({ summary: 'Get a specific transaction' })
  getTransaction(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.tradingService.getTransactionById(userId, id);
  }
}
