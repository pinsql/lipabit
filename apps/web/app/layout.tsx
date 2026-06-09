import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LipaBit — Buy & Sell Bitcoin in Kenya',
  description: 'The fastest way to buy and sell Bitcoin with M-Pesa in Kenya.',
  keywords: 'bitcoin, mpesa, kenya, crypto, exchange, lipabit',
  openGraph: {
    title: 'LipaBit',
    description: 'Bitcoin ↔ M-Pesa Exchange',
    siteName: 'LipaBit',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground antialiased">{children}</body>
    </html>
  );
}
