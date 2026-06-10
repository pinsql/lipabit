import { registerAs } from '@nestjs/config';

export default registerAs('ethereum', () => ({
  network: process.env.ETHEREUM_NETWORK || 'mainnet',
  rpcUrl: process.env.ETHEREUM_RPC_URL || '',
  mnemonic: process.env.ETHEREUM_MNEMONIC || '',
  hdPath: process.env.ETHEREUM_HD_PATH || "m/44'/60'/0'/0",
  minConfirmations: parseInt(process.env.ETHEREUM_MIN_CONFIRMATIONS || '12', 10),
}));
