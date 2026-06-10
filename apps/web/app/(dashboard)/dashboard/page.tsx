'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  Bitcoin,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  ShieldAlert,
  Wallet,
  BarChart3,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { api } from '@/lib/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Rate {
  btcKes: number;
  buyRateKes: number;
  sellRateKes: number;
  btcUsd?: number;
  change24h?: number;
  updatedAt?: string;
}

interface Wallet {
  balanceSats: string | number;
  address?: string;
}

interface KycStatus {
  status: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | null;
}

interface Profile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  kyc?: KycStatus;
  wallet?: Wallet;
}

interface Transaction {
  id: string;
  type: 'BUY_BTC' | 'SELL_BTC' | 'DEPOSIT' | 'WITHDRAWAL';
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  amountKes?: number;
  amountSats?: number;
  feeKes?: number;
  reference?: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatKes(n: number): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(n);
}

function formatSats(sats: number): string {
  if (sats >= 1_000_000) return `${(sats / 1_000_000).toFixed(2)}M sats`;
  if (sats >= 1_000) return `${(sats / 1_000).toFixed(2)}K sats`;
  return `${sats.toLocaleString()} sats`;
}

function formatBtc(sats: number): string {
  return (sats / 1e8).toFixed(8);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ---------------------------------------------------------------------------
// Skeleton component
// ---------------------------------------------------------------------------

function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-lg animate-pulse ${className}`}
      style={{ background: 'linear-gradient(90deg, #1C1F26 25%, #22262F 50%, #1C1F26 75%)', backgroundSize: '200% 100%' }}
    />
  );
}

// ---------------------------------------------------------------------------
// Live dot indicator
// ---------------------------------------------------------------------------

function LiveDot() {
  return (
    <span className="relative flex h-2 w-2">
      <span
        className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
        style={{ backgroundColor: '#0ECB81' }}
      />
      <span
        className="relative inline-flex rounded-full h-2 w-2"
        style={{ backgroundColor: '#0ECB81' }}
      />
    </span>
  );
}

// ---------------------------------------------------------------------------
// Transaction status badge
// ---------------------------------------------------------------------------

function TxStatusBadge({ status }: { status: Transaction['status'] }) {
  const map = {
    COMPLETED: { color: '#0ECB81', bg: 'rgba(14,203,129,0.12)', icon: CheckCircle2, label: 'Completed' },
    PENDING:   { color: '#F0B90B', bg: 'rgba(240,185,11,0.12)', icon: Clock,         label: 'Pending'   },
    FAILED:    { color: '#F6465D', bg: 'rgba(246,70,93,0.12)',  icon: XCircle,       label: 'Failed'    },
    CANCELLED: { color: '#848E9C', bg: 'rgba(132,142,156,0.12)', icon: AlertCircle,  label: 'Cancelled' },
  };
  const cfg = map[status] ?? map.CANCELLED;
  const Icon = cfg.icon;
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
      style={{ color: cfg.color, backgroundColor: cfg.bg }}
    >
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main dashboard
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const [rate, setRate]           = useState<Rate | null>(null);
  const [profile, setProfile]     = useState<Profile | null>(null);
  const [transactions, setTxs]    = useState<Transaction[]>([]);
  const [loadingRate, setLR]      = useState(true);
  const [loadingProfile, setLP]   = useState(true);
  const [loadingTxs, setLT]       = useState(true);
  const [prevBtcKes, setPrevBtc]  = useState<number | null>(null);
  const [priceFlash, setPriceFlash] = useState<'up' | 'down' | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch rate (with flash animation on price change)
  const fetchRate = useCallback(async () => {
    try {
      const { data } = await api.get<Rate>('/trading/rate');
      setRate((prev) => {
        if (prev && data.btcKes !== prev.btcKes) {
          setPriceFlash(data.btcKes > prev.btcKes ? 'up' : 'down');
          setPrevBtc(prev.btcKes);
          setTimeout(() => setPriceFlash(null), 1200);
        }
        return data;
      });
    } catch {
      // silently keep stale data
    } finally {
      setLR(false);
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const { data } = await api.get<Profile>('/users/me');
      setProfile(data);
    } catch {
      // ignore auth errors — interceptor handles redirect
    } finally {
      setLP(false);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    try {
      const { data } = await api.get<{ transactions: Transaction[] } | Transaction[]>(
        '/trading/transactions?limit=5',
      );
      const list = Array.isArray(data) ? data : (data as any).transactions ?? (data as any).data ?? [];
      setTxs(list.slice(0, 5));
    } catch {
      setTxs([]);
    } finally {
      setLT(false);
    }
  }, []);

  useEffect(() => {
    fetchRate();
    fetchProfile();
    fetchTransactions();

    pollRef.current = setInterval(fetchRate, 15_000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchRate, fetchProfile, fetchTransactions]);

  // Derived values
  const balanceSats = profile?.wallet?.balanceSats
    ? parseInt(String(profile.wallet.balanceSats), 10)
    : 0;
  const balanceKes = rate ? (balanceSats / 1e8) * rate.btcKes : 0;
  const portfolioKes = balanceKes; // extend if multi-asset
  const change24h = rate?.change24h ?? 0;
  const kycApproved = profile?.kyc?.status === 'APPROVED';
  const kycSubmitted = profile?.kyc?.status === 'SUBMITTED';
  const isLoading = loadingRate && loadingProfile;

  return (
    <div className="space-y-6 pb-10">
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                               */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: '#EAECEF', letterSpacing: '-0.02em' }}
          >
            {loadingProfile ? (
              <Skeleton className="h-7 w-48" />
            ) : (
              <>Welcome back, {profile?.firstName ?? 'Trader'}</>
            )}
          </h1>
          <p className="mt-1 text-sm" style={{ color: '#848E9C' }}>
            Your Bitcoin dashboard — real-time rates updated every 15s
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs" style={{ color: '#848E9C' }}>
          <LiveDot />
          <span>Live</span>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* KYC Banner                                                           */}
      {/* ------------------------------------------------------------------ */}
      {!loadingProfile && profile && !kycApproved && (
        <div
          className="rounded-xl border p-4 flex items-start gap-3"
          style={{
            background: kycSubmitted
              ? 'rgba(240,185,11,0.08)'
              : 'rgba(246,70,93,0.08)',
            borderColor: kycSubmitted ? 'rgba(240,185,11,0.25)' : 'rgba(246,70,93,0.25)',
          }}
        >
          <ShieldAlert
            size={20}
            style={{ color: kycSubmitted ? '#F0B90B' : '#F6465D', flexShrink: 0, marginTop: 1 }}
          />
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-semibold"
              style={{ color: kycSubmitted ? '#F0B90B' : '#F6465D' }}
            >
              {kycSubmitted ? 'Verification under review' : 'Identity verification required'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#848E9C' }}>
              {kycSubmitted
                ? 'Your documents are being reviewed. This usually takes 1–2 business days.'
                : 'Verify your ID to unlock full transaction limits and all features.'}
            </p>
          </div>
          {!kycSubmitted && (
            <Link
              href="/profile"
              className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
              style={{
                background: 'rgba(246,70,93,0.15)',
                color: '#F6465D',
                border: '1px solid rgba(246,70,93,0.30)',
              }}
            >
              Verify now
            </Link>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Portfolio summary card (full width)                                 */}
      {/* ------------------------------------------------------------------ */}
      <div
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #1C1F26 0%, #181B22 100%)',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.50), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        {/* Decorative glow blob */}
        <div
          className="absolute -top-16 -right-16 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(247,147,26,0.12) 0%, transparent 70%)' }}
        />

        <div className="relative z-10 flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 size={15} style={{ color: '#848E9C' }} />
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: '#848E9C' }}>
                Total Portfolio Value
              </span>
            </div>
            {isLoading ? (
              <Skeleton className="h-10 w-48 mb-2" />
            ) : (
              <p
                className="text-4xl font-bold tabular-nums"
                style={{ color: '#EAECEF', letterSpacing: '-0.03em' }}
              >
                {formatKes(portfolioKes)}
              </p>
            )}
            <p className="text-sm mt-1" style={{ color: '#848E9C' }}>
              {isLoading ? (
                <Skeleton className="h-4 w-32" />
              ) : (
                <>
                  {formatSats(balanceSats)}&nbsp;&middot;&nbsp;
                  <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    {formatBtc(balanceSats)} BTC
                  </span>
                </>
              )}
            </p>
          </div>

          <div className="flex flex-col items-end gap-3">
            <div
              className="px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5"
              style={
                change24h >= 0
                  ? { background: 'rgba(14,203,129,0.12)', color: '#0ECB81' }
                  : { background: 'rgba(246,70,93,0.12)', color: '#F6465D' }
              }
            >
              {change24h >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}% (24h)
            </div>
            <div className="flex gap-2">
              <Link
                href="/buy"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: 'linear-gradient(135deg, #FF9A24 0%, #F7931A 50%, #E07800 100%)',
                  color: '#0B0E11',
                  boxShadow: '0 4px 20px rgba(247,147,26,0.40)',
                }}
              >
                <Zap size={14} />
                Buy BTC
              </Link>
              <Link
                href="/sell"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  color: '#EAECEF',
                  border: '1px solid rgba(255,255,255,0.10)',
                }}
              >
                Sell BTC
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Rate cards row: BTC Price | Buy Rate | Sell Rate                    */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* BTC Price card */}
        <div
          className="rounded-2xl p-5 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #1C1F26 0%, #181B22 100%)',
            border: '1px solid rgba(247,147,26,0.20)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          <div
            className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(247,147,26,0.15) 0%, transparent 70%)' }}
          />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: 'rgba(247,147,26,0.15)', color: '#F7931A' }}
                >
                  ₿
                </div>
                <span className="text-xs font-medium" style={{ color: '#848E9C' }}>
                  BTC / KES
                </span>
              </div>
              {!loadingRate && (
                <div
                  className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={
                    change24h >= 0
                      ? { background: 'rgba(14,203,129,0.12)', color: '#0ECB81' }
                      : { background: 'rgba(246,70,93,0.12)', color: '#F6465D' }
                  }
                >
                  {change24h >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
                </div>
              )}
            </div>

            {loadingRate ? (
              <>
                <Skeleton className="h-8 w-36 mb-1" />
                <Skeleton className="h-3 w-24" />
              </>
            ) : (
              <>
                <p
                  className="text-2xl font-bold tabular-nums transition-colors duration-500"
                  style={{
                    color: priceFlash === 'up'
                      ? '#0ECB81'
                      : priceFlash === 'down'
                      ? '#F6465D'
                      : '#EAECEF',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {formatKes(rate?.btcKes ?? 0)}
                </p>
                <p className="text-xs mt-1" style={{ color: '#848E9C' }}>
                  Mid-market · refreshes every 15s
                </p>
              </>
            )}
          </div>
        </div>

        {/* Buy Rate card */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: 'linear-gradient(135deg, #1C1F26 0%, #181B22 100%)',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(14,203,129,0.12)' }}
            >
              <ArrowDownLeft size={14} style={{ color: '#0ECB81' }} />
            </div>
            <span className="text-xs font-medium" style={{ color: '#848E9C' }}>Buy Rate</span>
          </div>

          {loadingRate ? (
            <>
              <Skeleton className="h-8 w-36 mb-1" />
              <Skeleton className="h-3 w-24" />
            </>
          ) : (
            <>
              <p
                className="text-2xl font-bold tabular-nums"
                style={{ color: '#0ECB81', letterSpacing: '-0.02em' }}
              >
                {formatKes(rate?.buyRateKes ?? 0)}
              </p>
              <p className="text-xs mt-1" style={{ color: '#848E9C' }}>Per Bitcoin · incl. spread</p>
            </>
          )}
        </div>

        {/* Sell Rate card */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: 'linear-gradient(135deg, #1C1F26 0%, #181B22 100%)',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(246,70,93,0.12)' }}
            >
              <ArrowUpRight size={14} style={{ color: '#F6465D' }} />
            </div>
            <span className="text-xs font-medium" style={{ color: '#848E9C' }}>Sell Rate</span>
          </div>

          {loadingRate ? (
            <>
              <Skeleton className="h-8 w-36 mb-1" />
              <Skeleton className="h-3 w-24" />
            </>
          ) : (
            <>
              <p
                className="text-2xl font-bold tabular-nums"
                style={{ color: '#F6465D', letterSpacing: '-0.02em' }}
              >
                {formatKes(rate?.sellRateKes ?? 0)}
              </p>
              <p className="text-xs mt-1" style={{ color: '#848E9C' }}>Per Bitcoin · incl. spread</p>
            </>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Second row: Bitcoin Balance card + Quick Actions                    */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bitcoin balance */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: 'linear-gradient(135deg, #1C1F26 0%, #181B22 100%)',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-base font-bold"
              style={{ background: 'rgba(247,147,26,0.15)', color: '#F7931A' }}
            >
              ₿
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: '#848E9C' }}>Bitcoin Balance</p>
              <p className="text-xs" style={{ color: '#5A6275' }}>Lightning wallet</p>
            </div>
            <div className="ml-auto">
              <Wallet size={16} style={{ color: '#5A6275' }} />
            </div>
          </div>

          {loadingProfile ? (
            <div className="space-y-2">
              <Skeleton className="h-9 w-44" />
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-28" />
            </div>
          ) : (
            <>
              <p
                className="text-3xl font-bold tabular-nums"
                style={{ color: '#EAECEF', letterSpacing: '-0.025em', fontFamily: 'JetBrains Mono, monospace' }}
              >
                {formatSats(balanceSats)}
              </p>
              <p
                className="text-sm mt-1 tabular-nums"
                style={{ color: '#848E9C', fontFamily: 'JetBrains Mono, monospace' }}
              >
                {formatBtc(balanceSats)} BTC
              </p>
              {rate && (
                <p className="text-sm mt-0.5" style={{ color: '#5A6275' }}>
                  ≈ {formatKes(balanceKes)}
                </p>
              )}
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div
          className="rounded-2xl p-6 flex flex-col"
          style={{
            background: 'linear-gradient(135deg, #1C1F26 0%, #181B22 100%)',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          <p className="text-xs font-medium uppercase tracking-wider mb-4" style={{ color: '#848E9C' }}>
            Quick Actions
          </p>

          <div className="flex flex-col gap-3 flex-1">
            <Link
              href="/buy"
              className="flex items-center justify-between px-5 py-3.5 rounded-xl font-semibold text-sm transition-all group"
              style={{
                background: 'linear-gradient(135deg, #FF9A24 0%, #F7931A 50%, #E07800 100%)',
                color: '#0B0E11',
                boxShadow: '0 4px 20px rgba(247,147,26,0.40)',
              }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.15)' }}
                >
                  <ArrowDownLeft size={15} />
                </div>
                Buy Bitcoin
              </div>
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>

            <Link
              href="/sell"
              className="flex items-center justify-between px-5 py-3.5 rounded-xl font-semibold text-sm transition-all group"
              style={{
                background: 'rgba(255,255,255,0.04)',
                color: '#EAECEF',
                border: '1px solid rgba(255,255,255,0.10)',
              }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(246,70,93,0.12)', color: '#F6465D' }}
                >
                  <ArrowUpRight size={15} />
                </div>
                Sell Bitcoin
              </div>
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" style={{ color: '#848E9C' }} />
            </Link>
          </div>

          {rate && !loadingRate && (
            <div
              className="mt-4 pt-4 flex items-center gap-2 text-xs"
              style={{ color: '#5A6275', borderTop: '1px solid rgba(255,255,255,0.06)' }}
            >
              <RefreshCw size={11} />
              Rate refreshed {rate.updatedAt ? timeAgo(rate.updatedAt) : 'recently'}
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Recent Transactions                                                  */}
      {/* ------------------------------------------------------------------ */}
      <div
        className="rounded-2xl"
        style={{
          background: 'linear-gradient(135deg, #1C1F26 0%, #181B22 100%)',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-2">
            <Clock size={15} style={{ color: '#848E9C' }} />
            <span className="font-semibold text-sm" style={{ color: '#EAECEF' }}>
              Recent Transactions
            </span>
          </div>
          <Link
            href="/transactions"
            className="text-xs font-medium flex items-center gap-1 transition-colors"
            style={{ color: '#F7931A' }}
          >
            View all
            <ArrowRight size={12} />
          </Link>
        </div>

        {/* Body */}
        <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          {loadingTxs ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <Skeleton className="w-9 h-9 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <div className="space-y-2 text-right">
                  <Skeleton className="h-3.5 w-24 ml-auto" />
                  <Skeleton className="h-5 w-20 ml-auto rounded-full" />
                </div>
              </div>
            ))
          ) : transactions.length === 0 ? (
            <div className="py-12 text-center">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ background: 'rgba(247,147,26,0.08)' }}
              >
                <Bitcoin size={22} style={{ color: '#F7931A' }} />
              </div>
              <p className="text-sm font-medium" style={{ color: '#EAECEF' }}>
                No transactions yet
              </p>
              <p className="text-xs mt-1" style={{ color: '#848E9C' }}>
                Buy or sell Bitcoin to get started
              </p>
              <Link
                href="/buy"
                className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: 'linear-gradient(135deg, #FF9A24 0%, #F7931A 50%, #E07800 100%)',
                  color: '#0B0E11',
                  boxShadow: '0 2px 12px rgba(247,147,26,0.35)',
                }}
              >
                <Zap size={12} />
                Buy your first Bitcoin
              </Link>
            </div>
          ) : (
            transactions.map((tx, idx) => {
              const isBuy = tx.type === 'BUY_BTC';
              const isSell = tx.type === 'SELL_BTC';
              const iconBg = isBuy
                ? 'rgba(14,203,129,0.12)'
                : isSell
                ? 'rgba(246,70,93,0.12)'
                : 'rgba(22,119,255,0.12)';
              const iconColor = isBuy ? '#0ECB81' : isSell ? '#F6465D' : '#4D9EFF';
              const label = isBuy ? 'Bought BTC' : isSell ? 'Sold BTC' : tx.type.replace('_', ' ');

              return (
                <div
                  key={tx.id}
                  className="flex items-center gap-4 px-6 py-4 transition-colors"
                  style={{ cursor: 'default' }}
                >
                  {/* Icon */}
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: iconBg }}
                  >
                    {isBuy ? (
                      <ArrowDownLeft size={16} style={{ color: iconColor }} />
                    ) : isSell ? (
                      <ArrowUpRight size={16} style={{ color: iconColor }} />
                    ) : (
                      <Bitcoin size={16} style={{ color: iconColor }} />
                    )}
                  </div>

                  {/* Label + time */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#EAECEF' }}>
                      {label}
                    </p>
                    <p className="text-xs mt-0.5 tabular-nums" style={{ color: '#5A6275' }}>
                      {timeAgo(tx.createdAt)}
                      {tx.reference && (
                        <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                          {' '}· {tx.reference}
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Amount + status */}
                  <div className="text-right flex-shrink-0">
                    {tx.amountKes != null && (
                      <p
                        className="text-sm font-semibold tabular-nums"
                        style={{ color: isBuy ? '#0ECB81' : isSell ? '#F6465D' : '#EAECEF' }}
                      >
                        {isBuy ? '+' : isSell ? '-' : ''}
                        {formatKes(tx.amountKes)}
                      </p>
                    )}
                    {tx.amountSats != null && (
                      <p
                        className="text-xs tabular-nums mt-0.5"
                        style={{ color: '#848E9C', fontFamily: 'JetBrains Mono, monospace' }}
                      >
                        {formatSats(tx.amountSats)}
                      </p>
                    )}
                    <div className="mt-1">
                      <TxStatusBadge status={tx.status} />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Footer note                                                          */}
      {/* ------------------------------------------------------------------ */}
      <p
        className="text-center text-xs"
        style={{ color: '#5A6275' }}
      >
        Rates shown are indicative and subject to change. Final rates confirmed at order execution.
      </p>
    </div>
  );
}
