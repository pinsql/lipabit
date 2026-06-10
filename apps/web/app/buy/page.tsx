'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { tradingApi, type Coin, type QuoteData } from '@/lib/api';

type Step = 'form' | 'paying' | 'success';

function formatKES(n: number) {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(n);
}

function BuyPageInner() {
  const router = useRouter();
  const params = useSearchParams();

  const [step, setStep] = useState<Step>('form');
  const [coin, setCoin] = useState<Coin>((params.get('coin') as Coin) || 'BTC');
  const [amountKes, setAmountKes] = useState(params.get('amount') || '');
  const [cryptoAddress, setCryptoAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [pollCount, setPollCount] = useState(0);

  const fetchQuote = useCallback(async () => {
    const val = parseFloat(amountKes);
    if (!val || val < 100) { setQuote(null); return; }
    setLoadingQuote(true);
    try {
      const q = await tradingApi.getQuote(coin, 'BUY', val);
      setQuote(q);
    } catch {
      setQuote(null);
    } finally {
      setLoadingQuote(false);
    }
  }, [coin, amountKes]);

  useEffect(() => {
    const t = setTimeout(fetchQuote, 400);
    return () => clearTimeout(t);
  }, [fetchQuote]);

  const formatCrypto = (q: QuoteData) => {
    if (coin === 'BTC' && q.amountSats) return `${(q.amountSats / 1e8).toFixed(6)} BTC`;
    if (coin === 'ETH' && q.amountEth) return `${q.amountEth.toFixed(4)} ETH`;
    return '-';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quote) return;

    const formattedPhone = phone.startsWith('+') ? phone : `+254${phone.replace(/^0/, '')}`;
    setError('');
    setSubmitting(true);
    try {
      const data = await tradingApi.buy({
        coin,
        amountKes: parseFloat(amountKes),
        cryptoAddress,
        phone: formattedPhone,
      });
      setResult(data);
      setStep('paying');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to initiate payment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (step !== 'paying' || !result?.reference) return;
    const interval = setInterval(async () => {
      try {
        const tx = await tradingApi.track(result.reference);
        setPollCount((c) => c + 1);
        if (tx.status === 'PROCESSING' || tx.status === 'COMPLETED') {
          setStep('success');
          clearInterval(interval);
        } else if (tx.status === 'FAILED' || tx.status === 'CANCELLED' || tx.status === 'EXPIRED') {
          setError('Payment failed or expired. Please try again.');
          setStep('form');
          clearInterval(interval);
        }
      } catch {}
    }, 5000);
    return () => clearInterval(interval);
  }, [step, result]);

  if (step === 'paying') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl animate-pulse">📲</span>
          </div>
          <h2 className="text-xl font-bold mb-2">Check your phone</h2>
          <p className="text-zinc-400 text-sm mb-6">
            An M-Pesa STK Push has been sent to your phone. Enter your PIN to complete the payment.
          </p>

          <div className="bg-zinc-800 rounded-xl p-4 text-left mb-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Reference</span>
              <span className="font-mono text-orange-400">{result?.reference}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Amount</span>
              <span>{formatKES(parseFloat(amountKes))}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">You receive</span>
              <span>{quote ? formatCrypto(quote) : '-'}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-zinc-500 mb-6">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            Waiting for payment confirmation…
          </div>

          <Link
            href={`/track/${result?.reference}`}
            className="text-xs text-orange-400 hover:text-orange-300 transition-colors"
          >
            Track this order →
          </Link>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✅</span>
          </div>
          <h2 className="text-xl font-bold mb-2">Payment Received!</h2>
          <p className="text-zinc-400 text-sm mb-6">
            Your {coin} is being sent to your wallet. This usually takes 1–5 minutes.
          </p>
          <div className="bg-zinc-800 rounded-xl p-4 text-left mb-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Reference</span>
              <span className="font-mono text-orange-400">{result?.reference}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Sending</span>
              <span>{quote ? formatCrypto(quote) : '-'}</span>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Link
              href={`/track/${result?.reference}`}
              className="w-full py-3 bg-orange-500 hover:bg-orange-400 text-white font-semibold rounded-xl text-sm transition-colors"
            >
              Track Transaction →
            </Link>
            <button
              onClick={() => { setStep('form'); setResult(null); setCryptoAddress(''); setPhone(''); setAmountKes(''); }}
              className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Start a new order
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 py-8">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/" className="text-zinc-500 hover:text-white transition-colors text-sm">
            ← Back
          </Link>
          <h1 className="text-lg font-bold">Buy Crypto</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Coin selector */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <label className="text-xs text-zinc-500 mb-3 block">Select Coin</label>
            <div className="flex gap-2">
              {(['BTC', 'ETH'] as Coin[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { setCoin(c); setQuote(null); }}
                  className={`flex-1 py-3 rounded-xl border text-sm font-semibold transition-all ${
                    coin === c
                      ? 'border-orange-500 bg-orange-500/10 text-white'
                      : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'
                  }`}
                >
                  {c === 'BTC' ? '₿ Bitcoin' : 'Ξ Ethereum'}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <label className="text-xs text-zinc-500 mb-2 block">Amount in KES</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">KES</span>
              <input
                type="number"
                value={amountKes}
                onChange={(e) => setAmountKes(e.target.value)}
                placeholder="0"
                min={100}
                required
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-14 pr-4 py-3 text-white text-xl font-semibold focus:outline-none focus:border-orange-500 transition-colors placeholder-zinc-600"
              />
            </div>

            {/* Quote breakdown */}
            {loadingQuote && (
              <div className="text-xs text-zinc-500 mt-3">Calculating…</div>
            )}
            {!loadingQuote && quote && (
              <div className="mt-3 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Rate</span>
                  <span className="text-zinc-300">{formatKES(quote.cryptoPriceKes)} / {coin}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Platform fee (2.5%)</span>
                  <span className="text-zinc-300">- {formatKES(quote.feeKes)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold pt-1 border-t border-zinc-700">
                  <span>You receive</span>
                  <span className="text-orange-400">{formatCrypto(quote)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Wallet address */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <label className="text-xs text-zinc-500 mb-2 block">
              Your {coin} Wallet Address
            </label>
            <input
              type="text"
              value={cryptoAddress}
              onChange={(e) => setCryptoAddress(e.target.value)}
              placeholder={coin === 'BTC' ? 'bc1q...' : '0x...'}
              required
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm font-mono focus:outline-none focus:border-orange-500 transition-colors placeholder-zinc-600"
            />
            <p className="text-xs text-zinc-600 mt-1.5">
              Double-check this address. {coin} sent to wrong address cannot be recovered.
            </p>
          </div>

          {/* M-Pesa number */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <label className="text-xs text-zinc-500 mb-2 block">M-Pesa Phone Number</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">+254</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="7XXXXXXXX"
                required
                maxLength={9}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-14 pr-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500 transition-colors placeholder-zinc-600"
              />
            </div>
            <p className="text-xs text-zinc-600 mt-1.5">
              The M-Pesa STK Push will be sent to this number.
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !quote || !cryptoAddress || !phone}
            className="w-full py-4 bg-orange-500 hover:bg-orange-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-bold rounded-xl transition-all text-base"
          >
            {submitting ? 'Sending STK Push…' : `Buy ${coin} with M-Pesa →`}
          </button>

          <p className="text-center text-xs text-zinc-600">
            By continuing you agree to our Terms of Service
          </p>
        </form>
      </div>
    </div>
  );
}

export default function BuyPage() {
  return (
    <Suspense>
      <BuyPageInner />
    </Suspense>
  );
}
