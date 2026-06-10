import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../prisma/prisma.service';
import { firstValueFrom } from 'rxjs';
import { ethers } from 'ethers';

const WEI_PER_ETH = BigInt('1000000000000000000');

@Injectable()
export class EthereumService {
  private readonly logger = new Logger(EthereumService.name);
  private hdNode: ethers.HDNodeWallet | null = null;
  private provider: ethers.JsonRpcProvider | null = null;
  private addressIndex = 0;

  constructor(
    private config: ConfigService,
    private http: HttpService,
    private prisma: PrismaService,
  ) {
    this.init();
  }

  private init() {
    const mnemonic = this.config.get<string>('ethereum.mnemonic');
    const rpcUrl = this.config.get<string>('ethereum.rpcUrl');

    if (mnemonic) {
      try {
        this.hdNode = ethers.HDNodeWallet.fromMnemonic(
          ethers.Mnemonic.fromPhrase(mnemonic),
          this.config.get<string>('ethereum.hdPath'),
        );
      } catch {
        this.logger.warn('Invalid Ethereum mnemonic — ETH deposit generation disabled');
      }
    }

    if (rpcUrl) {
      try {
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
      } catch {
        this.logger.warn('Invalid Ethereum RPC URL — ETH monitoring disabled');
      }
    }
  }

  generateDepositAddress(index: number): string {
    if (!this.hdNode) {
      return this.generateFallbackAddress(index);
    }
    const child = this.hdNode.deriveChild(index);
    return child.address;
  }

  async generateTransactionDepositAddress(transactionRef: string): Promise<string> {
    const count = await this.prisma.transaction.count({
      where: { coin: 'ETH', depositAddress: { not: null } },
    });
    const index = 1000 + count;
    return this.generateDepositAddress(index);
  }

  async checkDeposits() {
    if (!this.provider) return;

    try {
      const pending = await this.prisma.transaction.findMany({
        where: {
          coin: 'ETH',
          type: { in: ['SELL_ETH'] },
          status: 'AWAITING_CRYPTO',
          depositAddress: { not: null },
        },
      });

      if (pending.length === 0) return;

      const minConf = this.config.get<number>('ethereum.minConfirmations') ?? 12;
      const currentBlock = await this.provider.getBlockNumber();

      for (const tx of pending) {
        try {
          const balance = await this.provider.getBalance(tx.depositAddress!);
          if (balance === 0n) continue;

          const expectedWei = tx.amountWei ?? BigInt(0);
          if (balance < expectedWei) continue;

          await this.prisma.transaction.update({
            where: { id: tx.id },
            data: {
              status: 'PROCESSING',
              cryptoTxid: `eth-detected-${tx.depositAddress}`,
              metadata: {
                ...(tx.metadata as object || {}),
                detectedWei: balance.toString(),
                detectedBlock: currentBlock,
                minConf,
              },
            },
          });

          this.logger.log(`ETH deposit detected for ${tx.reference}: ${balance} wei`);
        } catch (err) {
          this.logger.error(`Failed to check ETH deposit for ${tx.reference}`, err.message);
        }
      }
    } catch (err) {
      this.logger.error('ETH deposit check cycle failed', err.message);
    }
  }

  async sendEth(toAddress: string, amountWei: bigint): Promise<string> {
    if (!this.provider || !this.hdNode) {
      throw new Error('Ethereum service not configured');
    }
    const wallet = new ethers.Wallet(this.hdNode.privateKey, this.provider);
    const tx = await wallet.sendTransaction({ to: toAddress, value: amountWei });
    return tx.hash;
  }

  weiToEth(wei: bigint): number {
    return Number(wei) / Number(WEI_PER_ETH);
  }

  ethToWei(eth: number): bigint {
    return BigInt(Math.floor(eth * Number(WEI_PER_ETH)));
  }

  private generateFallbackAddress(index: number): string {
    const wallet = ethers.Wallet.createRandom();
    return wallet.address;
  }
}
