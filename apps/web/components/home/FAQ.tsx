'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';

const FAQS = [
  {
    q: 'Do I need to create an account to trade?',
    a: 'No registration required. Guest trading is fully supported — just provide your wallet address and M-Pesa number. For recurring trading and transaction history, you can optionally create a free account.',
  },
  {
    q: 'How long does a Bitcoin purchase take?',
    a: 'Most purchases complete within 2–5 minutes. M-Pesa payment processing takes under a minute, then crypto is broadcast on-chain immediately. Final confirmation depends on current Bitcoin mempool activity.',
  },
  {
    q: 'What are your fees?',
    a: 'We charge a flat 1% platform fee on all trades. There are no hidden charges, no deposit fees, and no withdrawal fees. The fee is shown transparently before you confirm any transaction.',
  },
  {
    q: 'What is the minimum trade amount?',
    a: 'The minimum trade is KES 100. There is currently no maximum limit for most users, though large trades may require identity verification under Kenyan regulations.',
  },
  {
    q: 'What happens if my M-Pesa payment fails?',
    a: 'If your STK push times out or fails, the transaction is automatically cancelled and no money leaves your account. You can try again immediately — there is no wait period.',
  },
  {
    q: 'Is LipaBit regulated in Kenya?',
    a: 'LipaBit operates in compliance with Kenyan financial regulations. We follow KYC/AML guidelines for large transactions and cooperate fully with regulatory requirements.',
  },
  {
    q: 'Can I sell Bitcoin for M-Pesa?',
    a: 'Yes. Send your Bitcoin to our deposit address, and once confirmed on-chain, we instantly send the KES equivalent to your M-Pesa number. The process typically takes under 5 minutes.',
  },
  {
    q: 'Which cryptocurrencies do you support?',
    a: 'We currently support Bitcoin (BTC) and Ethereum (ETH). More coins are on our roadmap — follow us for updates.',
  },
];

function FAQItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className={`border-b border-[#2B2F36] last:border-0`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <span className={`text-base font-semibold transition-colors pr-6 ${open ? 'text-orange-400' : 'text-white group-hover:text-orange-400'}`}>
          {q}
        </span>
        <span className={`shrink-0 w-7 h-7 rounded-full border flex items-center justify-center transition-all ${
          open ? 'border-orange-500 bg-orange-500/10 text-orange-500 rotate-0' : 'border-[#2B2F36] text-[#848E9C] group-hover:border-orange-500/40'
        }`}>
          {open ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <p className="text-[#848E9C] text-sm leading-relaxed pb-5">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQ() {
  return (
    <section id="faq" className="py-24 relative z-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-8 bg-orange-500" />
            <span className="text-orange-500 text-sm font-semibold uppercase tracking-widest">FAQ</span>
            <div className="h-px w-8 bg-orange-500" />
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Common Questions
          </h2>
          <p className="text-[#848E9C] text-lg">
            Everything you need to know. Can&apos;t find the answer?{' '}
            <a href="mailto:support@lipabit.com" className="text-orange-400 hover:text-orange-300 transition-colors">
              Contact support.
            </a>
          </p>
        </motion.div>

        <div className="bg-[#131720] border border-[#2B2F36] rounded-2xl px-6 sm:px-8">
          {FAQS.map((faq, i) => (
            <FAQItem key={faq.q} q={faq.q} a={faq.a} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
