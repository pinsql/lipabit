import type { Metadata } from 'next';
import Background from '@/components/home/Background';
import Navbar from '@/components/home/Navbar';
import Hero from '@/components/home/Hero';
import MarketSection from '@/components/home/MarketSection';
import Features from '@/components/home/Features';
import HowItWorks from '@/components/home/HowItWorks';
import Stats from '@/components/home/Stats';
import TrustSection from '@/components/home/TrustSection';
import FAQ from '@/components/home/FAQ';
import CTASection from '@/components/home/CTASection';
import Footer from '@/components/home/Footer';

export const metadata: Metadata = {
  title: 'LipaBit — Buy & Sell Bitcoin with M-Pesa in Seconds',
  description:
    "Kenya's fastest Bitcoin and Ethereum exchange. Buy and sell crypto with M-Pesa instantly. No registration required. Live rates, 1% flat fee.",
  keywords: 'bitcoin, ethereum, mpesa, kenya, crypto exchange, lipabit, buy bitcoin kenya, sell bitcoin mpesa',
  openGraph: {
    title: 'LipaBit — Buy & Sell Bitcoin with M-Pesa',
    description: 'Buy and sell Bitcoin & Ethereum with M-Pesa in seconds.',
    siteName: 'LipaBit',
  },
};

export default function HomePage() {
  return (
    <div className="relative bg-[#0B0E11] text-white min-h-screen overflow-x-hidden">
      <Background />
      <Navbar />
      <main className="relative z-10">
        <Hero />
        <MarketSection />
        <Features />
        <HowItWorks />
        <Stats />
        <TrustSection />
        <FAQ />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
