import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) throw new Error('No refresh token');
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        localStorage.setItem('access_token', data.accessToken);
        localStorage.setItem('refresh_token', data.refreshToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export type Coin = 'BTC' | 'ETH';

export interface RateData {
  BTC: { usd: number; kes: number; buyRateKes: number; sellRateKes: number };
  ETH: { usd: number; kes: number; buyRateKes: number; sellRateKes: number };
  usdKes: number;
  updatedAt: string;
  cached?: boolean;
}

export interface QuoteData {
  coin: Coin;
  type: 'BUY' | 'SELL';
  amountKes: number;
  feeKes: number;
  feePercent: number;
  spreadKes: number;
  netAmountKes: number;
  cryptoPriceKes: number;
  amountSats?: number;
  amountEth?: number;
  amountWei?: string;
  expiresIn: number;
}

export interface TransactionStatus {
  id: string;
  reference: string;
  coin: string;
  type: string;
  status: string;
  amountKes: string;
  amountSats: string;
  amountWei?: string;
  cryptoPriceKes: string;
  feeKes: string;
  netAmountKes: string;
  cryptoAddress?: string;
  depositAddress?: string;
  cryptoTxid?: string;
  expiresAt?: string;
  completedAt?: string;
  failureReason?: string;
  createdAt: string;
  mpesaTransaction?: { status: string; mpesaReceiptNumber?: string; completedAt?: string };
}

export const tradingApi = {
  getRate: () => api.get<RateData>('/trading/rate').then((r) => r.data),

  getQuote: (coin: Coin, type: 'BUY' | 'SELL', amountKes: number) =>
    api.get<QuoteData>('/trading/quote', { params: { coin, type, amountKes } }).then((r) => r.data),

  buy: (payload: { coin: Coin; amountKes: number; cryptoAddress: string; phone: string; email?: string }) =>
    api.post('/trading/buy', payload).then((r) => r.data),

  sell: (payload: { coin: Coin; amountKes: number; phone: string }) =>
    api.post('/trading/sell', payload).then((r) => r.data),

  track: (reference: string) =>
    api.get<TransactionStatus>(`/trading/track/${reference}`).then((r) => r.data),
};
