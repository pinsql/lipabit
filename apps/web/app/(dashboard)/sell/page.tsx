'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/lib/api';

const schema = z.object({
  amountSats: z.number().min(1000, 'Minimum is 1,000 sats'),
  phone: z.string().regex(/^\+254[0-9]{9}$/, 'Enter a valid number (+254...)'),
});

type FormData = z.infer<typeof schema>;

export default function SellPage() {
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<any>(null);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      setError('');
      const { data: tx } = await api.post('/trading/sell', data);
      setPending(tx);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to initiate sale');
    } finally {
      setLoading(false);
    }
  };

  if (pending) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <div className="text-5xl mb-4">💰</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Sale initiated!</h2>
        <p className="text-gray-500 mb-4">Your M-Pesa payout is processing. You'll receive funds in under 2 minutes.</p>
        <div className="bg-gray-50 rounded-xl p-4 text-left text-sm space-y-2">
          <p><span className="text-gray-500">Reference:</span> <span className="font-mono font-bold">{pending.reference}</span></p>
          <p><span className="text-gray-500">Bitcoin sold:</span> <span className="font-bold">{pending.amountSats?.toLocaleString()} sats</span></p>
          <p><span className="text-gray-500">You receive:</span> <span className="font-bold text-green-600">KES {pending.netAmountKes?.toLocaleString()}</span></p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Sell Bitcoin</h1>
      <p className="text-gray-500 text-sm mb-6">Sell sats, receive KES via M-Pesa</p>

      {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 border border-red-100">{error}</div>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 bg-white border rounded-2xl p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount (satoshis)</label>
          <input
            {...register('amountSats', { valueAsNumber: true })}
            type="number"
            min={1000}
            className="w-full border rounded-lg px-3 py-3 text-lg font-mono focus:outline-none focus:ring-2 focus:ring-bitcoin/30 focus:border-bitcoin"
            placeholder="50000"
          />
          {errors.amountSats && <p className="text-red-500 text-xs mt-1">{errors.amountSats.message}</p>}
          <p className="text-gray-400 text-xs mt-1">1 BTC = 100,000,000 satoshis</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">M-Pesa Phone (receive payout)</label>
          <input
            {...register('phone')}
            type="tel"
            placeholder="+254712345678"
            className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bitcoin/30 focus:border-bitcoin"
          />
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
        </div>

        <button type="submit" disabled={loading} className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50">
          {loading ? 'Processing...' : 'Sell Bitcoin →'}
        </button>
      </form>
    </div>
  );
}
