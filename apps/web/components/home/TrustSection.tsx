'use client';

import { motion } from 'framer-motion';
import { Lock, ShieldCheck, Link2, Cpu, BarChart2, HeadphonesIcon } from 'lucide-react';

const TRUST = [
  {
    icon: Lock,
    title: 'Secure Infrastructure',
    desc: 'Military-grade encryption. All transactions processed through secure, audited pipelines.',
    color: '#F7931A',
  },
  {
    icon: ShieldCheck,
    title: 'Encrypted Transactions',
    desc: 'Every trade is end-to-end encrypted. Your funds and personal data are never exposed.',
    color: '#0ECB81',
  },
  {
    icon: Link2,
    title: 'Blockchain Verification',
    desc: 'All transfers are immutably recorded on-chain. Full transparency, every time.',
    color: '#6366F1',
  },
  {
    icon: Cpu,
    title: 'Automated Processing',
    desc: 'Smart contract logic handles every step — no humans touching your funds mid-transaction.',
    color: '#F0B90B',
  },
  {
    icon: BarChart2,
    title: '99.7% Success Rate',
    desc: "Consistently near-perfect settlement. If something goes wrong, you're refunded automatically.",
    color: '#0ECB81',
  },
  {
    icon: HeadphonesIcon,
    title: '24/7 Support',
    desc: 'Around-the-clock monitoring and human support for any issue, any time of day.',
    color: '#F6465D',
  },
];

export default function TrustSection() {
  return (
    <section className="py-24 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-8 bg-orange-500" />
            <span className="text-orange-500 text-sm font-semibold uppercase tracking-widest">Security</span>
            <div className="h-px w-8 bg-orange-500" />
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Enterprise-Grade Trust.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
              Zero Compromise.
            </span>
          </h2>
          <p className="text-[#848E9C] text-lg max-w-xl mx-auto">
            Your security is our only non-negotiable. Every system, every process is built around protecting your assets.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {TRUST.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="group relative bg-[#131720] border border-[#2B2F36] hover:border-[#363B44] rounded-2xl p-6 overflow-hidden transition-colors"
              >
                {/* Corner accent */}
                <div
                  className="absolute top-0 right-0 w-20 h-20 rounded-bl-full opacity-10 group-hover:opacity-20 transition-opacity"
                  style={{ background: item.color }}
                />

                <div className="relative flex items-start gap-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${item.color}15` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: item.color }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white mb-1.5 leading-snug">{item.title}</h3>
                    <p className="text-[#848E9C] text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
