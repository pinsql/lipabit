'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function TrackLookupPage() {
  const router = useRouter();
  const [ref, setRef] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = ref.trim().toUpperCase();
    if (trimmed) router.push(`/track/${trimmed}`);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <Link href="/" className="text-zinc-500 hover:text-white text-sm transition-colors block mb-6">
          ← Back
        </Link>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          <h1 className="text-xl font-bold mb-2">Track Your Order</h1>
          <p className="text-zinc-400 text-sm mb-6">
            Enter your order reference number to check the status.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="LB-XXXXXXXX or LS-XXXXXXXX"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-orange-500 transition-colors placeholder-zinc-600"
              required
            />
            <button
              type="submit"
              className="w-full py-3 bg-orange-500 hover:bg-orange-400 text-white font-semibold rounded-xl transition-colors"
            >
              Track Order →
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
