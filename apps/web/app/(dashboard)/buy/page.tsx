'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/lib/api';

const schema = z.object({
  amountKes: z.number().min(500, 'Minimum is KES 500').max(500000),
  phone: z.string().regex(/^\+254[0-9]{9}$/, 'Enter a valid number (+254...)'),
});

type FormData = z.infer<typeof schema>;

export default function BuyPage() {
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<any>(null);
  const [error, setError] = useState('');

  const { register, watch, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { amountKes: 1000 },
  });

  const amount = watch('amountKes');

  useEffect(() => {
    if (!amount || amount < 500) return;
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get(`/trading/quote?type=BUY_BTC&amountKes=${amount}`);
        setQuote(data);
      } catch {}
    }, 500);
    return () => clearTimeout(t);
  }, [amount]);

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      setError('');
      const { data: tx } = await api.post('/trading/buy', data);
      setPending(tx);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to initiate purchase');
    } finally {
      setLoading(false);
    }
  };

  if (pending) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <div className="text-5xl mb-4">📱</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Check your phone</h2>
        <p className="text-gray-500 mb-4">A payment prompt has been sent to your phone. Enter your M-Pesa PIN to complete.</p>
        <div className="bg-gray-50 rounded-xl p-4 text-left text-sm space-y-2">
          <p><span className="text-gray-500">Reference:</span> <span className="font-mono font-bold">{pending.reference}</span></p>
          <p><span className="text-gray-500">Amount:</span> <span className="font-bold">KES {pending.amountKes?.toLocaleString()}</span></p>
          <p><span className="text-gray-500">You get:</span> <span className="font-bold">{pending.amountSats?.toLocaleString()} sats</span></p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Buy Bitcoin</h1>
      <p className="text-gray-500 text-sm mb-6">Pay with M-Pesa, receive Bitcoin instantly</p>

      {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 border border-red-100">{error}</div>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 bg-white border rounded-2xl p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount (KES)</label>
          <input
            {...register('amountKes', { valueAsNumber: true })}
            type="number"
            min={500}
            className="w-full border rounded-lg px-3 py-3 text-lg font-mono focus:outline-none focus:ring-2 focus:ring-bitcoin/30 focus:border-bitcoin"
            placeholder="1000"
          />
          {errors.amountKes && <p className="text-red-500 text-xs mt-1">{errors.amountKes.message}</p>}
        </div>

        {quote && (
          <div className="bg-orange-50 rounded-xl p-4 text-sm space-y-2">
            <div className="flex justify-between"><span className="text-gray-500">You pay</span><span className="font-semibold">KES {Number(amount).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Fee ({quote.feePercent}%)</span><span className="text-gray-700">KES {quote.feeKes?.toLocaleString()}</span></div>
            <div className="flex justify-between border-t pt-2 mt-2"><span className="text-gray-700 font-medium">You receive</span><span className="font-bold text-bitcoin">{quote.amountSats?.toLocaleString()} sats</span></div>
            <p className="text-gray-400 text-xs">Rate: KES {quote.btcPriceKes?.toLocaleString()} / BTC</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">M-Pesa Phone</label>
          <input
            {...register('phone')}
            type="tel"
            placeholder="+254712345678"
            className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bitcoin/30 focus:border-bitcoin"
          />
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
        </div>

        <button type="submit" disabled={loading} className="w-full bg-bitcoin text-white py-3.5 rounded-xl font-semibold hover:bg-bitcoin-dark transition-colors disabled:opacity-50">
          {loading ? 'Processing...' : 'Buy Bitcoin →'}
        </button>
      </form>
    </div>
  );
}
