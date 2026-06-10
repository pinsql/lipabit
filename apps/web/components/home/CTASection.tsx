'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Search } from 'lucide-react';

export default function CTASection() {
  return (
    <section className="py-24 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden bg-gradient-to-br from-[#1a110a] via-[#13100A] to-[#0B0E11] border border-orange-500/20 rounded-3xl px-8 sm:px-14 py-16 sm:py-20 text-center"
        >
          {/* Background glows */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-orange-500/15 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/10 rounded-full -translate-x-1/2 translate-y-1/2 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl" />

          {/* Animated border */}
          <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/60 to-transparent" />
          </div>

          <div className="relative">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-1.5 text-orange-400 text-sm font-semibold mb-6"
            >
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
              Start Trading Today
            </motion.div>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-5 leading-tight">
              Ready to trade crypto
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600">
                the Kenyan way?
              </span>
            </h2>

            <p className="text-[#848E9C] text-lg mb-10 max-w-lg mx-auto">
              Join thousands of Kenyans who buy and sell Bitcoin with M-Pesa every day.
              No fees to start. No registration required.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href="/buy"
                  className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold px-8 py-4 rounded-xl text-base shadow-2xl shadow-orange-500/30 transition-colors"
                >
                  Buy Crypto
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href="/sell"
                  className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-bold px-8 py-4 rounded-xl text-base transition-colors backdrop-blur-sm"
                >
                  Sell Crypto
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href="/track"
                  className="inline-flex items-center gap-2 text-[#848E9C] hover:text-white font-semibold px-6 py-4 rounded-xl text-base transition-colors"
                >
                  <Search className="w-4 h-4" />
                  Track Order
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
