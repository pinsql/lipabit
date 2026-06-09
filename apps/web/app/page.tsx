import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-bitcoin rounded-full flex items-center justify-center text-white font-bold text-sm">₿</div>
          <span className="font-bold text-xl">LipaBit</span>
        </div>
        <div className="flex gap-4">
          <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 font-medium">Sign In</Link>
          <Link href="/register" className="text-sm bg-bitcoin text-white px-4 py-2 rounded-lg font-medium hover:bg-bitcoin-dark transition-colors">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-orange-50 text-bitcoin px-4 py-2 rounded-full text-sm font-medium mb-8">
          <span>🇰🇪</span> Kenya's Bitcoin Exchange
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
          Buy & Sell Bitcoin<br />
          <span className="text-bitcoin">Instantly with M-Pesa</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-xl mx-auto">
          The fastest, most secure way to exchange Bitcoin and Kenyan Shillings. No hidden fees. Real-time rates.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/register" className="bg-bitcoin text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-bitcoin-dark transition-colors shadow-lg shadow-orange-200">
            Start Trading →
          </Link>
          <Link href="/login" className="border border-gray-200 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg hover:border-gray-300">
            Sign In
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-20 grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { icon: '⚡', title: 'Instant Settlement', desc: 'M-Pesa deposits and withdrawals in under 60 seconds.' },
          { icon: '🔒', title: 'Bank-grade Security', desc: 'Encrypted wallets, 2FA, and full transaction audit trail.' },
          { icon: '💰', title: 'Best Rates', desc: 'Live Binance rates plus a transparent 2% fee. No surprises.' },
        ].map((f) => (
          <div key={f.title} className="bg-gray-50 rounded-2xl p-6">
            <div className="text-3xl mb-3">{f.icon}</div>
            <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
            <p className="text-gray-500 text-sm">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-gray-400">
        <p>© 2025 LipaBit Technologies Ltd. Registered in Kenya.</p>
        <p className="mt-1">
          <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
          {' · '}
          <Link href="/terms" className="hover:underline">Terms of Service</Link>
        </p>
      </footer>
    </main>
  );
}
