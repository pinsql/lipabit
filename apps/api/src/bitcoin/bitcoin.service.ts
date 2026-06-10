import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../prisma/prisma.service';
import { firstValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class BitcoinService {
  private readonly logger = new Logger(BitcoinService.name);

  constructor(
    private config: ConfigService,
    private http: HttpService,
    private prisma: PrismaService,
  ) {}

  private get rpcUrl() {
    return this.config.get('bitcoin.rpcUrl') || 'http://localhost:8332';
  }

  private async rpcCall(method: string, params: any[] = []) {
    const { data } = await firstValueFrom(
      this.http.post(this.rpcUrl, { jsonrpc: '1.0', method, params }, {
        auth: {
          username: this.config.get('bitcoin.rpcUser') || '',
          password: this.config.get('bitcoin.rpcPassword') || '',
        },
      }),
    );
    if (data.error) throw new Error(`Bitcoin RPC error: ${JSON.stringify(data.error)}`);
    return data.result;
  }

  async generateDepositAddress(userId: string): Promise<string> {
    const existing = await this.prisma.bitcoinWallet.findUnique({ where: { userId } });
    if (existing) return existing.address;

    let address: string;

    try {
      address = await this.rpcCall('getnewaddress', [userId, 'bech32']);
    } catch {
      address = this.generateDemoAddress();
      this.logger.warn(`Bitcoin node unavailable — generated placeholder address for user ${userId}`);
    }

    await this.prisma.bitcoinWallet.create({
      data: { userId, address },
    });

    return address;
  }

  async generateTransactionDepositAddress(transactionRef: string): Promise<string> {
    try {
      return await this.rpcCall('getnewaddress', [transactionRef, 'bech32']);
    } catch {
      const address = this.generateDemoAddress();
      this.logger.warn(`Bitcoin node unavailable — placeholder deposit address for ${transactionRef}`);
      return address;
    }
  }

  async checkDeposits() {
    try {
      const wallets = await this.prisma.bitcoinWallet.findMany({
        select: { userId: true, address: true, id: true },
      });

      for (const wallet of wallets) {
        try {
          const transactions = await this.rpcCall('listreceivedbyaddress', [
            this.config.get('bitcoin.minConfirmations') || 3,
            false,
            true,
            wallet.address,
          ]);

          for (const tx of transactions || []) {
            for (const txEntry of tx.txids || []) {
              const existing = await this.prisma.bitcoinTransaction.findUnique({
                where: { txid: txEntry },
              });
              if (existing) continue;

              const txDetail = await this.rpcCall('gettransaction', [txEntry]);
              const amountSats = Math.round(Math.abs(txDetail.amount) * 1e8);

              await this.prisma.$transaction([
                this.prisma.bitcoinTransaction.create({
                  data: {
                    walletId: wallet.id,
                    txid: txEntry,
                    amountSats: BigInt(amountSats),
                    confirmations: txDetail.confirmations,
                    confirmed: txDetail.confirmations >= (this.config.get('bitcoin.minConfirmations') || 3),
                    confirmedAt: txDetail.confirmations >= 3 ? new Date() : null,
                    direction: 'IN',
                  },
                }),
                this.prisma.bitcoinWallet.update({
                  where: { id: wallet.id },
                  data: {
                    balanceSats: { increment: BigInt(amountSats) },
                    totalReceivedSats: { increment: BigInt(amountSats) },
                  },
                }),
              ]);
            }
          }
        } catch (err) {
          this.logger.error(`Failed to check deposits for address ${wallet.address}`, err.message);
        }
      }
    } catch (err) {
      this.logger.error('Deposit check cycle failed', err.message);
    }
  }

  async checkSellDeposits() {
    try {
      const pendingSells = await this.prisma.transaction.findMany({
        where: {
          coin: 'BTC',
          type: 'SELL_BTC',
          status: 'AWAITING_CRYPTO',
          depositAddress: { not: null },
        },
      });

      if (pendingSells.length === 0) return;

      const minConf = this.config.get<number>('bitcoin.minConfirmations') ?? 3;

      for (const tx of pendingSells) {
        try {
          const received = await this.rpcCall('listreceivedbyaddress', [
            0,
            false,
            true,
            tx.depositAddress,
          ]);

          for (const entry of received || []) {
            if (entry.amount <= 0) continue;
            const amountSats = Math.round(entry.amount * 1e8);
            const confirmed = entry.confirmations >= minConf;

            if (confirmed) {
              await this.prisma.transaction.update({
                where: { id: tx.id },
                data: {
                  status: 'PROCESSING',
                  cryptoTxid: entry.txids?.[0] || null,
                  metadata: {
                    ...(tx.metadata as object || {}),
                    receivedSats: amountSats,
                    confirmations: entry.confirmations,
                  },
                },
              });
              this.logger.log(`BTC sell deposit confirmed for ${tx.reference}: ${amountSats} sats`);
            }
          }
        } catch (err) {
          this.logger.error(`Failed to check sell deposit for ${tx.reference}`, err.message);
        }
      }
    } catch (err) {
      this.logger.error('Sell deposit check cycle failed', err.message);
    }
  }

  async getWalletBalance(userId: string) {
    const wallet = await this.prisma.bitcoinWallet.findUnique({ where: { userId } });
    return wallet ? { balanceSats: wallet.balanceSats.toString(), address: wallet.address } : null;
  }

  private generateDemoAddress(): string {
    const chars = 'abcdef0123456789';
    const hash = Array.from({ length: 40 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `bc1q${hash}`;
  }
}
