'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: '🏠' },
  { href: '/buy', label: 'Buy BTC', icon: '⬇️' },
  { href: '/sell', label: 'Sell BTC', icon: '⬆️' },
  { href: '/transactions', label: 'History', icon: '📋' },
  { href: '/profile', label: 'Profile', icon: '👤' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = async () => {
    clearAuth();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r flex flex-col min-h-screen">
        <div className="p-5 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-bitcoin rounded-full flex items-center justify-center text-white font-bold text-sm">₿</div>
            <span className="font-bold text-lg">LipaBit</span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === item.href
                  ? 'bg-orange-50 text-bitcoin'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 bg-bitcoin/10 rounded-full flex items-center justify-center text-bitcoin text-xs font-bold">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
