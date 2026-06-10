'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { api } from '@/lib/api';

/* ------------------------------------------------------------------ */
/*  Validation schema                                                   */
/* ------------------------------------------------------------------ */

const schema = z.object({
  phone: z
    .string()
    .regex(/^\+254[0-9]{9}$/, 'Enter a valid Safaricom number (+254...)'),
});

type FormData = z.infer<typeof schema>;

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface Quote {
  amountSats: number;
  grossAmountKes: number;
  feeKes: number;
  feePercent: number;
  spreadPercent: number;
  netAmountKes: number;
  btcPriceKes: number;
  expiresAt: string;
  quoteId?: string;
}

interface WalletInfo {
  balanceSats: number;
  address?: string;
}

interface SellReceipt {
  reference: string;
  amountSats: number;
  grossAmountKes: number;
  feeKes: number;
  netAmountKes: number;
  phone: string;
  createdAt?: string;
}

type PageState = 'form' | 'confirm' | 'processing' | 'success' | 'error';
type AmountUnit = 'sats' | 'btc';

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatKes(n: number): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(n);
}

function formatSats(n: number): string {
  return new Intl.NumberFormat('en').format(n) + ' sats';
}

function satsToBtc(sats: number): string {
  return (sats / 1e8).toFixed(8);
}

function btcToSats(btc: number): number {
  return Math.round(btc * 1e8);
}

/* ------------------------------------------------------------------ */
/*  Icons                                                               */
/* ------------------------------------------------------------------ */

function BtcIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.05-1.244 15.525.362 9.105 1.962 2.67 8.475-1.243 14.9.358c6.43 1.605 10.342 8.115 8.738 14.548v-.002zm-6.35-4.613c.24-1.59-.974-2.45-2.64-3.03l.54-2.153-1.315-.33-.525 2.107c-.345-.087-.705-.167-1.064-.25l.526-2.127-1.32-.33-.54 2.165c-.285-.067-.565-.132-.84-.2l-1.815-.45-.35 1.407s.975.225.955.236c.535.136.63.486.615.766l-1.477 5.92c-.075.166-.24.406-.614.314.015.02-.96-.24-.96-.24l-.66 1.51 1.71.426.93.242-.54 2.19 1.32.327.54-2.17c.36.1.705.19 1.05.273l-.51 2.154 1.32.33.545-2.19c2.24.427 3.93.257 4.64-1.774.57-1.637-.03-2.58-1.217-3.196.854-.193 1.5-.76 1.68-1.93h.01zm-3.01 4.22c-.404 1.64-3.157.75-4.05.53l.72-2.9c.896.23 3.757.67 3.33 2.37zm.41-4.24c-.37 1.49-2.662.735-3.405.55l.654-2.64c.744.18 3.137.524 2.75 2.084v.006z" />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function WalletIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 12V8H6a2 2 0 01-2-2c0-1.1.9-2 2-2h12v4" />
      <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
      <path d="M18 12a2 2 0 000 4h4v-4h-4z" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.18 19.79 19.79 0 012 0.82a2 2 0 012-2.18h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function ShoppingBagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Quote Countdown                                                     */
/* ------------------------------------------------------------------ */

