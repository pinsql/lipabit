'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Wallet, ArrowRight, Send, CheckCircle, Banknote } from 'lucide-react';

const FLOWS = {
  BUY: [
    {
      num: '01',
      icon: Wallet,
      title: 'Enter Amount & Wallet',
      desc: 'Choose BTC or ETH, enter the KES amount you want to spend, and paste your crypto wallet address.',
      color: '#F7931A',
    },
    {
      num: '02',
      icon: Smartphone,
      title: 'Pay via M-Pesa STK Push',
      desc: 'Approve the payment prompt on your phone. The STK push arrives in under 10 seconds.',
      color: '#0ECB81',
    },
    {
      num: '03',
      icon: Send,
      title: 'Receive Your Crypto',
      desc: 'Once payment is confirmed, crypto is sent on-chain to your wallet — usually within 2 minutes.',
      color: '#6366F1',
    },
  ],
  SELL: [
    {
      num: '01',
      icon: Banknote,
      title: 'Enter Amount & M-Pesa',
      desc: 'Choose your coin, enter the KES value you want, and provide your M-Pesa phone number.',
      color: '#F7931A',
    },
    {
      num: '02',
      icon: Send,
      title: 'Send Crypto to Address',
      desc: 'We generate a unique deposit address for your order. Send the exact crypto amount shown.',
      color: '#0ECB81',
    },
    {
      num: '03',
      icon: Smartphone,
      title: 'Receive M-Pesa Payout',
      desc: 'Once your deposit is confirmed on-chain, M-Pesa payment is sent to you automatically.',
      color: '#6366F1',
    },
  ],
};

export default function HowItWorks() {
  const [flow, setFlow] = useState<'BUY' | 'SELL'>('BUY');

  return (
    <section id="how-it-works" className="py-24 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-8 bg-orange-500" />
            <span className="text-orange-500 text-sm font-semibold uppercase tracking-widest">Simple Process</span>
            <div className="h-px w-8 bg-orange-500" />
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Done in{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
              3 steps
            </span>
          </h2>
          <p className="text-[#848E9C] text-lg max-w-lg mx-auto mb-8">
            The simplest crypto experience in Kenya. No banks. No queues. No KYC.
          </p>

          {/* Toggle */}
          <div className="inline-flex bg-[#131720] border border-[#2B2F36] rounded-xl p-1">
            {(['BUY', 'SELL'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFlow(f)}
                className={`relative px-8 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  flow === f ? 'text-white' : 'text-[#848E9C] hover:text-white'
                }`}
              >
                {flow === f && (
                  <motion.span
                    layoutId="flow-bg"
                    className="absolute inset-0 bg-orange-500 rounded-lg"
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                )}
                <span className="relative">{f === 'BUY' ? '↑ Buy Crypto' : '↓ Sell Crypto'}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Steps */}
        <AnimatePresence mode="wait">
          <motion.div
            key={flow}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35 }}
            className="grid md:grid-cols-3 gap-6 relative"
          >
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-[3.5rem] left-[calc(33.33%+1rem)] right-[calc(33.33%+1rem)] h-px bg-gradient-to-r from-[#2B2F36] via-orange-500/40 to-[#2B2F36]" />

            {FLOWS[flow].map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.12 }}
                  className="relative bg-[#131720] border border-[#2B2F36] rounded-2xl p-7 text-center group hover:border-[#363B44] transition-colors"
                >
                  {/* Step number badge */}
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <div
                      className="w-7 h-7 rounded-full border-2 border-[#0B0E11] flex items-center justify-center text-xs font-black"
                      style={{ background: step.color, color: '#0B0E11' }}
                    >
                      {step.num}
                    </div>
                  </div>

                  {/* Icon */}
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 mt-2 transition-transform group-hover:scale-110 duration-200"
                    style={{ background: `${step.color}15` }}
                  >
                    <Icon className="w-7 h-7" style={{ color: step.color }} />
                  </div>

                  <h3 className="font-bold text-white text-lg mb-3">{step.title}</h3>
                  <p className="text-[#848E9C] text-sm leading-relaxed">{step.desc}</p>

                  {/* Arrow (desktop) */}
                  {i < 2 && (
                    <div className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10">
                      <div className="w-6 h-6 rounded-full bg-[#0B0E11] border border-[#2B2F36] flex items-center justify-center">
                        <ArrowRight className="w-3 h-3 text-orange-500" />
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
