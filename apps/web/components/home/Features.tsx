'use client';

import { motion } from 'framer-motion';
import { Zap, Shield, TrendingUp, UserX, Clock, BadgePercent } from 'lucide-react';

const FEATURES = [
  {
    icon: Zap,
    title: 'Instant M-Pesa Payments',
    desc: 'STK push delivered in under 10 seconds. Pay and receive crypto without leaving your phone.',
    color: '#F7931A',
    glow: 'rgba(247,147,26,0.15)',
  },
  {
    icon: Shield,
    title: 'Secure Crypto Transfers',
    desc: 'Every transaction is cryptographically verified on-chain. Your funds are safe at every step.',
    color: '#6366F1',
    glow: 'rgba(99,102,241,0.15)',
  },
  {
    icon: TrendingUp,
    title: 'Live Market Pricing',
    desc: "Real-time rates from global exchanges. You always get Kenya's best crypto-to-KES price.",
    color: '#0ECB81',
    glow: 'rgba(14,203,129,0.15)',
  },
  {
    icon: UserX,
    title: 'No Registration Required',
    desc: 'Start trading immediately. Just enter your wallet address and M-Pesa number — done.',
    color: '#F6465D',
    glow: 'rgba(246,70,93,0.15)',
  },
  {
    icon: Clock,
    title: '24/7 Availability',
    desc: 'Trade any time, any day. Automated systems process your transaction around the clock.',
    color: '#F0B90B',
    glow: 'rgba(240,185,11,0.15)',
  },
  {
    icon: BadgePercent,
    title: 'Transparent 1% Fee',
    desc: 'One flat fee. No hidden charges, no surprises. See exactly what you pay before you confirm.',
    color: '#0ECB81',
    glow: 'rgba(14,203,129,0.15)',
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-8 bg-orange-500" />
            <span className="text-orange-500 text-sm font-semibold uppercase tracking-widest">Why LipaBit</span>
            <div className="h-px w-8 bg-orange-500" />
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Built for Kenya.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
              Trusted by Kenyans.
            </span>
          </h2>
          <p className="text-[#848E9C] text-lg max-w-xl mx-auto">
            Every feature was designed around one goal: making crypto as easy as sending M-Pesa.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="group relative bg-[#131720] border border-[#2B2F36] hover:border-[#363B44] rounded-2xl p-6 overflow-hidden cursor-default"
              >
                {/* Hover glow */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
                  style={{ background: `radial-gradient(ellipse 80% 80% at 50% 120%, ${feat.glow} 0%, transparent 70%)` }}
                />

                <div className="relative">
                  {/* Icon */}
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110 duration-200"
                    style={{ background: `${feat.color}15` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: feat.color }} />
                  </div>

                  <h3 className="font-bold text-white text-lg mb-2 leading-snug">{feat.title}</h3>
                  <p className="text-[#848E9C] text-sm leading-relaxed">{feat.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
