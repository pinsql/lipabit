import { registerAs } from '@nestjs/config';

export default registerAs('bitcoin', () => ({
  network: process.env.BITCOIN_NETWORK || 'testnet',
  rpcUrl: process.env.BITCOIN_RPC_URL,
  rpcUser: process.env.BITCOIN_RPC_USER,
  rpcPassword: process.env.BITCOIN_RPC_PASSWORD,
  walletName: process.env.BITCOIN_WALLET_NAME || 'lipabit',
  minConfirmations: parseInt(process.env.BITCOIN_MIN_CONFIRMATIONS || '3', 10),
  hotWalletThresholdSats: parseInt(process.env.HOT_WALLET_THRESHOLD_SATS || '10000000', 10),
  binanceApiKey: process.env.BINANCE_API_KEY,
  binanceApiSecret: process.env.BINANCE_API_SECRET,
}));
