'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Rates', href: '#market' },
  { label: 'FAQ', href: '#faq' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'backdrop-blur-xl bg-[#0B0E11]/80 border-b border-white/5 shadow-xl shadow-black/20'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/30 group-hover:shadow-orange-500/50 transition-shadow">
                  <Zap className="w-4 h-4 text-white fill-white" />
                </div>
                <div className="absolute inset-0 bg-orange-500 rounded-lg blur-md opacity-40 group-hover:opacity-60 transition-opacity" />
              </div>
              <span className="font-bold text-lg tracking-tight text-white">
                Lipa<span className="text-orange-500">Bit</span>
              </span>
            </Link>

            {/* Center nav — desktop */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <NavLink key={link.label} href={link.href}>
                  {link.label}
                </NavLink>
              ))}
            </div>

            {/* Right actions — desktop */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/track"
                className="text-sm text-[#848E9C] hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/5"
              >
                Track Order
              </Link>
              <Link
                href="/login"
                className="text-sm text-[#848E9C] hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/5"
              >
                Sign In
              </Link>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href="/register"
                  className="text-sm font-semibold bg-orange-500 hover:bg-orange-400 text-white px-4 py-2 rounded-xl transition-colors shadow-lg shadow-orange-500/20"
                >
                  Get Started
                </Link>
              </motion.div>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-[#848E9C] hover:text-white transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-white/5 bg-[#0B0E11]/95 backdrop-blur-xl"
            >
              <div className="px-4 py-4 space-y-1">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-3 text-[#848E9C] hover:text-white hover:bg-white/5 rounded-xl transition-all text-sm font-medium"
                  >
                    {link.label}
                  </a>
                ))}
                <div className="pt-3 border-t border-white/5 space-y-2">
                  <Link href="/track" className="block px-4 py-3 text-[#848E9C] hover:text-white text-sm">
                    Track Order
                  </Link>
                  <Link href="/login" className="block px-4 py-3 text-[#848E9C] hover:text-white text-sm">
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="block px-4 py-3 bg-orange-500 text-white rounded-xl text-sm font-semibold text-center"
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="relative group px-4 py-2 text-sm font-medium text-[#848E9C] hover:text-white transition-colors rounded-lg hover:bg-white/5"
    >
      {children}
      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 group-hover:w-4 h-px bg-orange-500 transition-all duration-300 rounded-full" />
    </a>
  );
}
