'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { tradingApi, type TransactionStatus } from '@/lib/api';

const STATUSES = [
  { key: 'PENDING', label: 'Pending Payment', icon: '🕐' },
  { key: 'AWAITING_CRYPTO', label: 'Awaiting Deposit', icon: '📥' },
  { key: 'PROCESSING', label: 'Blockchain Confirmation', icon: '⛓' },
  { key: 'COMPLETED', label: 'Completed', icon: '✅' },
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'text-yellow-400',
  AWAITING_CRYPTO: 'text-blue-400',
  PROCESSING: 'text-orange-400',
  COMPLETED: 'text-green-400',
  FAILED: 'text-red-400',
  CANCELLED: 'text-zinc-400',
  EXPIRED: 'text-zinc-400',
};

function formatKES(n: string | number) {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(
    typeof n === 'string' ? parseFloat(n) : n,
  );
}

function formatDate(s: string) {
  return new Date(s).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' });
}

function getTypeLabel(type: string) {
  const map: Record<string, string> = {
    BUY_BTC: 'Buy Bitcoin',
    SELL_BTC: 'Sell Bitcoin',
    BUY_ETH: 'Buy Ethereum',
    SELL_ETH: 'Sell Ethereum',
  };
  return map[type] || type;
}

function getStepIndex(status: string, type: string) {
  const isBuy = type.startsWith('BUY');
  if (isBuy) {
    const steps = ['PENDING', 'PROCESSING', 'COMPLETED'];
    return steps.indexOf(status);
  } else {
    const steps = ['AWAITING_CRYPTO', 'PROCESSING', 'COMPLETED'];
    return steps.indexOf(status);
  }
}

export default function TrackPage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = use(params);
  const [tx, setTx] = useState<TransactionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const fetchTx = async () => {
    try {
      const data = await tradingApi.track(ref);
      setTx(data);
      setError('');
    } catch (err: any) {
      setError(err.response?.status === 404 ? 'Transaction not found.' : 'Failed to load transaction.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTx();
    const interval = setInterval(fetchTx, 10000);
    return () => clearInterval(interval);
  }, [ref]);

  const copyAddress = async (addr: string) => {
    await navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isSell = tx?.type.startsWith('SELL');
  const coin = tx?.coin || 'BTC';

  const progressSteps = isSell
    ? ['AWAITING_CRYPTO', 'PROCESSING', 'COMPLETED']
    : ['PENDING', 'PROCESSING', 'COMPLETED'];

  const currentStepIdx = tx ? progressSteps.indexOf(tx.status) : -1;

  const stepLabels: Record<string, string> = {
    PENDING: 'Awaiting M-Pesa',
    AWAITING_CRYPTO: 'Awaiting deposit',
    PROCESSING: 'On blockchain',
    COMPLETED: 'Completed',
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 py-8">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/" className="text-zinc-500 hover:text-white text-sm transition-colors">
            ← Home
          </Link>
          <h1 className="text-lg font-bold">Order Status</h1>
        </div>

        {loading && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
            <div className="text-zinc-500 text-sm animate-pulse">Loading…</div>
          </div>
        )}

        {error && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
            <div className="text-red-400 text-sm mb-4">{error}</div>
            <Link href="/track" className="text-sm text-orange-400 hover:text-orange-300">
              Search another order →
            </Link>
          </div>
        )}

        {tx && (
          <div className="space-y-4">
            {/* Status card */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xs text-zinc-500 mb-1">{getTypeLabel(tx.type)}</div>
                  <div className="font-mono text-orange-400 text-sm">{tx.reference}</div>
                </div>
                <div className={`text-sm font-semibold ${STATUS_COLORS[tx.status] || 'text-zinc-300'}`}>
                  {tx.status.replace(/_/g, ' ')}
                </div>
              </div>

              {/* Progress bar */}
              <div className="relative mt-4 mb-2">
                <div className="flex justify-between mb-2">
                  {progressSteps.map((s, i) => (
                    <div key={s} className="flex flex-col items-center gap-1 flex-1">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors ${
                        i <= currentStepIdx
                          ? 'bg-orange-500 text-white'
                          : tx.status === 'FAILED' || tx.status === 'EXPIRED'
                          ? 'bg-red-900 text-red-400'
                          : 'bg-zinc-700 text-zinc-500'
                      }`}>
                        {i < currentStepIdx || tx.status === 'COMPLETED' ? '✓' : i + 1}
                      </div>
                      <div className="text-xs text-zinc-500 text-center hidden sm:block">
                        {stepLabels[s]}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="absolute top-3 left-3 right-3 h-0.5 bg-zinc-700 -z-10">
                  <div
                    className="h-full bg-orange-500 transition-all"
                    style={{ width: `${Math.max(0, (currentStepIdx / (progressSteps.length - 1)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Transaction details */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-sm font-semibold mb-4">Transaction Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Type</span>
                  <span>{getTypeLabel(tx.type)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">KES Amount</span>
                  <span>{formatKES(tx.amountKes)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Fee</span>
                  <span>{formatKES(tx.feeKes)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Net Amount</span>
                  <span className="text-green-400">{formatKES(tx.netAmountKes)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Created</span>
                  <span className="text-xs">{formatDate(tx.createdAt)}</span>
                </div>
                {tx.completedAt && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Completed</span>
                    <span className="text-xs">{formatDate(tx.completedAt)}</span>
                  </div>
                )}
                {tx.cryptoTxid && (
                  <div className="flex justify-between text-sm gap-4">
                    <span className="text-zinc-400 flex-shrink-0">Txid</span>
                    <span className="font-mono text-xs text-orange-400 break-all text-right">{tx.cryptoTxid}</span>
                  </div>
                )}
                {tx.mpesaTransaction?.mpesaReceiptNumber && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">M-Pesa Receipt</span>
                    <span className="font-mono text-xs">{tx.mpesaTransaction.mpesaReceiptNumber}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Sell: Show deposit address if still waiting */}
            {isSell && tx.depositAddress && tx.status === 'AWAITING_CRYPTO' && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <h3 className="text-sm font-semibold mb-4">Send {coin} to this address</h3>
                <div className="flex justify-center mb-4">
                  <div className="bg-white p-3 rounded-xl">
                    <QRCodeSVG value={tx.depositAddress} size={160} />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 bg-zinc-800 rounded-xl p-3">
                  <span className="text-xs font-mono text-orange-400 break-all">{tx.depositAddress}</span>
                  <button
                    onClick={() => copyAddress(tx.depositAddress!)}
                    className="flex-shrink-0 text-xs bg-zinc-700 hover:bg-zinc-600 text-white px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {copied ? '✓' : 'Copy'}
                  </button>
                </div>
              </div>
            )}

            {/* Failure */}
            {(tx.status === 'FAILED' || tx.status === 'EXPIRED') && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5">
                <div className="text-red-400 font-semibold mb-1">
                  {tx.status === 'EXPIRED' ? 'Order Expired' : 'Transaction Failed'}
                </div>
                {tx.failureReason && (
                  <div className="text-sm text-zinc-400">{tx.failureReason}</div>
                )}
                <Link
                  href="/"
                  className="inline-block mt-3 text-sm text-orange-400 hover:text-orange-300 transition-colors"
                >
                  Start a new order →
                </Link>
              </div>
            )}

            {/* Live update indicator */}
            {tx.status !== 'COMPLETED' && tx.status !== 'FAILED' && tx.status !== 'EXPIRED' && (
              <div className="flex items-center justify-center gap-2 text-xs text-zinc-600 py-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                Auto-refreshing every 10 seconds
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
