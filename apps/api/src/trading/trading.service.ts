import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../prisma/prisma.service';
import { MpesaService } from '../mpesa/mpesa.service';
import { firstValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { Decimal } from '@prisma/client/runtime/library';

const FEES_BY_TIER: Record<string, number> = {
  TIER_1: 0.025,
  TIER_2: 0.02,
  TIER_3: 0.015,
};

const SPREAD = 0.01;
const MIN_KES = 500;
const MAX_KES_TIER1 = 30000;
const MAX_KES_TIER2 = 500000;
const MAX_KES_TIER3 = 5000000;
const SATS_PER_BTC = 100000000;

@Injectable()
export class TradingService {
  private readonly logger = new Logger(TradingService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private http: HttpService,
    private mpesa: MpesaService,
  ) {}

  async getExchangeRate() {
    try {
      const [binanceRes, fxRes] = await Promise.all([
        firstValueFrom(
          this.http.get('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT'),
        ),
        firstValueFrom(
          this.http.get('https://open.er-api.com/v6/latest/USD'),
        ),
      ]);

      const btcUsd = parseFloat(binanceRes.data.price);
      const usdKes = fxRes.data.rates?.KES || 129.5;
      const btcKes = btcUsd * usdKes;
      const buyRateKes = btcKes * (1 + SPREAD);
      const sellRateKes = btcKes * (1 - SPREAD);

      await this.prisma.exchangeRate.create({
        data: {
          btcUsd: new Decimal(btcUsd.toFixed(2)),
          usdKes: new Decimal(usdKes.toFixed(4)),
          btcKes: new Decimal(btcKes.toFixed(2)),
          buyRateKes: new Decimal(buyRateKes.toFixed(2)),
          sellRateKes: new Decimal(sellRateKes.toFixed(2)),
          source: 'binance',
        },
      });

      return { btcUsd, usdKes, btcKes, buyRateKes, sellRateKes, updatedAt: new Date() };
    } catch (err) {
      this.logger.error('Failed to fetch exchange rate', err.message);
      const last = await this.prisma.exchangeRate.findFirst({ orderBy: { createdAt: 'desc' } });
      if (!last) throw new BadRequestException('Exchange rate unavailable');
      return {
        btcUsd: parseFloat(last.btcUsd.toString()),
        usdKes: parseFloat(last.usdKes.toString()),
        btcKes: parseFloat(last.btcKes.toString()),
        buyRateKes: parseFloat(last.buyRateKes.toString()),
        sellRateKes: parseFloat(last.sellRateKes.toString()),
        updatedAt: last.createdAt,
        cached: true,
      };
    }
  }

  async getQuote(userId: string, type: 'BUY_BTC' | 'SELL_BTC', amountKes: number) {
    const user = await this.getUserWithKyc(userId);
    const tier = user.kyc?.tier || 'TIER_1';
    const feePercent = FEES_BY_TIER[tier];
    const dailyLimit = this.getDailyLimit(tier);

    if (amountKes < MIN_KES) {
      throw new BadRequestException(`Minimum transaction is KES ${MIN_KES}`);
    }
    if (amountKes > dailyLimit) {
      throw new BadRequestException(`Maximum transaction for your account tier is KES ${dailyLimit}`);
    }

    const rate = await this.getExchangeRate();
    const btcPriceKes = type === 'BUY_BTC' ? rate.buyRateKes : rate.sellRateKes;
    const feeKes = amountKes * feePercent;
    const spreadKes = amountKes * SPREAD;

    let netAmountKes: number;
    let amountSats: number;

    if (type === 'BUY_BTC') {
      netAmountKes = amountKes - feeKes;
      amountSats = Math.floor((netAmountKes / btcPriceKes) * SATS_PER_BTC);
    } else {
      amountSats = Math.floor((amountKes / btcPriceKes) * SATS_PER_BTC);
      netAmountKes = amountKes - feeKes;
    }

    return {
      type,
      amountKes,
      feeKes: parseFloat(feeKes.toFixed(2)),
      feePercent: feePercent * 100,
      spreadKes: parseFloat(spreadKes.toFixed(2)),
      netAmountKes: parseFloat(netAmountKes.toFixed(2)),
      amountSats,
      btcPriceKes: parseFloat(btcPriceKes.toFixed(2)),
      expiresIn: 300,
      tier,
    };
  }

  async initiateBuyBtc(userId: string, amountKes: number, phone: string) {
    const quote = await this.getQuote(userId, 'BUY_BTC', amountKes);
    const reference = `LB-${uuidv4().slice(0, 8).toUpperCase()}`;

    const transaction = await this.prisma.transaction.create({
      data: {
        userId,
        type: 'BUY_BTC',
        status: 'PENDING',
        amountKes: new Decimal(amountKes),
        amountSats: BigInt(quote.amountSats),
        btcPriceKes: new Decimal(quote.btcPriceKes),
        feeKes: new Decimal(quote.feeKes),
        feePercent: new Decimal(quote.feePercent / 100),
        spreadKes: new Decimal(quote.spreadKes),
        netAmountKes: new Decimal(quote.netAmountKes),
        reference,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    const stk = await this.mpesa.initiateSTKPush(
      phone,
      amountKes,
      transaction.id,
      `Buy Bitcoin - ${reference}`,
    );

    await this.prisma.transaction.update({
      where: { id: transaction.id },
      data: { mpesaRef: stk.checkoutRequestId },
    });

    return {
      transactionId: transaction.id,
      reference,
      amountKes,
      amountSats: quote.amountSats,
      feeKes: quote.feeKes,
      btcPriceKes: quote.btcPriceKes,
      checkoutRequestId: stk.checkoutRequestId,
      message: 'Check your phone for the M-Pesa payment prompt',
    };
  }

  async initiateSellBtc(userId: string, amountSats: number, phone: string) {
    const wallet = await this.prisma.bitcoinWallet.findUnique({ where: { userId } });
    if (!wallet || wallet.balanceSats < BigInt(amountSats)) {
      throw new BadRequestException('Insufficient Bitcoin balance');
    }

    const rate = await this.getExchangeRate();
    const tier = (await this.getUserWithKyc(userId))?.kyc?.tier || 'TIER_1';
    const feePercent = FEES_BY_TIER[tier];
    const grossKes = (amountSats / SATS_PER_BTC) * rate.sellRateKes;
    const feeKes = grossKes * feePercent;
    const netKes = grossKes - feeKes;
    const reference = `LS-${uuidv4().slice(0, 8).toUpperCase()}`;

    if (grossKes < MIN_KES) throw new BadRequestException(`Minimum transaction is KES ${MIN_KES}`);

    const transaction = await this.prisma.$transaction(async (tx) => {
      await tx.bitcoinWallet.update({
        where: { userId },
        data: { balanceSats: { decrement: BigInt(amountSats) } },
      });

      return tx.transaction.create({
        data: {
          userId,
          type: 'SELL_BTC',
          status: 'PROCESSING',
          amountKes: new Decimal(grossKes.toFixed(2)),
          amountSats: BigInt(amountSats),
          btcPriceKes: new Decimal(rate.sellRateKes.toFixed(2)),
          feeKes: new Decimal(feeKes.toFixed(2)),
          feePercent: new Decimal(feePercent),
          spreadKes: new Decimal((grossKes * SPREAD).toFixed(2)),
          netAmountKes: new Decimal(netKes.toFixed(2)),
          reference,
        },
      });
    });

    const b2c = await this.mpesa.initiateB2C(
      phone,
      netKes,
      transaction.id,
      `LipaBit BTC sale ${reference}`,
    );

    return {
      transactionId: transaction.id,
      reference,
      amountSats,
      netAmountKes: parseFloat(netKes.toFixed(2)),
      feeKes: parseFloat(feeKes.toFixed(2)),
      message: 'M-Pesa payment initiated. You will receive funds shortly.',
    };
  }

  async getTransactionHistory(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { mpesaTransaction: { select: { status: true, mpesaReceiptNumber: true } } },
      }),
      this.prisma.transaction.count({ where: { userId } }),
    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async getTransactionById(userId: string, transactionId: string) {
    const tx = await this.prisma.transaction.findFirst({
      where: { id: transactionId, userId },
      include: { mpesaTransaction: true },
    });
    if (!tx) throw new NotFoundException('Transaction not found');
    return tx;
  }

  private async getUserWithKyc(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { kyc: { select: { tier: true, status: true } } },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private getDailyLimit(tier: string): number {
    const limits: Record<string, number> = {
      TIER_1: MAX_KES_TIER1,
      TIER_2: MAX_KES_TIER2,
      TIER_3: MAX_KES_TIER3,
    };
    return limits[tier] || MAX_KES_TIER1;
  }
}
