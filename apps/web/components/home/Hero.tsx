'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Shield, Zap, Clock, ChevronRight } from 'lucide-react';
import ExchangeWidget from './ExchangeWidget';

const TRUST_PILLS = [
  { icon: Zap, label: 'Instant M-Pesa' },
  { icon: Shield, label: 'Secure & Encrypted' },
  { icon: Clock, label: '24/7 Settlement' },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};
const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
};

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-16">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 w-full py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* ── Left: Copy ── */}
          <motion.div variants={container} initial="hidden" animate="show">
            {/* Badge */}
            <motion.div variants={item} className="inline-flex items-center gap-2 mb-7">
              <div className="flex items-center gap-2 bg-[#131720] border border-[#2B2F36] rounded-full pl-2 pr-4 py-1.5 text-xs font-medium">
                <span className="flex items-center gap-1.5 bg-orange-500/15 text-orange-400 rounded-full px-2.5 py-1 font-semibold">
                  <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                  LIVE
                </span>
                <span className="text-[#848E9C]">Market rates updating in real-time</span>
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={item}
              className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight mb-6"
            >
              Buy & Sell{' '}
              <span className="relative">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600">
                  Bitcoin
                </span>
              </span>
              <br />
              with{' '}
              <span className="relative">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-500">
                  M-Pesa
                </span>
              </span>{' '}
              <br />
              in Seconds.
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              variants={item}
              className="text-[#848E9C] text-lg lg:text-xl leading-relaxed mb-8 max-w-md"
            >
              Kenya&apos;s fastest crypto exchange. Convert between Bitcoin, Ethereum
              and KES instantly. No registration required.
            </motion.p>

            {/* Trust pills */}
            <motion.div variants={item} className="flex flex-wrap gap-3 mb-10">
              {TRUST_PILLS.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 bg-[#131720] border border-[#2B2F36] rounded-full px-3.5 py-2 text-sm text-[#EAECEF]"
                >
                  <Icon className="w-3.5 h-3.5 text-orange-500" />
                  {label}
                </div>
              ))}
            </motion.div>

            {/* CTA buttons */}
            <motion.div variants={item} className="flex flex-wrap gap-4">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href="/buy"
                  className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold px-7 py-4 rounded-xl text-base transition-colors shadow-xl shadow-orange-500/25"
                >
                  Buy Crypto
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href="/sell"
                  className="inline-flex items-center gap-2 bg-[#131720] hover:bg-[#1C1F26] border border-[#2B2F36] hover:border-[#363B44] text-white font-bold px-7 py-4 rounded-xl text-base transition-colors"
                >
                  Sell Crypto
                </Link>
              </motion.div>
            </motion.div>

            {/* Stats row */}
            <motion.div
              variants={item}
              className="mt-12 grid grid-cols-3 gap-6 pt-8 border-t border-[#2B2F36]"
            >
              {[
                { value: '2 min', label: 'Avg. settlement' },
                { value: '99.7%', label: 'Success rate' },
                { value: '24/7', label: 'Availability' },
              ].map(({ value, label }) => (
                <div key={label}>
                  <div className="text-2xl font-extrabold text-white mb-0.5">{value}</div>
                  <div className="text-xs text-[#848E9C]">{label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* ── Right: Exchange Widget ── */}
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3, ease }}
          >
            <ExchangeWidget />
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-xs text-[#5A6275]">Scroll to explore</span>
        <div className="w-5 h-8 border border-[#2B2F36] rounded-full flex items-start justify-center pt-1.5">
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-1 h-1.5 bg-orange-500 rounded-full"
          />
        </div>
      </motion.div>
    </section>
  );
}
