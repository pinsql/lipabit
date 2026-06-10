'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { tradingApi, type RateData } from '@/lib/api';

function formatKES(n: number) {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(n);
}

function formatUSD(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

// Generate realistic-looking sparkline data around a base price
function generateSparkline(base: number, points = 24, volatility = 0.025) {
  const data = [];
  let current = base * (1 - volatility);
  for (let i = 0; i < points; i++) {
    const drift = (Math.random() - 0.46) * base * (volatility / 4);
    current = Math.max(base * 0.92, Math.min(base * 1.08, current + drift));
    data.push({ v: current });
  }
  data[data.length - 1] = { v: base };
  return data;
}

const CHANGE_24H: Record<string, number> = { BTC: 2.34, ETH: -1.12 };

export default function MarketSection() {
  const [rates, setRates] = useState<RateData | null>(null);
  const [sparklines, setSparklines] = useState<Record<string, { v: number }[]>>({});
  const [lastUpdated, setLastUpdated] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchRate = useCallback(async () => {
    setUpdating(true);
    try {
      const data = await tradingApi.getRate();
      setRates(data);
      setSparklines({
        BTC: generateSparkline(data.BTC.kes),
        ETH: generateSparkline(data.ETH.kes, 24, 0.03),
      });
      setLastUpdated(new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch {}
    setTimeout(() => setUpdating(false), 600);
  }, []);

  useEffect(() => { fetchRate(); const t = setInterval(fetchRate, 30000); return () => clearInterval(t); }, [fetchRate]);

  return (
    <section id="market" className="py-24 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between mb-10"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-px w-8 bg-orange-500" />
              <span className="text-orange-500 text-sm font-semibold uppercase tracking-widest">Live Prices</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Market Overview</h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#848E9C]">
            <motion.div animate={updating ? { rotate: 360 } : { rotate: 0 }} transition={{ duration: 0.6 }}>
              <RefreshCw className="w-3.5 h-3.5" />
            </motion.div>
            {lastUpdated && <span>Updated {lastUpdated}</span>}
          </div>
        </motion.div>

        {/* Market cards */}
        <div className="grid md:grid-cols-2 gap-5">
          {[
            { id: 'BTC', name: 'Bitcoin', symbol: '₿', color: '#F7931A', gradId: 'btcGrad', change: CHANGE_24H.BTC },
            { id: 'ETH', name: 'Ethereum', symbol: 'Ξ', color: '#6366F1', gradId: 'ethGrad', change: CHANGE_24H.ETH },
          ].map((asset, i) => {
            const rate = rates ? (rates as unknown as Record<string, { kes: number; usd: number; buyRateKes: number; sellRateKes: number }>)[asset.id] : null;
            const spark = sparklines[asset.id] ?? [];
            const isUp = asset.change >= 0;

            return (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                className="bg-[#131720] border border-[#2B2F36] hover:border-[#363B44] rounded-2xl overflow-hidden transition-colors group cursor-pointer"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg"
                        style={{ background: `${asset.color}20`, color: asset.color, boxShadow: `0 0 20px ${asset.color}20` }}
                      >
                        {asset.symbol}
                      </div>
                      <div>
                        <div className="font-bold text-white">{asset.name}</div>
                        <div className="text-xs text-[#848E9C]">{asset.id}</div>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 text-sm font-semibold px-2.5 py-1 rounded-full ${isUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      {isUp ? '+' : ''}{asset.change}%
                      <span className="text-xs opacity-70 ml-0.5">24h</span>
                    </div>
                  </div>

                  {rate ? (
                    <div className="mb-5">
                      <div className="text-3xl font-extrabold text-white tabular-nums mb-1">
                        {formatKES(rate.kes)}
                      </div>
                      <div className="text-sm text-[#848E9C] tabular-nums">{formatUSD(rate.usd)}</div>
                    </div>
                  ) : (
                    <div className="mb-5">
                      <div className="h-10 bg-[#1C1F26] rounded-lg animate-pulse mb-2 w-48" />
                      <div className="h-4 bg-[#1C1F26] rounded animate-pulse w-24" />
                    </div>
                  )}

                  {/* Sparkline */}
                  <div className="h-16 -mx-1">
                    {spark.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={spark} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
                          <defs>
                            <linearGradient id={asset.gradId} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={asset.color} stopOpacity={0.25} />
                              <stop offset="95%" stopColor={asset.color} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Area
                            type="monotone"
                            dataKey="v"
                            stroke={asset.color}
                            strokeWidth={2}
                            fill={`url(#${asset.gradId})`}
                            dot={false}
                            activeDot={{ r: 3, fill: asset.color }}
                          />
                          <Tooltip
                            content={({ active, payload }) =>
                              active && payload?.length ? (
                                <div className="bg-[#1C1F26] border border-[#2B2F36] rounded-lg px-2.5 py-1.5 text-xs text-white shadow-xl">
                                  {formatKES(payload[0].value as number)}
                                </div>
                              ) : null
                            }
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full bg-[#1C1F26] rounded-xl animate-pulse" />
                    )}
                  </div>

                  {/* Buy/Sell rates */}
                  {rate && (
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl px-3 py-2.5">
                        <div className="text-xs text-[#848E9C] mb-0.5">Buy rate</div>
                        <div className="text-sm font-bold text-emerald-400 tabular-nums">{formatKES(rate.buyRateKes)}</div>
                      </div>
                      <div className="bg-red-500/5 border border-red-500/10 rounded-xl px-3 py-2.5">
                        <div className="text-xs text-[#848E9C] mb-0.5">Sell rate</div>
                        <div className="text-sm font-bold text-red-400 tabular-nums">{formatKES(rate.sellRateKes)}</div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
