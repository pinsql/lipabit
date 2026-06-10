'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpDown, Loader2, Timer, Bitcoin, Coins, TrendingUp, TrendingDown } from 'lucide-react';
import { tradingApi, type Coin, type RateData } from '@/lib/api';

const TIMER_SECS = 60;

function formatKES(n: number) {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(n);
}

function formatCrypto(n: number, coin: Coin) {
  if (coin === 'BTC') return `${n.toFixed(6)} BTC`;
  return `${n.toFixed(4)} ETH`;
}

export default function ExchangeWidget() {
  const router = useRouter();
  const [tab, setTab] = useState<'BUY' | 'SELL'>('BUY');
  const [coin, setCoin] = useState<Coin>('BTC');
  const [amount, setAmount] = useState('');
  const [rates, setRates] = useState<RateData | null>(null);
  const [quote, setQuote] = useState<{ crypto: number; fee: number; rate: number } | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [timer, setTimer] = useState(TIMER_SECS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchRate = useCallback(async () => {
    try {
      const data = await tradingApi.getRate();
      setRates(data);
    } catch {}
  }, []);

  useEffect(() => {
    fetchRate();
    const interval = setInterval(fetchRate, 30000);
    return () => clearInterval(interval);
  }, [fetchRate]);

  // Quote timer
  useEffect(() => {
    if (!quote) { setTimer(TIMER_SECS); return; }
    timerRef.current = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) { setQuote(null); return TIMER_SECS; }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [quote]);

  // Quote fetch
  useEffect(() => {
    const val = parseFloat(amount);
    if (!val || val < 100 || !rates) { setQuote(null); return; }
    const debounce = setTimeout(async () => {
      setLoadingQuote(true);
      try {
        const q = await tradingApi.getQuote(coin, tab, val);
        const cryptoAmount = coin === 'BTC' ? (q.amountSats! / 1e8) : (q.amountEth ?? 0);
        setQuote({ crypto: cryptoAmount, fee: q.feeKes, rate: q.cryptoPriceKes });
        setTimer(TIMER_SECS);
      } catch {
        setQuote(null);
      } finally {
        setLoadingQuote(false);
      }
    }, 500);
    return () => clearTimeout(debounce);
  }, [amount, coin, tab, rates]);

  const handleContinue = () => {
    const val = parseFloat(amount);
    if (!val || val < 100) return;
    router.push(`/${tab.toLowerCase()}?coin=${coin}&amount=${val}`);
  };

  const currentRate = rates ? rates[coin] : null;
  const amountNum = parseFloat(amount) || 0;
  const isValid = amountNum >= 100;
  const timerPct = (timer / TIMER_SECS) * 100;

  return (
    <div className="relative">
      {/* Glow behind card */}
      <div className="absolute -inset-1 bg-gradient-to-br from-orange-500/20 via-transparent to-indigo-500/10 rounded-3xl blur-xl" />

      <div className="relative bg-[#131720] border border-[#2B2F36] rounded-2xl overflow-hidden shadow-2xl">
        {/* Top gradient bar */}
        <div className="h-px bg-gradient-to-r from-transparent via-orange-500/80 to-transparent" />

        <div className="p-6">
          {/* Live price header */}
          <div className="flex gap-3 mb-5">
            {rates && (
              <>
                <PricePill coin="BTC" price={rates.BTC.kes} usd={rates.BTC.usd} active={coin === 'BTC'} onClick={() => { setCoin('BTC'); setQuote(null); }} />
                <PricePill coin="ETH" price={rates.ETH.kes} usd={rates.ETH.usd} active={coin === 'ETH'} onClick={() => { setCoin('ETH'); setQuote(null); }} />
              </>
            )}
            {!rates && (
              <div className="flex gap-3 w-full">
                <div className="flex-1 h-14 bg-[#1C1F26] rounded-xl animate-pulse" />
                <div className="flex-1 h-14 bg-[#1C1F26] rounded-xl animate-pulse" />
              </div>
            )}
          </div>

          {/* Buy / Sell tabs */}
          <div className="flex bg-[#0B0E11] rounded-xl p-1 mb-5">
            {(['BUY', 'SELL'] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setQuote(null); }}
                className="relative flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors z-10"
              >
                <AnimatePresence initial={false}>
                  {tab === t && (
                    <motion.span
                      layoutId="tab-bg"
                      className={`absolute inset-0 rounded-lg ${t === 'BUY' ? 'bg-orange-500' : 'bg-[#0ECB81]'}`}
                      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                    />
                  )}
                </AnimatePresence>
                <span className={`relative ${tab === t ? 'text-white' : 'text-[#848E9C]'}`}>
                  {t === 'BUY' ? '↑ Buy Crypto' : '↓ Sell Crypto'}
                </span>
              </button>
            ))}
          </div>

          {/* Amount input */}
          <div className="mb-4">
            <label className="text-xs font-medium text-[#848E9C] mb-2 block">
              {tab === 'BUY' ? 'You pay' : 'You sell worth'}
            </label>
            <div className="relative group">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/0 via-orange-500/0 to-orange-500/0 group-focus-within:from-orange-500/20 group-focus-within:via-orange-500/10 group-focus-within:to-orange-500/5 transition-all duration-300 rounded-xl pointer-events-none" />
              <div className="relative flex items-center bg-[#1C1F26] border border-[#2B2F36] group-focus-within:border-orange-500/60 rounded-xl transition-colors overflow-hidden">
                <span className="pl-4 pr-2 text-[#848E9C] text-sm font-semibold shrink-0">KES</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  min={100}
                  className="flex-1 bg-transparent pr-4 py-4 text-white text-2xl font-bold focus:outline-none placeholder-[#363B44] tabular-nums"
                />
                <div className="pr-4 text-xs text-[#848E9C] whitespace-nowrap">
                  {isValid && currentRate && (
                    <span className="text-[#0ECB81]">≈ {formatCrypto(amountNum / (tab === 'BUY' ? currentRate.buyRateKes : currentRate.sellRateKes), coin)}</span>
                  )}
                </div>
              </div>
            </div>
            {currentRate && (
              <div className="flex justify-between mt-1.5 text-xs text-[#848E9C]">
                <span>1 {coin} = {formatKES(tab === 'BUY' ? currentRate.buyRateKes : currentRate.sellRateKes)}</span>
                <span className="text-[#848E9C]">Min: KES 100</span>
              </div>
            )}
          </div>

          {/* Quote breakdown */}
          <AnimatePresence mode="wait">
            {loadingQuote && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4"
              >
                <div className="bg-[#1C1F26] border border-[#2B2F36] rounded-xl p-4 flex items-center justify-center gap-2 text-sm text-[#848E9C]">
                  <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                  Getting best rate…
                </div>
              </motion.div>
            )}
            {!loadingQuote && quote && (
              <motion.div
                key="quote"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-4"
              >
                <div className="bg-[#1C1F26] border border-[#2B2F36] rounded-xl overflow-hidden">
                  {/* Timer bar */}
                  <div className="h-0.5 bg-[#2B2F36]">
                    <motion.div
                      className="h-full bg-orange-500"
                      style={{ width: `${timerPct}%` }}
                      animate={{ width: `${timerPct}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <div className="p-4 space-y-2.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#848E9C]">You {tab === 'BUY' ? 'receive' : 'spend'}</span>
                      <span className="font-bold text-white">{formatCrypto(quote.crypto, coin)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#848E9C]">Platform fee (1%)</span>
                      <span className="text-[#848E9C]">{formatKES(quote.fee)}</span>
                    </div>
                    <div className="border-t border-[#2B2F36] pt-2.5 flex justify-between text-sm">
                      <span className="text-[#848E9C]">{tab === 'BUY' ? 'Total charge' : 'You receive'}</span>
                      <span className="font-bold text-orange-400">
                        {tab === 'BUY' ? formatKES(amountNum) : formatKES(amountNum - quote.fee)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[#5A6275]">
                      <Timer className="w-3 h-3" />
                      Quote expires in {timer}s
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTA */}
          <motion.button
            onClick={handleContinue}
            disabled={!isValid}
            whileHover={isValid ? { scale: 1.01 } : {}}
            whileTap={isValid ? { scale: 0.99 } : {}}
            className={`w-full py-4 rounded-xl font-bold text-base transition-all relative overflow-hidden ${
              isValid
                ? tab === 'BUY'
                  ? 'bg-orange-500 hover:bg-orange-400 text-white shadow-lg shadow-orange-500/25'
                  : 'bg-[#0ECB81] hover:bg-[#0bba75] text-[#0B0E11] shadow-lg shadow-emerald-500/25'
                : 'bg-[#1C1F26] text-[#5A6275] cursor-not-allowed'
            }`}
          >
            {isValid && (
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_ease-in-out_infinite]" />
            )}
            {tab === 'BUY' ? 'Buy with M-Pesa →' : 'Sell for M-Pesa →'}
          </motion.button>

          <div className="mt-3 flex items-center justify-center gap-4 text-xs text-[#5A6275]">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0ECB81] animate-pulse inline-block" />
              No registration
            </span>
            <span>·</span>
            <span>Rates refresh every 30s</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PricePill({
  coin,
  price,
  usd,
  active,
  onClick,
}: {
  coin: string;
  price: number;
  usd: number;
  active: boolean;
  onClick: () => void;
}) {
  const isBTC = coin === 'BTC';
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all text-left ${
        active
          ? isBTC
            ? 'border-orange-500/60 bg-orange-500/10'
            : 'border-indigo-500/60 bg-indigo-500/10'
          : 'border-[#2B2F36] bg-[#1C1F26] hover:border-[#363B44]'
      }`}
    >
      <span className={`text-xl ${isBTC ? 'text-orange-400' : 'text-indigo-400'}`}>
        {isBTC ? '₿' : 'Ξ'}
      </span>
      <div className="min-w-0">
        <div className="text-xs text-[#848E9C] font-medium">{coin}</div>
        <div className="text-sm font-bold text-white tabular-nums truncate">
          {formatKES(price)}
        </div>
      </div>
    </button>
  );
}
