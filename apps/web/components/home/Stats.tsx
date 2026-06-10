'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

const STATS = [
  { value: 47200, label: 'Transactions Completed', suffix: '+', prefix: '', decimals: 0 },
  { value: 2.4, label: 'Crypto Settled', suffix: 'B KES+', prefix: '', decimals: 1 },
  { value: 12800, label: 'Active Users', suffix: '+', prefix: '', decimals: 0 },
  { value: 99.7, label: 'Settlement Success Rate', suffix: '%', prefix: '', decimals: 1 },
];

function useCounter(end: number, duration = 2000, decimals = 0, started = false) {
  const [count, setCount] = useState(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!started) return;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(parseFloat((eased * end).toFixed(decimals)));
      if (progress < 1) frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [end, duration, decimals, started]);

  return count;
}

function StatCard({ value, label, suffix, prefix, decimals, delay }: typeof STATS[0] & { delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const count = useCounter(value, 1800, decimals, inView);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.6, delay }}
      className="text-center"
    >
      <div className="text-4xl sm:text-5xl font-extrabold text-white tabular-nums mb-2">
        {prefix}
        {decimals > 0 ? count.toFixed(decimals) : Math.floor(count).toLocaleString()}
        <span className="text-orange-500">{suffix}</span>
      </div>
      <div className="text-[#848E9C] text-sm font-medium">{label}</div>
    </motion.div>
  );
}

export default function Stats() {
  return (
    <section className="py-24 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="relative bg-gradient-to-br from-[#131720] to-[#0F1219] border border-[#2B2F36] rounded-3xl overflow-hidden p-12 sm:p-16">
          {/* Background decorations */}
          <div className="absolute top-0 left-0 w-96 h-96 bg-orange-500/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl" />

          <div className="relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-14"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
                The Numbers Don&apos;t Lie
              </h2>
              <p className="text-[#848E9C]">Trusted by thousands of Kenyans every month.</p>
            </motion.div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-10">
              {STATS.map((stat, i) => (
                <StatCard key={stat.label} {...stat} delay={i * 0.1} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