function QuoteCountdown({ expiresAt }: { expiresAt: string }) {
  const [secs, setSecs] = useState<number>(30);

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setSecs(diff);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const isExpiring = secs <= 10;

  return (
    <motion.span
      key={secs}
      initial={{ opacity: 0.6, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`font-mono font-semibold text-sm ${isExpiring ? 'text-[#F6465D]' : 'text-[#F7931A]'}`}
    >
      {secs}s
    </motion.span>
  );
}

/* ------------------------------------------------------------------ */
/*  Quote panel                                                         */
/* ------------------------------------------------------------------ */

function QuotePanel({
  quote,
  loading,
  amountSats,
}: {
  quote: Quote | null;
  loading: boolean;
  amountSats: number;
}) {
  if (loading) {
    return (
      <div className="space-y-3 py-2">
        {[70, 85, 60, 75].map((w, i) => (
          <div
            key={i}
            className="h-5 rounded-lg animate-pulse"
            style={{ width: `${w}%`, background: 'rgba(255,255,255,0.05)' }}
          />
        ))}
      </div>
    );
  }

  if (!quote || amountSats < 1000) {
    return (
      <div className="flex flex-col items-center justify-center h-44 text-center">
        <div
          className="w-12 h-12 rounded-full mb-3 flex items-center justify-center"
          style={{ background: 'rgba(247,147,26,0.08)' }}
        >
          <BtcIcon className="w-6 h-6 text-[#F7931A]" />
        </div>
        <p className="text-[#848E9C] text-sm">Enter an amount to see your KES payout</p>
        <p className="text-[#5A6275] text-xs mt-1">Minimum: 1,000 sats</p>
      </div>
    );
  }

  return (
    <motion.div
      key={`${quote.amountSats}-${quote.netAmountKes}`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
      className="space-y-1"
    >
      {/* Hero payout number */}
      <div className="py-4 text-center">
        <p className="text-[#848E9C] text-xs uppercase tracking-widest mb-1 font-medium">
          You receive
        </p>
        <p
          className="text-4xl font-bold font-mono tabular-nums"
          style={{ color: '#0ECB81', textShadow: '0 0 24px rgba(14,203,129,0.35)' }}
        >
          {formatKes(quote.netAmountKes)}
        </p>
        <p className="text-[#848E9C] text-xs mt-1">via M-Pesa</p>
      </div>

      <div className="border-t border-[#2B2F36] my-2" />

      {/* Breakdown */}
      <div className="space-y-2.5">
        <QuoteRow label="Bitcoin sold" value={formatSats(quote.amountSats)} />
        <QuoteRow label="Gross payout" value={formatKes(quote.grossAmountKes)} />
        <QuoteRow
          label={`Service fee (${quote.feePercent}%)`}
          value={`− ${formatKes(quote.feeKes)}`}
          dimValue
        />
        {quote.spreadPercent > 0 && (
          <QuoteRow
            label={`Spread (${quote.spreadPercent}%)`}
            value={`− ${formatKes(Math.round(quote.grossAmountKes * quote.spreadPercent / 100))}`}
            dimValue
          />
        )}
        <div className="border-t border-[#2B2F36] pt-2.5">
          <QuoteRow label="Net M-Pesa payout" value={formatKes(quote.netAmountKes)} bold success />
        </div>
      </div>

      <div className="border-t border-[#2B2F36] my-2" />

      {/* BTC price strip */}
      <div
        className="flex items-center justify-between px-3 py-2 rounded-lg"
        style={{ background: 'rgba(247,147,26,0.06)', border: '1px solid rgba(247,147,26,0.12)' }}
      >
        <span className="text-[#848E9C] text-xs">Sell rate used</span>
        <span className="text-[#F7931A] text-xs font-mono font-semibold">
          {new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(quote.btcPriceKes)} / BTC
        </span>
      </div>

      {/* Expiry countdown */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-[#848E9C] text-xs">Quote expires in</span>
        <QuoteCountdown expiresAt={quote.expiresAt} />
      </div>
    </motion.div>
  );
}

function QuoteRow({
  label,
  value,
  dimValue,
  bold,
  success,
}: {
  label: string;
  value: string;
  dimValue?: boolean;
  bold?: boolean;
  success?: boolean;
}) {
  const valueColor = success ? '#0ECB81' : bold ? '#EAECEF' : dimValue ? '#848E9C' : '#EAECEF';
  return (
    <div className="flex items-center justify-between">
      <span className="text-[#848E9C] text-sm">{label}</span>
      <span
        className={`text-sm font-mono tabular-nums ${bold ? 'font-bold' : 'font-medium'}`}
        style={{ color: valueColor }}
      >
        {value}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Confirmation Modal                                                  */
/* ------------------------------------------------------------------ */

function ConfirmModal({
  quote,
  phone,
  amountSats,
  onConfirm,
  onCancel,
  loading,
}: {
  quote: Quote;
  phone: string;
  amountSats: number;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ duration: 0.28, ease: [0.34, 1.2, 0.64, 1] }}
        className="w-full max-w-sm rounded-3xl p-7"
        style={{
          background: '#1C1F26',
          border: '1px solid #2B2F36',
          boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-[#EAECEF]">Confirm Sale</h3>
            <p className="text-[#848E9C] text-sm mt-0.5">Review your order before proceeding</p>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)', color: '#848E9C' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)'; }}
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Order summary */}
        <div
          className="rounded-2xl p-4 space-y-3 mb-5"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #2B2F36' }}
        >
          <ModalRow label="Selling" value={formatSats(amountSats)} mono />
          <ModalRow label="Gross payout" value={formatKes(quote.grossAmountKes)} />
          <ModalRow label={`Fee (${quote.feePercent}%)`} value={`− ${formatKes(quote.feeKes)}`} dim />
          <div className="border-t border-[#2B2F36] pt-3">
            <ModalRow
              label="You receive"
              value={formatKes(quote.netAmountKes)}
              highlight="success"
              bold
            />
          </div>
          <div className="border-t border-[#2B2F36] pt-3">
            <ModalRow label="M-Pesa number" value={phone} mono />
          </div>
        </div>

        {/* Warning */}
        <div
          className="flex items-start gap-2.5 rounded-xl px-3.5 py-3 mb-5"
          style={{ background: 'rgba(246,70,93,0.07)', border: '1px solid rgba(246,70,93,0.18)' }}
        >
          <AlertIcon className="w-4 h-4 text-[#F6465D] flex-shrink-0 mt-0.5" />
          <p className="text-[#848E9C] text-xs leading-relaxed">
            This action is <span className="text-[#F6465D] font-medium">irreversible</span>. Bitcoin will be deducted from your wallet immediately and KES sent to your M-Pesa.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
            style={{
              background: 'rgba(255,255,255,0.05)',
              color: '#848E9C',
              border: '1px solid #2B2F36',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            style={{
              background: loading
                ? 'rgba(246,70,93,0.5)'
                : 'linear-gradient(135deg, #ff6b7f 0%, #F6465D 50%, #d93550 100%)',
              color: '#fff',
              boxShadow: loading ? 'none' : '0 4px 20px rgba(246,70,93,0.45)',
            }}
          >
            {loading ? (
              <>
                <SpinnerIcon className="w-4 h-4 animate-spin" />
                Selling...
              </>
            ) : (
              'Confirm Sell'
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ModalRow({
  label,
  value,
  mono,
  dim,
  bold,
  highlight,
}: {
  label: string;
  value: string;
  mono?: boolean;
  dim?: boolean;
  bold?: boolean;
  highlight?: 'success' | 'brand';
}) {
  const valueColor =
    highlight === 'success' ? '#0ECB81' :
    highlight === 'brand' ? '#F7931A' :
    dim ? '#848E9C' :
    '#EAECEF';
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[#848E9C] text-sm">{label}</span>
      <span
        className={`text-sm ${bold ? 'font-bold' : 'font-medium'} ${mono ? 'font-mono' : ''}`}
        style={{ color: valueColor }}
      >
        {value}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Processing State                                                    */
/* ------------------------------------------------------------------ */

function ProcessingState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
      className="flex flex-col items-center justify-center py-12 text-center"
    >
      {/* Animated rings */}
      <div className="relative flex items-center justify-center mb-8">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 56 + i * 28,
              height: 56 + i * 28,
              border: '1px solid rgba(246,70,93,0.4)',
            }}
            animate={{ opacity: [0.6, 0, 0.6], scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.4, ease: 'easeInOut' }}
          />
        ))}
        <div
          className="relative z-10 w-16 h-16 rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #ff6b7f 0%, #F6465D 50%, #d93550 100%)',
            boxShadow: '0 0 32px rgba(246,70,93,0.6), 0 0 64px rgba(246,70,93,0.25)',
          }}
        >
          <PhoneIcon className="w-7 h-7 text-white" />
        </div>
      </div>

      <h2 className="text-xl font-bold text-[#EAECEF] mb-2">Initiating M-Pesa payout...</h2>
      <p className="text-[#848E9C] text-sm max-w-xs leading-relaxed">
        Your Bitcoin is being sold. M-Pesa funds will be sent to your number shortly.
      </p>

      <motion.div
        animate={{ opacity: [1, 0.4, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        className="mt-6 flex items-center gap-2 text-[#848E9C] text-xs"
      >
        <SpinnerIcon className="w-3.5 h-3.5 animate-spin" />
        Processing your sale...
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Success State                                                       */
/* ------------------------------------------------------------------ */

function SuccessState({ receipt, onReset }: { receipt: SellReceipt; onReset: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
      className="flex flex-col items-center justify-center py-8 text-center"
    >
      {/* Animated checkmark */}
      <div className="relative mb-6">
        <svg width="80" height="80" viewBox="0 0 80 80">
          <motion.circle
            cx="40" cy="40" r="36"
            fill="none" stroke="#0ECB81" strokeWidth="3" strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
          />
          <motion.path
            d="M24 41 L34 51 L56 29"
            fill="none" stroke="#0ECB81" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.45, delay: 0.55, ease: 'easeOut' }}
          />
        </svg>
        <div
          className="absolute inset-0 rounded-full"
          style={{ boxShadow: '0 0 32px rgba(14,203,129,0.4), 0 0 64px rgba(14,203,129,0.15)' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.3 }}
        className="w-full"
      >
        <h2 className="text-2xl font-bold text-[#EAECEF] mb-1">Sale complete!</h2>
        <p className="text-[#848E9C] text-sm mb-6">
          KES is on its way to your M-Pesa. Usually arrives in under 2 minutes.
        </p>

        {/* Receipt card */}
        <div
          className="w-full text-left rounded-2xl p-5 space-y-3 mb-6"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid #2B2F36',
          }}
        >
          <ReceiptRow label="Reference" value={receipt.reference} mono />
          <div className="border-t border-[#2B2F36]" />
          <ReceiptRow label="Bitcoin sold" value={formatSats(receipt.amountSats)} />
          <ReceiptRow label="Gross amount" value={formatKes(receipt.grossAmountKes)} />
          <ReceiptRow label="Fee deducted" value={`− ${formatKes(receipt.feeKes)}`} dim />
          <div className="border-t border-[#2B2F36]" />
          <ReceiptRow label="KES payout" value={formatKes(receipt.netAmountKes)} highlight="success" bold />
          <ReceiptRow label="Sent to" value={receipt.phone} mono />
          {receipt.createdAt && (
            <ReceiptRow label="Time" value={new Date(receipt.createdAt).toLocaleString('en-KE')} />
          )}
        </div>

        <button
          onClick={onReset}
          className="w-full py-3 rounded-xl text-sm font-semibold transition-colors"
          style={{
            background: 'rgba(247,147,26,0.1)',
            color: '#F7931A',
            border: '1px solid rgba(247,147,26,0.2)',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(247,147,26,0.18)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(247,147,26,0.1)'; }}
        >
          Make another sale
        </button>
      </motion.div>
    </motion.div>
  );
}

function ReceiptRow({
  label,
  value,
  mono,
  dim,
  bold,
  highlight,
}: {
  label: string;
  value: string;
  mono?: boolean;
  dim?: boolean;
  bold?: boolean;
  highlight?: 'success' | 'brand';
}) {
  const valueColor =
    highlight === 'success' ? '#0ECB81' :
    highlight === 'brand' ? '#F7931A' :
    dim ? '#848E9C' :
    '#EAECEF';
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[#848E9C] text-sm">{label}</span>
      <span
        className={`text-sm ${bold ? 'font-bold' : 'font-medium'} ${mono ? 'font-mono truncate max-w-[160px]' : ''}`}
        style={{ color: valueColor }}
      >
        {value}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty State (zero balance)                                          */
/* ------------------------------------------------------------------ */

function EmptyBalanceState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.2, 0, 0, 1] }}
      className="flex flex-col items-center justify-center py-16 text-center max-w-sm mx-auto"
    >
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
        style={{
          background: 'linear-gradient(135deg, rgba(247,147,26,0.15) 0%, rgba(247,147,26,0.05) 100%)',
          border: '1px solid rgba(247,147,26,0.2)',
        }}
      >
        <WalletIcon className="w-9 h-9 text-[#F7931A]" />
      </div>

      <h2 className="text-2xl font-bold text-[#EAECEF] mb-2">No Bitcoin to sell</h2>
      <p className="text-[#848E9C] text-sm leading-relaxed mb-8">
        Your wallet is empty. Buy some Bitcoin first, then come back to sell it for KES via M-Pesa.
      </p>

      <Link
        href="/buy"
        className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm transition-all active:scale-[0.98]"
        style={{
          background: 'linear-gradient(135deg, #FF9A24 0%, #F7931A 50%, #E07800 100%)',
          color: '#0B0E11',
          boxShadow: '0 4px 20px rgba(247,147,26,0.45)',
        }}
      >
        <ShoppingBagIcon className="w-4 h-4" />
        Buy Bitcoin first
        <ChevronRightIcon className="w-4 h-4" />
      </Link>

      <p className="mt-5 text-[#5A6275] text-xs">
        Pay with M-Pesa · Bitcoin delivered instantly
      </p>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Balance Banner                                                      */
/* ------------------------------------------------------------------ */

function BalanceBanner({
  balanceSats,
  balanceKes,
  loading,
}: {
  balanceSats: number;
  balanceKes: number | null;
  loading: boolean;
}) {
  return (
    <div
      className="rounded-2xl p-5 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #1C1F26 0%, #181B22 100%)',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      {/* Glow blob */}
      <div
        className="absolute -top-10 -right-10 w-36 h-36 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(247,147,26,0.1) 0%, transparent 70%)' }}
      />

      <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold flex-shrink-0"
            style={{ background: 'rgba(247,147,26,0.15)', color: '#F7931A' }}
          >
            ₿
          </div>
          <div>
            <p className="text-[#848E9C] text-xs font-medium uppercase tracking-wider">
              Available BTC balance
            </p>
            {loading ? (
              <div
                className="h-6 w-36 rounded-lg mt-1 animate-pulse"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              />
            ) : (
              <div className="flex items-baseline gap-2 mt-0.5 flex-wrap">
                <span
                  className="text-2xl font-bold font-mono tabular-nums"
                  style={{ color: '#EAECEF', letterSpacing: '-0.02em' }}
                >
                  {balanceSats.toLocaleString()}
                  <span className="text-sm font-normal text-[#848E9C] ml-1">sats</span>
                </span>
                <span className="text-[#848E9C] text-xs font-mono">
                  {satsToBtc(balanceSats)} BTC
                </span>
              </div>
            )}
          </div>
        </div>

        {!loading && balanceKes !== null && (
          <div className="text-right">
            <p className="text-[#5A6275] text-xs">≈ KES value</p>
            <p className="text-[#EAECEF] font-bold text-lg font-mono mt-0.5">
              {formatKes(balanceKes)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page component                                                 */
/* ------------------------------------------------------------------ */

export default function SellPage() {
  const [pageState, setPageState] = useState<PageState>('form');
  const [amountUnit, setAmountUnit] = useState<AmountUnit>('sats');
  const [rawInput, setRawInput] = useState('');
  const [displayInput, setDisplayInput] = useState('');
  const [amountSats, setAmountSats] = useState(0);

  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [receipt, setReceipt] = useState<SellReceipt | null>(null);

  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [sellRate, setSellRate] = useState<number | null>(null);

  const quoteDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { phone: '' },
  });

  const phone = watch('phone');

  /* Fetch wallet balance + sell rate on mount */
  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const { data } = await api.get<{ wallet: WalletInfo } | WalletInfo>('/users/me');
        const wallet = (data as any).wallet ?? data;
        setWalletInfo({
          balanceSats: parseInt(String(wallet.balanceSats ?? 0), 10),
          address: wallet.address,
        });
      } catch {
        setWalletInfo({ balanceSats: 0 });
      } finally {
        setWalletLoading(false);
      }
    };

    const fetchRate = async () => {
      try {
        const { data } = await api.get<{ sellRateKes: number }>('/trading/rate');
        setSellRate(data.sellRateKes ?? null);
      } catch {
        // silently ignore
      }
    };

    fetchWallet();
    fetchRate();
  }, []);

  const balanceSats = walletInfo?.balanceSats ?? 0;
  const balanceKes = sellRate && walletInfo ? (balanceSats / 1e8) * sellRate : null;

  /* Fetch quote (debounced) */
  const fetchQuote = useCallback((sats: number) => {
    if (quoteDebounceRef.current) clearTimeout(quoteDebounceRef.current);
    if (!sats || sats < 1000) {
      setQuote(null);
      return;
    }
    quoteDebounceRef.current = setTimeout(async () => {
      setQuoteLoading(true);
      try {
        // The API quote endpoint takes amountKes — calculate rough kes from sats
        // We pass amountSats if supported, else derive KES from sell rate
        const kesAmount = sellRate ? Math.round((sats / 1e8) * sellRate) : sats;
        const { data } = await api.get<Quote>(
          `/trading/quote?type=SELL_BTC&amountKes=${kesAmount}`,
        );
        // Normalise response: some backends return different field names
        const normalised: Quote = {
          amountSats: data.amountSats ?? sats,
          grossAmountKes: (data as any).grossAmountKes ?? data.grossAmountKes ?? kesAmount,
          feeKes: data.feeKes ?? 0,
          feePercent: data.feePercent ?? 1,
          spreadPercent: data.spreadPercent ?? 0,
          netAmountKes: data.netAmountKes ?? (data as any).netKes ?? kesAmount,
          btcPriceKes: data.btcPriceKes ?? sellRate ?? 0,
          expiresAt: data.expiresAt ?? new Date(Date.now() + 30_000).toISOString(),
          quoteId: data.quoteId,
        };
        setQuote(normalised);
      } catch {
        // silently ignore stale/network errors
      } finally {
        setQuoteLoading(false);
      }
    }, 500);
  }, [sellRate]);

  /* Handle amount input */
  const handleAmountInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9.]/g, '');
    setRawInput(raw);

    if (amountUnit === 'sats') {
      const num = parseInt(raw, 10);
      const formatted = raw && !isNaN(num) ? new Intl.NumberFormat('en').format(num) : raw;
      setDisplayInput(formatted);
      const sats = isNaN(num) ? 0 : num;
      setAmountSats(sats);
      fetchQuote(sats);
    } else {
      // BTC input
      setDisplayInput(raw);
      const btcNum = parseFloat(raw);
      const sats = isNaN(btcNum) ? 0 : btcToSats(btcNum);
      setAmountSats(sats);
      fetchQuote(sats);
    }
  };

  /* Sell Max */
  const handleSellMax = () => {
    if (!balanceSats) return;
    if (amountUnit === 'sats') {
      const formatted = new Intl.NumberFormat('en').format(balanceSats);
      setRawInput(String(balanceSats));
      setDisplayInput(formatted);
    } else {
      const btc = satsToBtc(balanceSats);
      setRawInput(btc);
      setDisplayInput(btc);
    }
    setAmountSats(balanceSats);
    fetchQuote(balanceSats);
  };

  /* Toggle unit */
  const handleToggleUnit = (unit: AmountUnit) => {
    if (unit === amountUnit) return;
    setAmountUnit(unit);
    // Convert current value
    if (unit === 'btc' && amountSats > 0) {
      const btc = satsToBtc(amountSats);
      setRawInput(btc);
      setDisplayInput(btc);
    } else if (unit === 'sats' && amountSats > 0) {
      const formatted = new Intl.NumberFormat('en').format(amountSats);
      setRawInput(String(amountSats));
      setDisplayInput(formatted);
    } else {
      setRawInput('');
      setDisplayInput('');
    }
  };

  /* Proceed to confirmation */
  const openConfirm = handleSubmit(() => {
    if (amountSats < 1000) return;
    if (!quote) return;
    if (amountSats > balanceSats) return;
    setPageState('confirm');
  });

  /* Execute sell */
  const executeSell = async () => {
    setSubmitLoading(true);
    setErrorMsg('');
    setPageState('processing');
    try {
      const { data: tx } = await api.post<SellReceipt>('/trading/sell', {
        amountSats,
        phone,
        quoteId: quote?.quoteId,
      });
      const normalised: SellReceipt = {
        reference: tx.reference,
        amountSats: tx.amountSats ?? amountSats,
        grossAmountKes: tx.grossAmountKes ?? quote?.grossAmountKes ?? 0,
        feeKes: tx.feeKes ?? quote?.feeKes ?? 0,
        netAmountKes: tx.netAmountKes ?? quote?.netAmountKes ?? 0,
        phone: tx.phone ?? phone,
        createdAt: (tx as any).createdAt,
      };
      setReceipt(normalised);
      setPageState('success');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr?.response?.data?.message || 'Failed to initiate sale. Please try again.';
      setErrorMsg(msg);
      setPageState('error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const resetPage = () => {
    setPageState('form');
    setReceipt(null);
    setErrorMsg('');
    setRawInput('');
    setDisplayInput('');
    setAmountSats(0);
    setQuote(null);
    setValue('phone', '');
  };

  const insufficientBalance = amountSats > 0 && amountSats > balanceSats;

  /* ---------------------------------------------------------------- */
  /*  Processing state                                                  */
  /* ---------------------------------------------------------------- */
  if (pageState === 'processing') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div
          className="w-full max-w-sm rounded-3xl p-8"
          style={{
            background: '#1C1F26',
            border: '1px solid #2B2F36',
            boxShadow: '0 8px 24px rgba(0,0,0,0.55)',
          }}
        >
          <ProcessingState />
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Success state                                                     */
  /* ---------------------------------------------------------------- */
  if (pageState === 'success' && receipt) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div
          className="w-full max-w-sm rounded-3xl p-8"
          style={{
            background: '#1C1F26',
            border: '1px solid #2B2F36',
            boxShadow: '0 8px 24px rgba(0,0,0,0.55)',
          }}
        >
          <SuccessState receipt={receipt} onReset={resetPage} />
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Empty state (zero balance, not loading)                          */
  /* ---------------------------------------------------------------- */
  if (!walletLoading && balanceSats === 0) {
    return (
      <div>
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#EAECEF]">Sell Bitcoin</h1>
          <p className="text-[#848E9C] text-sm mt-1">
            Convert your Bitcoin to KES — receive instantly via M-Pesa
          </p>
        </div>
        <EmptyBalanceState />
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Main form                                                         */
  /* ---------------------------------------------------------------- */
  return (
    <>
      {/* Confirmation Modal */}
      <AnimatePresence>
        {pageState === 'confirm' && quote && (
          <ConfirmModal
            quote={quote}
            phone={phone}
            amountSats={amountSats}
            onConfirm={executeSell}
            onCancel={() => setPageState('form')}
            loading={submitLoading}
          />
        )}
      </AnimatePresence>

      <div className="space-y-5 pb-10">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-[#EAECEF]">Sell Bitcoin</h1>
            <p className="text-[#848E9C] text-sm mt-1">
              Convert your Bitcoin to KES — receive instantly via M-Pesa
            </p>
          </div>

          {/* Live dot */}
          <div className="flex items-center gap-1.5 text-xs text-[#848E9C]">
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              className="w-2 h-2 rounded-full"
              style={{ background: '#0ECB81', boxShadow: '0 0 6px rgba(14,203,129,0.7)' }}
            />
            Live rates
          </div>
        </div>

        {/* Balance Banner */}
        <BalanceBanner
          balanceSats={balanceSats}
          balanceKes={balanceKes}
          loading={walletLoading}
        />

        {/* Error banner */}
        <AnimatePresence>
          {pageState === 'error' && errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -4, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -4, height: 0 }}
              className="flex items-start gap-3 rounded-xl px-4 py-3"
              style={{
                background: 'rgba(246,70,93,0.08)',
                border: '1px solid rgba(246,70,93,0.25)',
              }}
            >
              <AlertIcon className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#F6465D]" />
              <div className="flex-1">
                <p className="text-[#F6465D] text-sm font-medium">Transaction failed</p>
                <p className="text-[#848E9C] text-xs mt-0.5">{errorMsg}</p>
              </div>
              <button
                onClick={() => setPageState('form')}
                className="text-[#848E9C] hover:text-[#EAECEF] text-xs transition-colors ml-auto"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* -------------------------------------------------------- */}
          {/* LEFT — Sell form                                          */}
          {/* -------------------------------------------------------- */}
          <div
            className="rounded-2xl p-6"
            style={{
              background: '#1C1F26',
              border: '1px solid #2B2F36',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
          >
            {/* Card header */}
            <div className="flex items-center gap-2 mb-5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(246,70,93,0.12)' }}
              >
                <svg className="w-4 h-4 text-[#F6465D]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="18 15 12 9 6 15" />
                </svg>
              </div>
              <h2 className="font-semibold text-[#EAECEF] text-base">Sell Order</h2>
            </div>

            <form onSubmit={openConfirm} className="space-y-5" noValidate>
              {/* Amount label row */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[#848E9C] text-xs font-medium uppercase tracking-wider">
                    Amount to sell
                  </label>

                  {/* Unit toggle */}
                  <div
                    className="flex rounded-lg p-0.5 gap-0.5"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #2B2F36' }}
                  >
                    {(['sats', 'btc'] as AmountUnit[]).map((unit) => (
                      <button
                        key={unit}
                        type="button"
                        onClick={() => handleToggleUnit(unit)}
                        className="px-3 py-1 rounded-md text-xs font-semibold transition-all duration-150"
                        style={{
                          background: amountUnit === unit ? 'rgba(247,147,26,0.15)' : 'transparent',
                          color: amountUnit === unit ? '#F7931A' : '#848E9C',
                          border: amountUnit === unit ? '1px solid rgba(247,147,26,0.3)' : '1px solid transparent',
                        }}
                      >
                        {unit.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount input */}
                <div
                  className="relative rounded-xl transition-all duration-200"
                  style={{
                    background: '#131720',
                    border: `1px solid ${
                      insufficientBalance ? '#F6465D' : amountSats > 0 && amountSats >= 1000 ? 'rgba(247,147,26,0.4)' : '#363B44'
                    }`,
                    boxShadow: amountSats > 0 && amountSats >= 1000 && !insufficientBalance
                      ? '0 0 0 3px rgba(247,147,26,0.08)'
                      : 'none',
                  }}
                >
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#848E9C] text-sm font-medium pointer-events-none select-none">
                    {amountUnit === 'sats' ? 'SATS' : 'BTC'}
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={displayInput}
                    onChange={handleAmountInput}
                    placeholder={amountUnit === 'sats' ? '0' : '0.00000000'}
                    className="w-full pl-16 pr-28 py-4 text-3xl font-bold font-mono tabular-nums bg-transparent focus:outline-none"
                    style={{
                      color: displayInput ? '#EAECEF' : '#5A6275',
                      caretColor: '#F7931A',
                    }}
                  />

                  {/* Sell Max button */}
                  <button
                    type="button"
                    onClick={handleSellMax}
                    disabled={!balanceSats}
                    className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: 'rgba(247,147,26,0.12)',
                      color: '#F7931A',
                      border: '1px solid rgba(247,147,26,0.25)',
                    }}
                    onMouseEnter={(e) => { if (balanceSats) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(247,147,26,0.2)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(247,147,26,0.12)'; }}
                  >
                    Sell max
                  </button>
                </div>

                {/* Validation messages */}
                {insufficientBalance && (
                  <motion.p
                    initial={{ opacity: 0, y: -2 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[#F6465D] text-xs mt-1.5 flex items-center gap-1"
                  >
                    <AlertIcon className="w-3 h-3 flex-shrink-0" />
                    Insufficient balance. You have {balanceSats.toLocaleString()} sats.
                  </motion.p>
                )}
                {!insufficientBalance && amountSats > 0 && amountSats < 1000 && (
                  <motion.p
                    initial={{ opacity: 0, y: -2 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[#F6465D] text-xs mt-1.5 flex items-center gap-1"
                  >
                    <AlertIcon className="w-3 h-3 flex-shrink-0" />
                    Minimum is 1,000 sats
                  </motion.p>
                )}
                {amountSats > 0 && amountUnit === 'sats' && !insufficientBalance && amountSats >= 1000 && (
                  <p className="text-[#5A6275] text-xs mt-1.5 font-mono">
                    ≈ {satsToBtc(amountSats)} BTC
                  </p>
                )}
                {amountSats > 0 && amountUnit === 'btc' && !insufficientBalance && amountSats >= 1000 && (
                  <p className="text-[#5A6275] text-xs mt-1.5 font-mono">
                    = {amountSats.toLocaleString()} sats
                  </p>
                )}
              </div>

              {/* M-Pesa phone input */}
              <div>
                <label className="block text-[#848E9C] text-xs font-medium uppercase tracking-wider mb-2">
                  M-Pesa Payout Number
                </label>
                <div
                  className="relative rounded-xl transition-all duration-200"
                  style={{
                    background: '#131720',
                    border: `1px solid ${errors.phone ? '#F6465D' : '#363B44'}`,
                  }}
                >
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                    <span className="text-base leading-none" role="img" aria-label="Kenya flag">
                      🇰🇪
                    </span>
                    <span className="text-[#848E9C] text-sm font-mono">+254</span>
                    <span className="text-[#363B44] text-sm">|</span>
                  </div>
                  <input
                    type="tel"
                    placeholder="7XX XXX XXX"
                    {...register('phone')}
                    className="w-full pl-24 pr-4 py-3.5 text-sm font-mono bg-transparent focus:outline-none text-[#EAECEF] placeholder:text-[#5A6275]"
                    style={{ caretColor: '#F7931A' }}
                  />
                </div>
                {errors.phone && (
                  <motion.p
                    initial={{ opacity: 0, y: -2 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[#F6465D] text-xs mt-1.5 flex items-center gap-1"
                  >
                    <AlertIcon className="w-3 h-3 flex-shrink-0" />
                    {errors.phone.message}
                  </motion.p>
                )}
                <p className="text-[#5A6275] text-xs mt-1.5">
                  KES will be sent to this M-Pesa number (e.g. 0712 345 678)
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={
                  !amountSats ||
                  amountSats < 1000 ||
                  insufficientBalance ||
                  !quote
                }
                className="w-full py-4 rounded-xl font-bold text-base transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #ff6b7f 0%, #F6465D 50%, #d93550 100%)',
                  color: '#fff',
                  boxShadow: (!amountSats || amountSats < 1000 || insufficientBalance || !quote)
                    ? 'none'
                    : '0 4px 20px rgba(246,70,93,0.45)',
                }}
                onMouseEnter={(e) => {
                  const btn = e.currentTarget as HTMLButtonElement;
                  if (!btn.disabled) btn.style.boxShadow = '0 6px 28px rgba(246,70,93,0.6)';
                }}
                onMouseLeave={(e) => {
                  const btn = e.currentTarget as HTMLButtonElement;
                  if (!btn.disabled) btn.style.boxShadow = '0 4px 20px rgba(246,70,93,0.45)';
                }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="18 15 12 9 6 15" />
                </svg>
                Review &amp; Sell
                <span className="ml-0.5">→</span>
              </button>

              <p className="text-center text-[#5A6275] text-xs">
                Instant M-Pesa payout · Min 1,000 sats · Secured transaction
              </p>
            </form>
          </div>

          {/* -------------------------------------------------------- */}
          {/* RIGHT — Live quote panel                                  */}
          {/* -------------------------------------------------------- */}
          <div
            className="rounded-2xl p-6 flex flex-col"
            style={{
              background: '#1C1F26',
              border: '1px solid #2B2F36',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
          >
            {/* Panel header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(14,203,129,0.12)' }}
                >
                  <svg className="w-4 h-4 text-[#0ECB81]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                  </svg>
                </div>
                <h2 className="font-semibold text-[#EAECEF] text-base">Live Payout Quote</h2>
              </div>

              {/* Live dot */}
              <div className="flex items-center gap-1.5">
                <motion.div
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-2 h-2 rounded-full bg-[#0ECB81]"
                  style={{ boxShadow: '0 0 6px rgba(14,203,129,0.7)' }}
                />
                <span className="text-[#0ECB81] text-xs font-medium">Live</span>
              </div>
            </div>

            {/* Quote content */}
            <div className="flex-1">
              <QuotePanel quote={quote} loading={quoteLoading} amountSats={amountSats} />
            </div>

            {/* Bottom note */}
            {quote && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-[#5A6275] text-xs mt-5 pt-4 border-t border-[#2B2F36]"
              >
                Quotes are indicative and valid for 30 seconds. Final rate locked at execution.
              </motion.p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
