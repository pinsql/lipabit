'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RateData {
  buy_rate: number;
  sell_rate: number;
  btc_usd: number;
  timestamp?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATS = [
  { label: 'KES Traded', value: 'KES 2.4B+' },
  { label: 'Verified Users', value: '38,000+' },
  { label: 'Platform Uptime', value: '99.97%' },
  { label: 'Avg Settlement', value: '< 45 sec' },
];

const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    title: 'Instant M-Pesa Settlement',
    description:
      'Send a buy order and receive Bitcoin in your wallet in under 60 seconds. M-Pesa deposits and withdrawals processed around the clock, 365 days a year.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: 'Bank-Grade Security',
    description:
      'Your funds are protected with AES-256 encryption, mandatory 2FA, and cold-storage custody. Every transaction is immutably logged for full auditability.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
    title: 'Live Market Rates',
    description:
      'Rates are sourced directly from global markets and updated every 10 seconds. What you see is what you pay — no hidden fees, no last-look slippage.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3m-3 3h3m-3 3h3" />
      </svg>
    ),
    title: 'KYC in Minutes',
    description:
      'A simple three-step identity check — ID scan, selfie, and phone verification — gets you trading-ready in under five minutes, fully compliant with CBK guidelines.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Transparent 2% Fee',
    description:
      'One flat fee. No withdrawal charges, no network surcharges, no subscription tiers. The price you see in the rate card is the total cost of your trade.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" />
      </svg>
    ),
    title: '24 / 7 Support',
    description:
      'Reach a real agent via live chat, WhatsApp, or email at any hour. Our Nairobi-based support team resolves 95% of tickets within 15 minutes.',
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Create Your Account',
    description: 'Sign up with your phone number, complete the quick KYC check, and you are ready to trade.',
  },
  {
    step: '02',
    title: 'Deposit via M-Pesa',
    description: 'Use M-Pesa Paybill to fund your LipaBit wallet instantly. Funds reflect in seconds.',
  },
  {
    step: '03',
    title: 'Buy or Sell Bitcoin',
    description: 'Enter the KES amount you want to trade. We show you the exact BTC amount at the live rate.',
  },
  {
    step: '04',
    title: 'Receive Instantly',
    description: 'BTC lands in your wallet or KES hits your M-Pesa within 60 seconds of confirmation.',
  },
];

// ─── Utility ──────────────────────────────────────────────────────────────────

function formatKES(value: number): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatUSD(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function BitcoinLogo({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#F7931A" />
      <path
        d="M22.1 13.8c.3-2-1.2-3.1-3.3-3.8l.7-2.7-1.7-.4-.7 2.6c-.4-.1-.9-.2-1.4-.3l.7-2.6-1.7-.4-.7 2.7c-.3-.1-.7-.2-1-.3v0l-2.3-.6-.5 1.8s1.3.3 1.2.3c.7.2.8.7.8 1l-.8 3.3c0 .1.1.1.1.2l-.1 0 .1 0-1.2 4.6c-.1.2-.3.6-.8.4 0 0-1.2-.3-1.2-.3l-.8 2 2.2.5c.4.1.8.2 1.2.3l-.7 2.7 1.7.4.7-2.7c.5.1.9.2 1.4.3l-.7 2.7 1.7.4.7-2.7c2.8.5 4.9.3 5.8-2.2.7-2-.03-3.2-1.5-3.9 1.1-.2 1.9-.9 2.1-2.3zm-3.8 5.3c-.5 2-3.9 1-5 .7l.9-3.5c1.1.3 4.6.8 4.1 2.8zm.5-5.4c-.5 1.8-3.3 1-4.3.7l.8-3.2c1 .3 3.9.7 3.5 2.5z"
        fill="#fff"
      />
    </svg>
  );
}

function PriceTicker({ rate }: { rate: RateData | null; loading: boolean }) {
  const prev = useRef<number | null>(null);
  const [direction, setDirection] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    if (rate && prev.current !== null) {
      setDirection(rate.btc_usd > prev.current ? 'up' : 'down');
      const t = setTimeout(() => setDirection(null), 1200);
      return () => clearTimeout(t);
    }
    if (rate) prev.current = rate.btc_usd;
  }, [rate]);

  useEffect(() => {
    if (rate) prev.current = rate.btc_usd;
  }, [rate]);

  const tickerColor =
    direction === 'up'
      ? 'text-[#0ECB81]'
      : direction === 'down'
      ? 'text-[#F6465D]'
      : 'text-[#F7931A]';

  return (
    <div className="flex items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-[#0ECB81] animate-pulse" />
      <span className="text-[#848E9C] text-sm font-medium">BTC/USD</span>
      <AnimatePresence mode="wait">
        <motion.span
          key={rate?.btc_usd ?? 'loading'}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.25 }}
          className={`text-sm font-semibold tabular-nums font-mono ${tickerColor}`}
        >
          {rate ? formatUSD(rate.btc_usd) : '—'}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

