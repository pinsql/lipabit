import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TradingService } from './trading.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  IsNumber,
  IsString,
  IsOptional,
  IsIn,
  Min,
  Max,
  Matches,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

const KE_PHONE = /^\+254[0-9]{9}$/;
const KE_PHONE_MSG = 'Must be a valid Kenyan number (+254XXXXXXXXX)';

class GuestBuyDto {
  @ApiProperty({ example: 'BTC' })
  @IsIn(['BTC', 'ETH'])
  coin: 'BTC' | 'ETH';

  @ApiProperty({ example: 5000 })
  @IsNumber() @Min(100) @Max(1000000) @Type(() => Number)
  amountKes: number;

  @ApiProperty({ example: 'bc1q...' })
  @IsString()
  cryptoAddress: string;

  @ApiProperty({ example: '+254712345678' })
  @IsString() @Matches(KE_PHONE, { message: KE_PHONE_MSG })
  phone: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsEmail()
  email?: string;
}

class GuestSellDto {
  @ApiProperty({ example: 'BTC' })
  @IsIn(['BTC', 'ETH'])
  coin: 'BTC' | 'ETH';

  @ApiProperty({ example: 5000, description: 'KES value to sell' })
  @IsNumber() @Min(100) @Max(1000000) @Type(() => Number)
  amountKes: number;

  @ApiProperty({ example: '+254712345678' })
  @IsString() @Matches(KE_PHONE, { message: KE_PHONE_MSG })
  phone: string;
}

class QuoteQueryDto {
  @ApiProperty({ example: 'BTC' })
  @IsIn(['BTC', 'ETH'])
  coin: 'BTC' | 'ETH';

  @ApiProperty({ example: 'BUY' })
  @IsIn(['BUY', 'SELL'])
  type: 'BUY' | 'SELL';

  @ApiProperty({ example: 5000 })
  @IsNumber() @Min(100) @Type(() => Number)
  amountKes: number;
}

@ApiTags('Trading')
@Controller({ path: 'trading', version: '1' })
export class TradingController {
  constructor(private readonly tradingService: TradingService) {}

  @Get('rate')
  @Throttle({ short: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Get current exchange rates (public)' })
  getRate() {
    return this.tradingService.getExchangeRate();
  }

  @Get('quote')
  @Throttle({ short: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Get price quote (public)' })
  getQuote(
    @Query('coin') coin: 'BTC' | 'ETH' = 'BTC',
    @Query('type') type: 'BUY' | 'SELL' = 'BUY',
    @Query('amountKes') amountKes: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id;
    return this.tradingService.getQuote(coin, type, Number(amountKes), userId);
  }

  @Post('buy')
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Buy crypto with M-Pesa STK Push (guest or authenticated)' })
  buy(@Body() dto: GuestBuyDto, @Request() req: any) {
    const userId = req.user?.id;
    return this.tradingService.initiateBuy(dto.coin, dto.amountKes, dto.cryptoAddress, dto.phone, userId);
  }

  @Post('sell')
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Sell crypto for M-Pesa payout (guest or authenticated)' })
  sell(@Body() dto: GuestSellDto, @Request() req: any) {
    const userId = req.user?.id;
    return this.tradingService.initiateSell(dto.coin, dto.amountKes, dto.phone, userId);
  }

  @Get('track/:reference')
  @Throttle({ short: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Track a transaction by reference (public)' })
  track(@Param('reference') reference: string) {
    return this.tradingService.getTransactionByReference(reference);
  }

  @Get('transactions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get transaction history (authenticated)' })
  getHistory(
    @CurrentUser('id') userId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const p = Math.max(1, parseInt(page) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit) || 20));
    return this.tradingService.getTransactionHistory(userId, p, l);
  }

  @Get('transactions/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific transaction (authenticated)' })
  getTransaction(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.tradingService.getTransactionById(userId, id);
  }
}
