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
import { BitcoinService } from '../bitcoin/bitcoin.service';
import { EthereumService } from '../ethereum/ethereum.service';
import { firstValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { Decimal } from '@prisma/client/runtime/library';

const GUEST_FEE = 0.025;
const FEES_BY_TIER: Record<string, number> = {
  TIER_1: 0.025,
  TIER_2: 0.02,
  TIER_3: 0.015,
};
const SPREAD = 0.01;
const MIN_KES = 100;
const SATS_PER_BTC = 100_000_000;
const RATE_CACHE_TTL_MS = 30_000;

@Injectable()
export class TradingService {
  private readonly logger = new Logger(TradingService.name);
  private rateCache: { data: any; expiresAt: number } | null = null;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private http: HttpService,
    private mpesa: MpesaService,
    private bitcoin: BitcoinService,
    private ethereum: EthereumService,
  ) {}

  async getExchangeRate() {
    if (this.rateCache && Date.now() < this.rateCache.expiresAt) {
      return this.rateCache.data;
    }
    try {
      const [btcRes, ethRes, fxRes] = await Promise.all([
        firstValueFrom(
          this.http.get('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT'),
        ),
        firstValueFrom(
          this.http.get('https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT'),
        ),
        firstValueFrom(
          this.http.get('https://open.er-api.com/v6/latest/USD'),
        ),
      ]);

      const btcUsd = parseFloat(btcRes.data.price);
      const ethUsd = parseFloat(ethRes.data.price);
      const usdKes = fxRes.data.rates?.KES || 129.5;

      const btcKes = btcUsd * usdKes;
      const ethKes = ethUsd * usdKes;

      const result = {
        BTC: {
          usd: btcUsd,
          kes: btcKes,
          buyRateKes: btcKes * (1 + SPREAD),
          sellRateKes: btcKes * (1 - SPREAD),
        },
        ETH: {
          usd: ethUsd,
          kes: ethKes,
          buyRateKes: ethKes * (1 + SPREAD),
          sellRateKes: ethKes * (1 - SPREAD),
        },
        usdKes,
        updatedAt: new Date(),
      };

      await this.prisma.exchangeRate.create({
        data: {
          btcUsd: new Decimal(btcUsd.toFixed(2)),
          ethUsd: new Decimal(ethUsd.toFixed(2)),
          usdKes: new Decimal(usdKes.toFixed(4)),
          btcKes: new Decimal(btcKes.toFixed(2)),
          ethKes: new Decimal(ethKes.toFixed(2)),
          buyRateKes: new Decimal(result.BTC.buyRateKes.toFixed(2)),
          sellRateKes: new Decimal(result.BTC.sellRateKes.toFixed(2)),
          ethBuyRateKes: new Decimal(result.ETH.buyRateKes.toFixed(2)),
          ethSellRateKes: new Decimal(result.ETH.sellRateKes.toFixed(2)),
          source: 'binance',
        },
      });

      this.rateCache = { data: result, expiresAt: Date.now() + RATE_CACHE_TTL_MS };
      return result;
    } catch (err) {
      this.logger.error('Failed to fetch exchange rate', err.message);
      const last = await this.prisma.exchangeRate.findFirst({ orderBy: { createdAt: 'desc' } });
      if (!last) throw new BadRequestException('Exchange rate unavailable');
      return {
        BTC: {
          usd: parseFloat(last.btcUsd.toString()),
          kes: parseFloat(last.btcKes.toString()),
          buyRateKes: parseFloat(last.buyRateKes.toString()),
          sellRateKes: parseFloat(last.sellRateKes.toString()),
        },
        ETH: {
          usd: last.ethUsd ? parseFloat(last.ethUsd.toString()) : 0,
          kes: last.ethKes ? parseFloat(last.ethKes.toString()) : 0,
          buyRateKes: last.ethBuyRateKes ? parseFloat(last.ethBuyRateKes.toString()) : 0,
          sellRateKes: last.ethSellRateKes ? parseFloat(last.ethSellRateKes.toString()) : 0,
        },
        usdKes: parseFloat(last.usdKes.toString()),
        updatedAt: last.createdAt,
        cached: true,
      };
    }
  }

  async getQuote(coin: 'BTC' | 'ETH', type: 'BUY' | 'SELL', amountKes: number, userId?: string) {
    if (amountKes < MIN_KES) {
      throw new BadRequestException(`Minimum transaction is KES ${MIN_KES}`);
    }

    let feePercent = GUEST_FEE;
    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { kyc: { select: { tier: true } } },
      });
      feePercent = FEES_BY_TIER[user?.kyc?.tier || 'TIER_1'];
    }

    const rates = await this.getExchangeRate();
    const coinRate = rates[coin];
    const priceKes = type === 'BUY' ? coinRate.buyRateKes : coinRate.sellRateKes;
    const feeKes = amountKes * feePercent;
    const spreadKes = amountKes * SPREAD;

    let netAmountKes: number;
    let cryptoAmount: number;

    if (type === 'BUY') {
      netAmountKes = amountKes - feeKes;
      cryptoAmount = netAmountKes / priceKes;
    } else {
      cryptoAmount = amountKes / priceKes;
      netAmountKes = amountKes - feeKes;
    }

    const amountSats = coin === 'BTC' ? Math.floor(cryptoAmount * SATS_PER_BTC) : undefined;
    const amountEth = coin === 'ETH' ? cryptoAmount : undefined;
    const amountWei = coin === 'ETH' ? this.ethereum.ethToWei(cryptoAmount).toString() : undefined;

    return {
      coin,
      type,
      amountKes,
      feeKes: parseFloat(feeKes.toFixed(2)),
      feePercent: feePercent * 100,
      spreadKes: parseFloat(spreadKes.toFixed(2)),
      netAmountKes: parseFloat(netAmountKes.toFixed(2)),
      cryptoPriceKes: parseFloat(priceKes.toFixed(2)),
      ...(coin === 'BTC' ? { amountSats } : {}),
      ...(coin === 'ETH' ? { amountEth: parseFloat(cryptoAmount.toFixed(8)), amountWei } : {}),
      expiresIn: 60,
    };
  }

  async initiateBuy(
    coin: 'BTC' | 'ETH',
    amountKes: number,
    cryptoAddress: string,
    phone: string,
    userId?: string,
  ) {
    const quote = await this.getQuote(coin, 'BUY', amountKes, userId);
    const reference = `LB-${uuidv4().slice(0, 8).toUpperCase()}`;

    const transaction = await this.prisma.transaction.create({
      data: {
        userId: userId || null,
        coin,
        type: coin === 'BTC' ? 'BUY_BTC' : 'BUY_ETH',
        status: 'PENDING',
        amountKes: new Decimal(amountKes),
        amountSats: coin === 'BTC' ? BigInt(quote.amountSats!) : BigInt(0),
        amountWei: coin === 'ETH' ? BigInt(quote.amountWei!) : null,
        cryptoPriceKes: new Decimal(quote.cryptoPriceKes),
        feeKes: new Decimal(quote.feeKes),
        feePercent: new Decimal(quote.feePercent / 100),
        spreadKes: new Decimal(quote.spreadKes),
        netAmountKes: new Decimal(quote.netAmountKes),
        reference,
        cryptoAddress,
        guestPhone: userId ? null : phone,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    const stk = await this.mpesa.initiateSTKPush(
      phone,
      amountKes,
      transaction.id,
      `Buy ${coin} - ${reference}`,
    );

    await this.prisma.transaction.update({
      where: { id: transaction.id },
      data: { mpesaRef: stk.checkoutRequestId },
    });

    return {
      transactionId: transaction.id,
      reference,
      amountKes,
      coin,
      ...(coin === 'BTC' ? { amountSats: quote.amountSats } : { amountEth: quote.amountEth }),
      feeKes: quote.feeKes,
      cryptoPriceKes: quote.cryptoPriceKes,
      checkoutRequestId: stk.checkoutRequestId,
      message: 'Check your phone for the M-Pesa payment prompt',
    };
  }

  async initiateSell(
    coin: 'BTC' | 'ETH',
    amountKes: number,
    phone: string,
    userId?: string,
  ) {
    const quote = await this.getQuote(coin, 'SELL', amountKes, userId);
    const reference = `LS-${uuidv4().slice(0, 8).toUpperCase()}`;

    let depositAddress: string;
    if (coin === 'BTC') {
      depositAddress = await this.bitcoin.generateTransactionDepositAddress(reference);
    } else {
      depositAddress = await this.ethereum.generateTransactionDepositAddress(reference);
    }

    const transaction = await this.prisma.transaction.create({
      data: {
        userId: userId || null,
        coin,
        type: coin === 'BTC' ? 'SELL_BTC' : 'SELL_ETH',
        status: 'AWAITING_CRYPTO',
        amountKes: new Decimal(amountKes),
        amountSats: coin === 'BTC' ? BigInt(quote.amountSats!) : BigInt(0),
        amountWei: coin === 'ETH' ? BigInt(quote.amountWei!) : null,
        cryptoPriceKes: new Decimal(quote.cryptoPriceKes),
        feeKes: new Decimal(quote.feeKes),
        feePercent: new Decimal(quote.feePercent / 100),
        spreadKes: new Decimal(quote.spreadKes),
        netAmountKes: new Decimal(quote.netAmountKes),
        reference,
        depositAddress,
        guestPhone: userId ? null : phone,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        metadata: { payoutPhone: phone },
      },
    });

    return {
      transactionId: transaction.id,
      reference,
      coin,
      depositAddress,
      amountKes,
      ...(coin === 'BTC' ? { amountSats: quote.amountSats } : { amountEth: quote.amountEth }),
      netAmountKes: quote.netAmountKes,
      feeKes: quote.feeKes,
      cryptoPriceKes: quote.cryptoPriceKes,
      expiresAt: transaction.expiresAt,
      message: `Send ${coin} to the deposit address to proceed`,
    };
  }

  async getTransactionByReference(reference: string) {
    const tx = await this.prisma.transaction.findUnique({
      where: { reference },
      include: { mpesaTransaction: { select: { status: true, mpesaReceiptNumber: true, completedAt: true } } },
    });
    if (!tx) throw new NotFoundException('Transaction not found');
    return this.sanitizeForPublic(tx);
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

  private sanitizeForPublic(tx: any) {
    const { guestPhone, guestEmail, userId, ...safe } = tx;
    if (safe.cryptoAddress) {
      safe.cryptoAddress = this.maskAddress(safe.cryptoAddress);
    }
    return safe;
  }

  private maskAddress(address: string): string {
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  }
}
