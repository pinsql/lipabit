'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function DashboardPage() {
  const [rate, setRate] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/trading/rate').then((r) => setRate(r.data)),
      api.get('/users/me').then((r) => setProfile(r.data)),
    ]).finally(() => setLoading(false));
  }, []);

  const formatKes = (n: number) =>
    new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(n);

  const balanceSats = profile?.wallet?.balanceSats
    ? parseInt(profile.wallet.balanceSats)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back, {profile?.firstName || '...'}</p>
      </div>

      {/* Rate card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-bitcoin text-white rounded-2xl p-5">
          <p className="text-orange-100 text-sm mb-1">Live BTC Price</p>
          <p className="text-3xl font-bold">
            {rate ? formatKes(rate.btcKes) : '—'}
          </p>
          <p className="text-orange-200 text-xs mt-1">Mid-market rate</p>
        </div>
        <div className="bg-white border rounded-2xl p-5">
          <p className="text-gray-500 text-sm mb-1">Buy Rate</p>
          <p className="text-2xl font-bold text-gray-900">
            {rate ? formatKes(rate.buyRateKes) : '—'}
          </p>
          <p className="text-gray-400 text-xs mt-1">Per Bitcoin</p>
        </div>
        <div className="bg-white border rounded-2xl p-5">
          <p className="text-gray-500 text-sm mb-1">Sell Rate</p>
          <p className="text-2xl font-bold text-gray-900">
            {rate ? formatKes(rate.sellRateKes) : '—'}
          </p>
          <p className="text-gray-400 text-xs mt-1">Per Bitcoin</p>
        </div>
      </div>

      {/* Balance + actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border rounded-2xl p-6">
          <p className="text-gray-500 text-sm mb-2">Bitcoin Balance</p>
          <p className="text-3xl font-bold text-gray-900">{balanceSats.toLocaleString()}</p>
          <p className="text-gray-400 text-xs mt-1">satoshis ({(balanceSats / 1e8).toFixed(8)} BTC)</p>
        </div>

        <div className="bg-white border rounded-2xl p-6 flex flex-col gap-3">
          <p className="text-gray-500 text-sm mb-1">Quick Actions</p>
          <Link href="/buy" className="bg-bitcoin text-white text-center py-3 rounded-xl font-semibold hover:bg-bitcoin-dark transition-colors">
            Buy Bitcoin
          </Link>
          <Link href="/sell" className="border border-bitcoin text-bitcoin text-center py-3 rounded-xl font-semibold hover:bg-orange-50 transition-colors">
            Sell Bitcoin
          </Link>
        </div>
      </div>

      {/* KYC notice */}
      {profile && profile.kyc?.status !== 'APPROVED' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <span className="text-amber-500 text-xl">⚠️</span>
          <div>
            <p className="font-medium text-amber-800 text-sm">Complete your verification</p>
            <p className="text-amber-600 text-xs mt-0.5">
              Verify your ID to increase your transaction limits.{' '}
              <Link href="/profile" className="font-medium underline">Verify now →</Link>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
