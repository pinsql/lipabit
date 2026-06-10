'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { tradingApi, type Coin, type RateData } from '@/lib/api';

const COINS: { id: Coin; name: string; symbol: string; icon: string }[] = [
  { id: 'BTC', name: 'Bitcoin', symbol: 'BTC', icon: '₿' },
  { id: 'ETH', name: 'Ethereum', symbol: 'ETH', icon: 'Ξ' },
];

function formatKES(n: number) {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(n);
}

function formatCrypto(n: number, coin: Coin) {
  if (coin === 'BTC') return `${n.toFixed(6)} BTC`;
  return `${n.toFixed(4)} ETH`;
}

export default function HomePage() {
  const router = useRouter();
  const [tab, setTab] = useState<'BUY' | 'SELL'>('BUY');
  const [coin, setCoin] = useState<Coin>('BTC');
  const [amount, setAmount] = useState('');
  const [rates, setRates] = useState<RateData | null>(null);
  const [quote, setQuote] = useState<{ crypto: number; fee: number; rate: number } | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);

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

  useEffect(() => {
    const val = parseFloat(amount);
    if (!val || val < 100 || !rates) {
      setQuote(null);
      return;
    }

    const debounce = setTimeout(async () => {
      setLoadingQuote(true);
      try {
        const q = await tradingApi.getQuote(coin, tab, val);
        const cryptoAmount = coin === 'BTC' ? (q.amountSats! / 1e8) : (q.amountEth ?? 0);
        setQuote({ crypto: cryptoAmount, fee: q.feeKes, rate: q.cryptoPriceKes });
      } catch {
        setQuote(null);
      } finally {
        setLoadingQuote(false);
      }
    }, 400);

    return () => clearTimeout(debounce);
  }, [amount, coin, tab, rates]);

  const handleContinue = () => {
    const val = parseFloat(amount);
    if (!val || val < 100) return;
    router.push(`/${tab.toLowerCase()}?coin=${coin}&amount=${val}`);
  };

  const currentRate = rates ? rates[coin] : null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-orange-500 font-bold text-xl">⚡</span>
          <span className="font-bold text-lg tracking-tight">LipaBit</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/track" className="text-sm text-zinc-400 hover:text-white transition-colors">
            Track Order
          </Link>
          <Link href="/login" className="text-sm text-zinc-400 hover:text-white transition-colors">
            Sign In
          </Link>
          <Link
            href="/register"
            className="text-sm bg-orange-500 hover:bg-orange-400 text-white px-4 py-1.5 rounded-full transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-6xl mx-auto px-6 pt-12 pb-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left — copy */}
          <div>
            <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-1.5 text-xs text-zinc-400 mb-6">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Live rates · No account required
            </div>
            <h1 className="text-5xl font-bold leading-tight mb-4">
              Buy & Sell Crypto<br />
              <span className="text-orange-500">with M-Pesa.</span>
            </h1>
            <p className="text-zinc-400 text-lg mb-8 leading-relaxed">
              The fastest way to convert between Bitcoin, Ethereum and KES.
              No registration. No waiting. Start in seconds.
            </p>

            {/* Live rates ticker */}
            {rates && (
              <div className="flex gap-6">
                {COINS.map((c) => (
                  <div key={c.id} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                    <div className="text-xs text-zinc-500 mb-1">{c.name}</div>
                    <div className="font-semibold text-sm">
                      {formatKES(rates[c.id].kes)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Trust indicators */}
            <div className="mt-10 flex items-center gap-6 text-xs text-zinc-500">
              <span>✓ Instant STK Push</span>
              <span>✓ No KYC for guests</span>
              <span>✓ 24/7 settlement</span>
            </div>
          </div>

          {/* Right — widget */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
            {/* Tab */}
            <div className="flex bg-zinc-800 rounded-xl p-1 mb-6">
              {(['BUY', 'SELL'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setQuote(null); }}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                    tab === t
                      ? 'bg-orange-500 text-white shadow'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {t === 'BUY' ? '💳 Buy Crypto' : '💸 Sell Crypto'}
                </button>
              ))}
            </div>

            {/* Coin selector */}
            <div className="mb-4">
              <label className="text-xs text-zinc-500 mb-2 block">Select Coin</label>
              <div className="flex gap-2">
                {COINS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => { setCoin(c.id); setQuote(null); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      coin === c.id
                        ? 'border-orange-500 bg-orange-500/10 text-white'
                        : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'
                    }`}
                  >
                    <span className={coin === 'BTC' && c.id === 'BTC' ? 'text-orange-400' : 'text-blue-400'}>
                      {c.icon}
                    </span>
                    {c.symbol}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount input */}
            <div className="mb-4">
              <label className="text-xs text-zinc-500 mb-2 block">
                {tab === 'BUY' ? 'You pay (KES)' : 'You sell worth (KES)'}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-medium">
                  KES
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  min={100}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-14 pr-4 py-3.5 text-white text-xl font-semibold focus:outline-none focus:border-orange-500 transition-colors placeholder-zinc-600"
                />
              </div>
              {currentRate && (
                <div className="text-xs text-zinc-500 mt-1.5">
                  1 {coin} = {formatKES(tab === 'BUY' ? currentRate.buyRateKes : currentRate.sellRateKes)}
                </div>
              )}
            </div>

            {/* Quote preview */}
            {(loadingQuote || quote) && (
              <div className="bg-zinc-800 rounded-xl p-4 mb-4 space-y-2">
                {loadingQuote ? (
                  <div className="text-xs text-zinc-500 text-center py-2">Calculating...</div>
                ) : quote ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">You {tab === 'BUY' ? 'receive' : 'spend'}</span>
                      <span className="font-semibold">{formatCrypto(quote.crypto, coin)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Platform fee</span>
                      <span className="text-zinc-300">{formatKES(quote.fee)}</span>
                    </div>
                    <div className="border-t border-zinc-700 pt-2 flex justify-between text-sm">
                      <span className="text-zinc-400">
                        {tab === 'BUY' ? 'You pay' : 'You receive'}
                      </span>
                      <span className="font-bold text-orange-400">
                        {tab === 'BUY'
                          ? formatKES(parseFloat(amount))
                          : formatKES(parseFloat(amount) - quote.fee)}
                      </span>
                    </div>
                  </>
                ) : null}
              </div>
            )}

            {/* CTA */}
            <button
              onClick={handleContinue}
              disabled={!amount || parseFloat(amount) < 100}
              className="w-full py-4 bg-orange-500 hover:bg-orange-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-bold rounded-xl transition-all text-base"
            >
              {tab === 'BUY' ? 'Buy with M-Pesa →' : 'Sell for M-Pesa →'}
            </button>

            <p className="text-center text-xs text-zinc-600 mt-3">
              No registration required · Rates refresh every 30s
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-24">
          <h2 className="text-2xl font-bold text-center mb-12">Done in under 2 minutes</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {(tab === 'BUY'
              ? [
                  { step: '01', title: 'Enter amount & wallet', desc: 'Pick BTC or ETH, enter KES amount and your crypto wallet address.' },
                  { step: '02', title: 'Pay with M-Pesa', desc: 'Approve the STK push on your phone. Payment processes instantly.' },
                  { step: '03', title: 'Receive crypto', desc: 'Crypto is sent to your wallet within minutes of payment confirmation.' },
                ]
              : [
                  { step: '01', title: 'Enter amount & M-Pesa', desc: 'Pick BTC or ETH, enter the KES value you want and your M-Pesa number.' },
                  { step: '02', title: 'Send crypto to address', desc: 'We generate a unique deposit address. Send your crypto there.' },
                  { step: '03', title: 'Receive M-Pesa payout', desc: 'Once your crypto is confirmed on-chain, M-Pesa payout is sent immediately.' },
                ]
            ).map(({ step, title, desc }) => (
              <div key={step} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <div className="text-orange-500 text-4xl font-black mb-3 opacity-40">{step}</div>
                <div className="font-semibold mb-2">{title}</div>
                <div className="text-sm text-zinc-400 leading-relaxed">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-8 px-6 text-center text-xs text-zinc-600">
        <div className="flex justify-center gap-6 mb-2">
          <Link href="/track" className="hover:text-zinc-400 transition-colors">Track Order</Link>
          <Link href="/login" className="hover:text-zinc-400 transition-colors">Sign In</Link>
          <Link href="/register" className="hover:text-zinc-400 transition-colors">Create Account</Link>
        </div>
        LipaBit Technologies Ltd © {new Date().getFullYear()} · Nairobi, Kenya
      </footer>
    </div>
  );
}