function RateCard({ rate, loading }: { rate: RateData | null; loading: boolean }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.06)] bg-[#1C1F26] shadow-2xl shadow-black/40">
      {/* header */}
      <div className="bg-[#22262F] px-5 py-4 flex items-center justify-between border-b border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-2">
          <BitcoinLogo className="w-6 h-6" />
          <span className="text-[#EAECEF] font-semibold text-sm">Live BTC Rate</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0ECB81] animate-pulse" />
          <span className="text-[#848E9C] text-xs">Auto-refresh 10s</span>
        </div>
      </div>

      {/* body */}
      <div className="p-5 space-y-4">
        {/* buy */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[#848E9C] text-xs mb-1 uppercase tracking-wider">Buy Rate</p>
            <AnimatePresence mode="wait">
              <motion.p
                key={`buy-${rate?.buy_rate}`}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="text-[#EAECEF] text-2xl font-bold tabular-nums font-mono"
              >
                {loading || !rate ? (
                  <span className="inline-block w-32 h-7 rounded bg-[#22262F] animate-pulse" />
                ) : (
                  formatKES(rate.buy_rate)
                )}
              </motion.p>
            </AnimatePresence>
            <p className="text-[#848E9C] text-xs mt-1">per 1 BTC</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs text-[#0ECB81] font-medium bg-[#0ECB81]/10 px-2 py-0.5 rounded-full">BUY</span>
            <span className="text-[#848E9C] text-xs">M-Pesa → BTC</span>
          </div>
        </div>

        <div className="border-t border-[rgba(255,255,255,0.06)]" />

        {/* sell */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[#848E9C] text-xs mb-1 uppercase tracking-wider">Sell Rate</p>
            <AnimatePresence mode="wait">
              <motion.p
                key={`sell-${rate?.sell_rate}`}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="text-[#EAECEF] text-2xl font-bold tabular-nums font-mono"
              >
                {loading || !rate ? (
                  <span className="inline-block w-32 h-7 rounded bg-[#22262F] animate-pulse" />
                ) : (
                  formatKES(rate.sell_rate)
                )}
              </motion.p>
            </AnimatePresence>
            <p className="text-[#848E9C] text-xs mt-1">per 1 BTC</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs text-[#F6465D] font-medium bg-[#F6465D]/10 px-2 py-0.5 rounded-full">SELL</span>
            <span className="text-[#848E9C] text-xs">BTC → M-Pesa</span>
          </div>
        </div>

        <div className="border-t border-[rgba(255,255,255,0.06)]" />

        {/* spread note */}
        <p className="text-[#848E9C] text-xs text-center">
          Transparent 2% fee included · No hidden charges
        </p>
      </div>

      {/* CTAs */}
      <div className="px-5 pb-5 grid grid-cols-2 gap-3">
        <Link
          href="/register"
          className="bg-[#F7931A] hover:bg-[#E07800] transition-colors text-white text-sm font-semibold py-3 rounded-xl text-center"
        >
          Buy Bitcoin
        </Link>
        <Link
          href="/register"
          className="border border-[rgba(255,255,255,0.12)] hover:border-[rgba(255,255,255,0.24)] bg-[#22262F] hover:bg-[#363B44] transition-colors text-[#EAECEF] text-sm font-semibold py-3 rounded-xl text-center"
        >
          Sell Bitcoin
        </Link>
      </div>
    </div>
  );
}

// ─── Animation variants ───────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
};

const fadeIn = {
  hidden: { opacity: 0 },
  show: (i: number = 0) => ({
    opacity: 1,
    transition: { duration: 0.5, delay: i * 0.08 },
  }),
};

// ─── Sections ─────────────────────────────────────────────────────────────────

function StatsBar({ rate }: { rate: RateData | null }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section ref={ref} className="border-y border-[rgba(255,255,255,0.06)] bg-[#1C1F26]/60 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x md:divide-[rgba(255,255,255,0.06)]">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              custom={i}
              variants={fadeIn}
              initial="hidden"
              animate={inView ? 'show' : 'hidden'}
              className="flex flex-col items-center text-center md:px-8"
            >
              <span className="text-2xl sm:text-3xl font-bold text-[#EAECEF] tabular-nums">{s.value}</span>
              <span className="text-[#848E9C] text-xs mt-1 uppercase tracking-wider">{s.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate={inView ? 'show' : 'hidden'}
        className="text-center mb-14"
      >
        <span className="text-[#F7931A] text-xs font-semibold uppercase tracking-widest">Why LipaBit</span>
        <h2 className="text-3xl sm:text-4xl font-bold text-[#EAECEF] mt-3 leading-snug">
          Built for Kenyans who move fast
        </h2>
        <p className="text-[#848E9C] mt-4 max-w-xl mx-auto text-base sm:text-lg">
          Every feature was designed around the realities of trading Bitcoin with M-Pesa in Kenya.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            custom={i}
            variants={fadeUp}
            initial="hidden"
            animate={inView ? 'show' : 'hidden'}
            className="group bg-[#1C1F26] hover:bg-[#22262F] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(247,147,26,0.2)] rounded-2xl p-6 transition-all duration-300"
          >
            <div className="w-11 h-11 rounded-xl bg-[#F7931A]/10 text-[#F7931A] flex items-center justify-center mb-4 group-hover:bg-[#F7931A]/20 transition-colors">
              {f.icon}
            </div>
            <h3 className="text-[#EAECEF] font-semibold mb-2">{f.title}</h3>
            <p className="text-[#848E9C] text-sm leading-relaxed">{f.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="bg-[#1C1F26]/40 border-y border-[rgba(255,255,255,0.06)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate={inView ? 'show' : 'hidden'}
          className="text-center mb-14"
        >
          <span className="text-[#F0B90B] text-xs font-semibold uppercase tracking-widest">How It Works</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#EAECEF] mt-3">
            From sign-up to Bitcoin in four steps
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* connector line — desktop only */}
          <div className="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.08)] to-transparent" />

          {HOW_IT_WORKS.map((step, i) => (
            <motion.div
              key={step.step}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              animate={inView ? 'show' : 'hidden'}
              className="flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-[#22262F] border border-[rgba(255,255,255,0.08)] flex items-center justify-center mb-5 relative z-10">
                <span className="text-[#F7931A] font-bold text-lg font-mono">{step.step}</span>
              </div>
              <h3 className="text-[#EAECEF] font-semibold mb-2">{step.title}</h3>
              <p className="text-[#848E9C] text-sm leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrustBadges() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  const badges = [
    { label: 'CBK Compliant', sub: 'Kenya regulations' },
    { label: 'ISO 27001', sub: 'Certified security' },
    { label: 'AML / KYC', sub: 'Fully verified' },
    { label: 'SSL / TLS 1.3', sub: 'End-to-end encrypted' },
  ];

  return (
    <section ref={ref} className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate={inView ? 'show' : 'hidden'}
        className="flex flex-wrap items-center justify-center gap-4 sm:gap-6"
      >
        {badges.map((b, i) => (
          <motion.div
            key={b.label}
            custom={i}
            variants={fadeIn}
            initial="hidden"
            animate={inView ? 'show' : 'hidden'}
            className="flex items-center gap-3 bg-[#1C1F26] border border-[rgba(255,255,255,0.06)] rounded-xl px-5 py-3"
          >
            <div className="w-8 h-8 rounded-full bg-[#F0B90B]/10 flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-[#F0B90B]">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-[#EAECEF] text-sm font-semibold leading-none">{b.label}</p>
              <p className="text-[#848E9C] text-xs mt-0.5">{b.sub}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

function CTABanner() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section ref={ref} className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate={inView ? 'show' : 'hidden'}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#F7931A]/20 via-[#1C1F26] to-[#22262F] border border-[rgba(247,147,26,0.2)] p-10 sm:p-16 text-center"
      >
        {/* background glow */}
        <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-[#F7931A]/10 blur-3xl" />

        <div className="relative z-10">
          <p className="text-[#F7931A] text-xs font-semibold uppercase tracking-widest mb-4">Get Started Today</p>
          <h2 className="text-3xl sm:text-5xl font-bold text-[#EAECEF] mb-5 leading-tight">
            Kenya's most trusted<br className="hidden sm:block" /> Bitcoin exchange
          </h2>
          <p className="text-[#848E9C] text-base sm:text-lg max-w-lg mx-auto mb-10">
            Join 38,000+ Kenyans already buying and selling Bitcoin with M-Pesa on LipaBit.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 bg-[#F7931A] hover:bg-[#E07800] transition-colors text-white font-semibold text-base px-8 py-4 rounded-xl shadow-lg shadow-[#F7931A]/20"
            >
              Create Free Account
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center border border-[rgba(255,255,255,0.12)] hover:border-[rgba(255,255,255,0.3)] text-[#EAECEF] font-semibold text-base px-8 py-4 rounded-xl bg-[#22262F] hover:bg-[#363B44] transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[rgba(255,255,255,0.06)] bg-[#0B0E11]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* brand */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <BitcoinLogo className="w-9 h-9" />
              <span className="text-[#EAECEF] font-bold text-xl tracking-tight">LipaBit</span>
            </div>
            <p className="text-[#848E9C] text-sm leading-relaxed max-w-xs">
              Kenya's premier Bitcoin exchange. Fast, secure M-Pesa-powered trading for every Kenyan.
            </p>
            <div className="flex gap-3 mt-5">
              {/* Twitter/X */}
              <a
                href="https://twitter.com/lipabit"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-lg bg-[#1C1F26] border border-[rgba(255,255,255,0.06)] flex items-center justify-center text-[#848E9C] hover:text-[#EAECEF] hover:border-[rgba(255,255,255,0.2)] transition-all"
                aria-label="Twitter"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              {/* WhatsApp */}
              <a
                href="https://wa.me/254700000000"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-lg bg-[#1C1F26] border border-[rgba(255,255,255,0.06)] flex items-center justify-center text-[#848E9C] hover:text-[#EAECEF] hover:border-[rgba(255,255,255,0.2)] transition-all"
                aria-label="WhatsApp"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-[#EAECEF] text-sm font-semibold mb-4 uppercase tracking-wider">Company</h4>
            <ul className="space-y-3">
              {['About Us', 'Careers', 'Blog', 'Press'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-[#848E9C] hover:text-[#EAECEF] text-sm transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Trade */}
          <div>
            <h4 className="text-[#EAECEF] text-sm font-semibold mb-4 uppercase tracking-wider">Trade</h4>
            <ul className="space-y-3">
              {['Buy Bitcoin', 'Sell Bitcoin', 'Rates', 'Transaction History'].map((item) => (
                <li key={item}>
                  <a href="/register" className="text-[#848E9C] hover:text-[#EAECEF] text-sm transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-[#EAECEF] text-sm font-semibold mb-4 uppercase tracking-wider">Legal</h4>
            <ul className="space-y-3">
              {[
                { label: 'Privacy Policy', href: '/privacy' },
                { label: 'Terms of Service', href: '/terms' },
                { label: 'AML Policy', href: '/aml' },
                { label: 'Cookie Policy', href: '/cookies' },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-[#848E9C] hover:text-[#EAECEF] text-sm transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[rgba(255,255,255,0.06)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[#848E9C] text-sm">
            © {new Date().getFullYear()} LipaBit Technologies Ltd. Registered in Kenya.
          </p>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#0ECB81]" />
            <p className="text-[#848E9C] text-sm">All systems operational</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [rate, setRate] = useState<RateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchRate = async () => {
    try {
      const res = await fetch('/api/v1/trading/rate', { cache: 'no-store' });
      if (!res.ok) throw new Error('rate fetch failed');
      const data: RateData = await res.json();
      setRate(data);
      setLastUpdated(new Date());
    } catch {
      // retain last known rate on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRate();
    const interval = setInterval(fetchRate, 10_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0E11] font-sans">
      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 bg-[#0B0E11]/80 backdrop-blur-md border-b border-[rgba(255,255,255,0.06)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* logo */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <BitcoinLogo className="w-9 h-9" />
            <span className="text-[#EAECEF] font-bold text-xl tracking-tight">LipaBit</span>
          </div>

          {/* live ticker — hidden on small screens */}
          <div className="hidden md:flex items-center">
            <PriceTicker rate={rate} loading={loading} />
          </div>

          {/* nav actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-[#848E9C] hover:text-[#EAECEF] text-sm font-medium transition-colors hidden sm:block"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="bg-[#F7931A] hover:bg-[#E07800] transition-colors text-white text-sm font-semibold px-4 py-2 rounded-lg"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* background radial glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-[#F7931A]/5 blur-[120px]" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-8 sm:pt-24 sm:pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* left: copy */}
            <div>
              <motion.div
                variants={fadeUp}
                custom={0}
                initial="hidden"
                animate="show"
                className="inline-flex items-center gap-2 bg-[#1C1F26] border border-[rgba(247,147,26,0.2)] text-[#F7931A] text-xs font-semibold px-4 py-2 rounded-full mb-6"
              >
                <span className="text-base leading-none">🇰🇪</span>
                Kenya's Premier Bitcoin Exchange
              </motion.div>

              <motion.h1
                variants={fadeUp}
                custom={1}
                initial="hidden"
                animate="show"
                className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#EAECEF] leading-[1.1] mb-6"
              >
                Buy & Sell Bitcoin
                <br />
                <span className="text-[#F7931A]">Instantly</span> with
                <br />
                <span className="text-[#F7931A]">M-Pesa</span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                custom={2}
                initial="hidden"
                animate="show"
                className="text-[#848E9C] text-base sm:text-lg leading-relaxed mb-8 max-w-lg"
              >
                LipaBit is the fastest, most secure way to exchange Bitcoin and Kenyan Shillings.
                Live market rates, transparent fees, and 60-second settlement via M-Pesa.
              </motion.p>

              <motion.div
                variants={fadeUp}
                custom={3}
                initial="hidden"
                animate="show"
                className="flex flex-col sm:flex-row gap-3 mb-10"
              >
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 bg-[#F7931A] hover:bg-[#E07800] transition-colors text-white font-semibold text-base px-7 py-3.5 rounded-xl shadow-lg shadow-[#F7931A]/20"
                >
                  Buy Bitcoin
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 border border-[rgba(255,255,255,0.12)] hover:border-[rgba(255,255,255,0.25)] bg-[#1C1F26] hover:bg-[#22262F] transition-all text-[#EAECEF] font-semibold text-base px-7 py-3.5 rounded-xl"
                >
                  Sell Bitcoin
                </Link>
              </motion.div>

              {/* trust row */}
              <motion.div
                variants={fadeUp}
                custom={4}
                initial="hidden"
                animate="show"
                className="flex flex-wrap items-center gap-5"
              >
                {[
                  { icon: '✓', label: 'No hidden fees' },
                  { icon: '✓', label: '38,000+ users' },
                  { icon: '✓', label: '99.97% uptime' },
                ].map((t) => (
                  <div key={t.label} className="flex items-center gap-1.5">
                    <span className="text-[#0ECB81] text-xs font-bold">{t.icon}</span>
                    <span className="text-[#848E9C] text-xs">{t.label}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* right: live rate card */}
            <motion.div
              variants={fadeUp}
              custom={2}
              initial="hidden"
              animate="show"
              className="w-full max-w-sm mx-auto lg:mx-0 lg:ml-auto"
            >
              <RateCard rate={rate} loading={loading} />
              {lastUpdated && (
                <p className="text-[#848E9C] text-xs text-center mt-3">
                  Last updated: {lastUpdated.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <StatsBar rate={rate} />

      {/* ── Features ── */}
      <FeaturesSection />

      {/* ── How It Works ── */}
      <HowItWorksSection />

      {/* ── Trust Badges ── */}
      <TrustBadges />

      {/* ── CTA Banner ── */}
      <CTABanner />

      {/* ── Footer ── */}
      <Footer />
    </div>
  );
}
