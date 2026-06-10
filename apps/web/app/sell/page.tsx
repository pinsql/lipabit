'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { tradingApi, type Coin, type QuoteData } from '@/lib/api';

type Step = 'form' | 'deposit' | 'confirming' | 'success';

function formatKES(n: number) {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(n);
}

const STATUS_LABELS: Record<string, string> = {
  AWAITING_CRYPTO: 'Waiting for deposit',
  PROCESSING: 'Confirming on blockchain',
  COMPLETED: 'Complete',
  FAILED: 'Failed',
};

function SellPageInner() {
  const params = useSearchParams();

  const [step, setStep] = useState<Step>('form');
  const [coin, setCoin] = useState<Coin>((params.get('coin') as Coin) || 'BTC');
  const [amountKes, setAmountKes] = useState(params.get('amount') || '');
  const [phone, setPhone] = useState('');
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [txStatus, setTxStatus] = useState<string>('AWAITING_CRYPTO');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const fetchQuote = useCallback(async () => {
    const val = parseFloat(amountKes);
    if (!val || val < 100) { setQuote(null); return; }
    setLoadingQuote(true);
    try {
      const q = await tradingApi.getQuote(coin, 'SELL', val);
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

  const formatCryptoAmount = (q: QuoteData) => {
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
      const data = await tradingApi.sell({
        coin,
        amountKes: parseFloat(amountKes),
        phone: formattedPhone,
      });
      setResult(data);
      setStep('deposit');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if ((step !== 'deposit' && step !== 'confirming') || !result?.reference) return;
    const interval = setInterval(async () => {
      try {
        const tx = await tradingApi.track(result.reference);
        setTxStatus(tx.status);

        if (tx.status === 'PROCESSING') {
          setStep('confirming');
        } else if (tx.status === 'COMPLETED') {
          setStep('success');
          clearInterval(interval);
        } else if (tx.status === 'FAILED' || tx.status === 'EXPIRED') {
          setError('Transaction expired or failed. Please start a new order.');
          setStep('form');
          clearInterval(interval);
        }
      } catch {}
    }, 8000);
    return () => clearInterval(interval);
  }, [step, result]);

  const copyAddress = async () => {
    if (!result?.depositAddress) return;
    await navigator.clipboard.writeText(result.depositAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (step === 'deposit' || step === 'confirming') {
    const depositAddress = result?.depositAddress || '';
    const cryptoToSend = quote ? formatCryptoAmount(quote) : '-';

    return (
      <div className="min-h-screen bg-[#0a0a0a] px-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <h1 className="text-lg font-bold">Send {coin}</h1>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            {/* Status indicator */}
            <div className="flex items-center gap-2 mb-6">
              <span className={`w-2 h-2 rounded-full animate-pulse ${step === 'confirming' ? 'bg-yellow-500' : 'bg-green-500'}`} />
              <span className="text-sm text-zinc-400">
                {step === 'confirming' ? 'Deposit detected — awaiting blockchain confirmation' : 'Waiting for your deposit'}
              </span>
            </div>

            {/* QR Code */}
            <div className="flex justify-center mb-6">
              <div className="bg-white p-4 rounded-xl">
                <QRCodeSVG value={depositAddress} size={180} />
              </div>
            </div>

            {/* Deposit address */}
            <div className="bg-zinc-800 rounded-xl p-4 mb-4">
              <div className="text-xs text-zinc-500 mb-1">Send exactly to this address</div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono text-orange-400 break-all leading-relaxed">
                  {depositAddress}
                </span>
                <button
                  onClick={copyAddress}
                  className="flex-shrink-0 text-xs bg-zinc-700 hover:bg-zinc-600 text-white px-3 py-1.5 rounded-lg transition-colors"
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Send exactly</span>
                <span className="font-semibold text-orange-400">{cryptoToSend}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">You receive</span>
                <span>{formatKES(result?.netAmountKes || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Order reference</span>
                <span className="font-mono text-xs">{result?.reference}</span>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-xs text-yellow-400 mb-4">
              ⚠️ Send only {coin} to this address. Sending other assets will result in permanent loss.
            </div>

            <Link
              href={`/track/${result?.reference}`}
              className="block text-center text-xs text-orange-400 hover:text-orange-300 transition-colors"
            >
              Track this order →
            </Link>
          </div>
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
          <h2 className="text-xl font-bold mb-2">M-Pesa Payout Sent!</h2>
          <p className="text-zinc-400 text-sm mb-6">
            Your KES has been sent to your M-Pesa number.
          </p>
          <div className="bg-zinc-800 rounded-xl p-4 text-left mb-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Reference</span>
              <span className="font-mono text-orange-400">{result?.reference}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Amount sent</span>
              <span>{formatKES(result?.netAmountKes || 0)}</span>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Link
              href={`/track/${result?.reference}`}
              className="w-full py-3 bg-orange-500 hover:bg-orange-400 text-white font-semibold rounded-xl text-sm transition-colors"
            >
              View Receipt →
            </Link>
            <button
              onClick={() => { setStep('form'); setResult(null); setPhone(''); setAmountKes(''); }}
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
          <h1 className="text-lg font-bold">Sell Crypto</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Coin selector */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <label className="text-xs text-zinc-500 mb-3 block">Select Coin to Sell</label>
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
            <label className="text-xs text-zinc-500 mb-2 block">KES value to receive</label>
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
                  <span className="text-zinc-500">You send</span>
                  <span className="text-orange-400">{formatCryptoAmount(quote)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Platform fee (2.5%)</span>
                  <span className="text-zinc-300">- {formatKES(quote.feeKes)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold pt-1 border-t border-zinc-700">
                  <span>You receive</span>
                  <span className="text-green-400">{formatKES(quote.netAmountKes)}</span>
                </div>
              </div>
            )}
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
              KES payout will be sent to this M-Pesa number.
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !quote || !phone}
            className="w-full py-4 bg-orange-500 hover:bg-orange-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-bold rounded-xl transition-all text-base"
          >
            {submitting ? 'Creating order…' : `Get deposit address →`}
          </button>

          <p className="text-center text-xs text-zinc-600">
            A unique {coin} deposit address will be generated for your order
          </p>
        </form>
      </div>
    </div>
  );
}

export default function SellPage() {
  return (
    <Suspense>
      <SellPageInner />
    </Suspense>
  );
}
