import Link from 'next/link';
import { Zap } from 'lucide-react';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative z-10 border-t border-[#1C1F26] bg-[#0B0E11]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Zap className="w-4 h-4 text-white fill-white" />
              </div>
              <span className="font-bold text-lg text-white tracking-tight">
                Lipa<span className="text-orange-500">Bit</span>
              </span>
            </div>
            <p className="text-[#848E9C] text-sm max-w-xs leading-relaxed">
              Kenya&apos;s fastest Bitcoin and Ethereum exchange. Buy and sell crypto with M-Pesa in seconds.
            </p>
            <div className="flex gap-2 mt-5">
              <div className="flex items-center gap-1.5 text-xs text-[#5A6275] bg-[#131720] border border-[#2B2F36] rounded-full px-3 py-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                All systems operational
              </div>
            </div>
          </div>

          {/* Trade */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Trade</h4>
            <ul className="space-y-3">
              {[
                { label: 'Buy Bitcoin', href: '/buy?coin=BTC' },
                { label: 'Buy Ethereum', href: '/buy?coin=ETH' },
                { label: 'Sell Bitcoin', href: '/sell?coin=BTC' },
                { label: 'Sell Ethereum', href: '/sell?coin=ETH' },
                { label: 'Track Order', href: '/track' },
              ].map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-[#848E9C] hover:text-white text-sm transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Account</h4>
            <ul className="space-y-3">
              {[
                { label: 'Sign In', href: '/login' },
                { label: 'Create Account', href: '/register' },
                { label: 'Dashboard', href: '/dashboard' },
                { label: 'Transaction History', href: '/dashboard/transactions' },
              ].map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-[#848E9C] hover:text-white text-sm transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-[#1C1F26] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[#5A6275] text-xs">
            © {year} LipaBit Technologies Ltd · Nairobi, Kenya
          </p>
          <div className="flex gap-5 text-xs text-[#5A6275]">
            <a href="#" className="hover:text-[#848E9C] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[#848E9C] transition-colors">Terms of Service</a>
            <a href="mailto:support@lipabit.com" className="hover:text-[#848E9C] transition-colors">Support</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
