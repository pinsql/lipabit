'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';

/* ------------------------------------------------------------------ */
/*  Validation schema                                                   */
/* ------------------------------------------------------------------ */

const schema = z.object({
  amountKes: z
    .number({ invalid_type_error: 'Enter an amount' })
    .min(500, 'Minimum is KES 500')
    .max(500_000, 'Maximum is KES 500,000'),
  phone: z
    .string()
    .regex(/^\+254[0-9]{9}$/, 'Enter a valid Safaricom number (+254...)'),
});

type FormData = z.infer<typeof schema>;

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface Quote {
  amountKes: number;
  feeKes: number;
  feePercent: number;
  spreadPercent: number;
  netKes: number;
  amountSats: number;
  btcPriceKes: number;
  expiresAt: string; // ISO timestamp
  quoteId?: string;
}

interface PendingTx {
  reference: string;
  amountKes: number;
  amountSats: number;
  phone: string;
}

type PageState = 'form' | 'processing' | 'success' | 'error';

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

function formatBtcRate(n: number): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(n);
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                      */
/* ------------------------------------------------------------------ */

// Pulsing phone icon for STK push state
function StkPushAnimation({ phone }: { phone: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
      className="flex flex-col items-center justify-center py-10 text-center"
    >
      {/* Pulse rings */}
      <div className="relative flex items-center justify-center mb-8">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-[#F7931A]"
            style={{ width: 56 + i * 28, height: 56 + i * 28 }}
            animate={{ opacity: [0.6, 0, 0.6], scale: [1, 1.05, 1] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.4,
              ease: 'easeInOut',
            }}
          />
        ))}
        {/* Phone icon circle */}
        <div
          className="relative z-10 w-16 h-16 rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #FF9A24 0%, #F7931A 50%, #E07800 100%)',
            boxShadow: '0 0 32px rgba(247,147,26,0.6), 0 0 64px rgba(247,147,26,0.25)',
          }}
        >
          <PhoneIcon className="w-7 h-7 text-[#0B0E11]" />
        </div>
      </div>

      <h2 className="text-xl font-bold text-[#EAECEF] mb-2">Check your phone</h2>
      <p className="text-[#848E9C] text-sm max-w-xs leading-relaxed">
        An M-Pesa STK push has been sent to{' '}
        <span className="text-[#F7931A] font-medium font-mono">{phone}</span>. Enter your
        M-Pesa PIN to complete the purchase.
      </p>

      <motion.div
        animate={{ opacity: [1, 0.4, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        className="mt-6 flex items-center gap-2 text-[#848E9C] text-xs"
      >
        <SpinnerIcon className="w-3.5 h-3.5 animate-spin" />
        Waiting for payment confirmation...
      </motion.div>
    </motion.div>
  );
}

// Animated checkmark for success
function SuccessState({ tx, onReset }: { tx: PendingTx; onReset: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
      className="flex flex-col items-center justify-center py-8 text-center"
    >
      {/* Checkmark SVG circle */}
      <div className="relative mb-6">
        <svg width="80" height="80" viewBox="0 0 80 80">
          <motion.circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke="#0ECB81"
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
          />
          <motion.path
            d="M24 41 L34 51 L56 29"
            fill="none"
            stroke="#0ECB81"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
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
      >
        <h2 className="text-2xl font-bold text-[#EAECEF] mb-1">Purchase complete!</h2>
        <p className="text-[#848E9C] text-sm mb-6">
          Bitcoin is on its way to your wallet.
        </p>

        {/* Transaction detail card */}
        <div
          className="w-full text-left rounded-2xl p-5 space-y-3 mb-6"
          style={{
            background: '#1C1F26',
            border: '1px solid #2B2F36',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          }}
        >
          <TxRow label="Reference" value={tx.reference} mono />
          <div className="border-t border-[#2B2F36]" />
          <TxRow label="Amount paid" value={formatKes(tx.amountKes)} highlight="brand" />
          <TxRow label="Bitcoin received" value={formatSats(tx.amountSats)} highlight="success" />
          <TxRow label="Sent to" value={tx.phone} mono />
        </div>

        <button
          onClick={onReset}
          className="w-full py-3 rounded-xl text-sm font-semibold transition-colors"
          style={{
            background: 'rgba(247,147,26,0.1)',
            color: '#F7931A',
            border: '1px solid rgba(247,147,26,0.2)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(247,147,26,0.18)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(247,147,26,0.1)';
          }}
        >
          Make another purchase
        </button>
      </motion.div>
    </motion.div>
  );
}

function TxRow({
  label,
  value,
  mono,
  highlight,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: 'brand' | 'success';
}) {
  const valueColor =
    highlight === 'brand'
      ? '#F7931A'
      : highlight === 'success'
      ? '#0ECB81'
      : '#EAECEF';
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[#848E9C] text-sm">{label}</span>
      <span
        className={`text-sm font-semibold ${mono ? 'font-mono' : ''}`}
        style={{ color: valueColor }}
      >
        {value}
      </span>
    </div>
  );
}

// Quote countdown
function QuoteCountdown({ expiresAt }: { expiresAt: string }) {
  const [secs, setSecs] = useState<number>(0);

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
      className={`font-mono font-semibold ${isExpiring ? 'text-[#F6465D]' : 'text-[#F7931A]'}`}
    >
      {secs}s
    </motion.span>
  );
}

// Live quote panel
function QuotePanel({
  quote,
  loading,
  amount,
}: {
  quote: Quote | null;
  loading: boolean;
  amount: number;
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-5 rounded animate-shimmer"
            style={{ width: `${65 + i * 8}%`, opacity: 0.6 }}
          />
        ))}
      </div>
    );
  }

  if (!quote || !amount || amount < 500) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-center">
        <div
          className="w-12 h-12 rounded-full mb-3 flex items-center justify-center"
          style={{ background: 'rgba(247,147,26,0.1)' }}
        >
          <BtcIcon className="w-6 h-6 text-[#F7931A]" />
        </div>
        <p className="text-[#848E9C] text-sm">Enter an amount to see your quote</p>
      </div>
    );
  }

  const btcAmount = (quote.amountSats / 1e8).toFixed(8);

  return (
    <motion.div
      key={quote.amountSats}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
      className="space-y-1"
    >
      {/* Sats received — hero number */}
      <div className="py-4 text-center">
        <p className="text-[#848E9C] text-xs uppercase tracking-widest mb-1 font-medium">
          You receive
        </p>
        <p
          className="text-4xl font-bold font-mono tabular-nums"
          style={{ color: '#0ECB81', textShadow: '0 0 20px rgba(14,203,129,0.35)' }}
        >
          {quote.amountSats.toLocaleString()}
        </p>
        <p className="text-[#848E9C] text-xs mt-1 font-mono">{btcAmount} BTC</p>
      </div>

      <div className="border-t border-[#2B2F36] my-3" />

      {/* Breakdown rows */}
      <div className="space-y-2.5">
        <QuoteRow label="You pay" value={formatKes(quote.amountKes)} />
        <QuoteRow
          label={`Service fee (${quote.feePercent}%)`}
          value={formatKes(quote.feeKes)}
          dimValue
        />
        <QuoteRow
          label={`Spread (${quote.spreadPercent}%)`}
          value={`~${formatKes(Math.round(quote.amountKes * quote.spreadPercent / 100))}`}
          dimValue
        />
        <div className="border-t border-[#2B2F36] pt-2">
          <QuoteRow
            label="Net after fees"
            value={formatKes(quote.netKes)}
            bold
          />
        </div>
      </div>

      <div className="border-t border-[#2B2F36] my-3" />

      {/* BTC price used */}
      <div
        className="flex items-center justify-between px-3 py-2 rounded-lg"
        style={{ background: 'rgba(247,147,26,0.06)', border: '1px solid rgba(247,147,26,0.12)' }}
      >
        <span className="text-[#848E9C] text-xs">BTC price used</span>
        <span className="text-[#F7931A] text-xs font-mono font-semibold">
          {formatBtcRate(quote.btcPriceKes)} / BTC
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
}: {
  label: string;
  value: string;
  dimValue?: boolean;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[#848E9C] text-sm">{label}</span>
      <span
        className={`text-sm font-mono tabular-nums ${bold ? 'font-bold text-[#EAECEF]' : dimValue ? 'text-[#848E9C]' : 'text-[#EAECEF] font-medium'}`}
      >
        {value}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Inline SVG icons (keep dependency-light)                           */
/* ------------------------------------------------------------------ */

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.18 19.79 19.79 0 012 0.82a2 2 0 012-2.18h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
    </svg>
  );
}

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

function WarningIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Rate limit warning banner                                           */
/* ------------------------------------------------------------------ */

interface RateLimitInfo {
  dailyUsedKes: number;
  dailyLimitKes: number;
  monthlyUsedKes: number;
  monthlyLimitKes: number;
}

function RateLimitWarning({ info }: { info: RateLimitInfo }) {
  const dailyPct = (info.dailyUsedKes / info.dailyLimitKes) * 100;
  const monthlyPct = (info.monthlyUsedKes / info.monthlyLimitKes) * 100;
  const isNearLimit = dailyPct >= 80 || monthlyPct >= 80;

  if (!isNearLimit) return null;

  const nearDaily = dailyPct >= 80;
  const label = nearDaily ? 'daily' : 'monthly';
  const pct = nearDaily ? dailyPct : monthlyPct;
  const remaining = nearDaily
    ? info.dailyLimitKes - info.dailyUsedKes
    : info.monthlyLimitKes - info.monthlyUsedKes;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 rounded-xl px-4 py-3 mb-4"
      style={{
        background: 'rgba(240,185,11,0.08)',
        border: '1px solid rgba(240,185,11,0.25)',
      }}
    >
      <WarningIcon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#F0B90B' } as React.CSSProperties} />
      <div className="flex-1 min-w-0">
        <p className="text-[#FFD040] text-sm font-medium">
          Approaching {label} limit ({Math.round(pct)}% used)
        </p>
        <p className="text-[#848E9C] text-xs mt-0.5">
          {formatKes(remaining)} remaining today. Upgrade your KYC tier to increase limits.
        </p>
        {/* Progress bar */}
        <div className="mt-2 h-1 rounded-full bg-[#2B2F36] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(pct, 100)}%`,
              background: pct >= 95 ? '#F6465D' : '#F0B90B',
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  QUICK AMOUNT BUTTONS                                                */
/* ------------------------------------------------------------------ */

const QUICK_AMOUNTS = [500, 1_000, 5_000, 10_000];

/* ------------------------------------------------------------------ */
/*  Main page component                                                 */
/* ------------------------------------------------------------------ */

export default function BuyPage() {
  const [pageState, setPageState] = useState<PageState>('form');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [pendingTx, setPendingTx] = useState<PendingTx | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null);
  const [rawAmount, setRawAmount] = useState('1000');
  const [displayAmount, setDisplayAmount] = useState('1,000');
  const quoteDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { amountKes: 1000, phone: '' },
  });

  const phone = watch('phone');

  /* Fetch quote on amount change (500ms debounce) */
  const fetchQuote = useCallback((amountKes: number) => {
    if (quoteDebounceRef.current) clearTimeout(quoteDebounceRef.current);
    if (!amountKes || amountKes < 500) {
      setQuote(null);
      return;
    }
    quoteDebounceRef.current = setTimeout(async () => {
      setQuoteLoading(true);
      try {
        const { data } = await api.get<Quote>(
          `/trading/quote?type=BUY_BTC&amountKes=${amountKes}`,
        );
        setQuote(data);
      } catch {
        // silently ignore — stale quote, network issue
      } finally {
        setQuoteLoading(false);
      }
    }, 500);
  }, []);

  /* Also fetch rate limit info on mount */
  useEffect(() => {
    api
      .get('/users/me/limits')
      .then(({ data }) => setRateLimitInfo(data))
      .catch(() => {});
  }, []);

  /* Fetch initial quote */
  useEffect(() => {
    fetchQuote(1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Handle amount input */
  const handleAmountInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setRawAmount(raw);
    const num = parseInt(raw, 10);
    const formatted = raw ? new Intl.NumberFormat('en').format(num) : '';
    setDisplayAmount(formatted);
    if (!isNaN(num) && raw !== '') {
      setValue('amountKes', num, { shouldValidate: true });
      fetchQuote(num);
    } else {
      setValue('amountKes', 0 as unknown as number, { shouldValidate: false });
      setQuote(null);
    }
  };

  const handleQuickAmount = (amount: number) => {
    setRawAmount(String(amount));
    setDisplayAmount(new Intl.NumberFormat('en').format(amount));
    setValue('amountKes', amount, { shouldValidate: true });
    fetchQuote(amount);
  };

  /* Submit */
  const onSubmit = async (data: FormData) => {
    setSubmitLoading(true);
    setErrorMsg('');
    setPageState('processing');
    try {
      const { data: tx } = await api.post<PendingTx>('/trading/buy', {
        amountKes: data.amountKes,
        phone: data.phone,
        quoteId: quote?.quoteId,
      });
      setPendingTx(tx);
      // Simulate STK push waiting then success
      setTimeout(() => setPageState('success'), 4500);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg =
        axiosErr?.response?.data?.message || 'Failed to initiate purchase. Please try again.';
      setErrorMsg(msg);
      setPageState('error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const resetPage = () => {
    setPageState('form');
    setPendingTx(null);
    setErrorMsg('');
    setRawAmount('1000');
    setDisplayAmount('1,000');
    setValue('amountKes', 1000);
    setValue('phone', '');
    fetchQuote(1000);
  };

  const currentAmount = parseInt(rawAmount || '0', 10);

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
          <StkPushAnimation phone={phone || ''} />
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Success state                                                     */
  /* ---------------------------------------------------------------- */
  if (pageState === 'success' && pendingTx) {
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
          <SuccessState tx={pendingTx} onReset={resetPage} />
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Form state (default + error)                                      */
  /* ---------------------------------------------------------------- */
  return (
    <div className="space-y-2">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#EAECEF]">Buy Bitcoin</h1>
        <p className="text-[#848E9C] text-sm mt-1">
          Pay with M-Pesa — receive Bitcoin instantly to your wallet
        </p>
      </div>

      {/* Rate limit warning */}
      {rateLimitInfo && <RateLimitWarning info={rateLimitInfo} />}

      {/* Error banner */}
      <AnimatePresence>
        {pageState === 'error' && errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            className="flex items-start gap-3 rounded-xl px-4 py-3 mb-4"
            style={{
              background: 'rgba(246,70,93,0.08)',
              border: '1px solid rgba(246,70,93,0.25)',
            }}
          >
            <AlertIcon className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#F6465D]" />
            <div>
              <p className="text-[#F6465D] text-sm font-medium">Transaction failed</p>
              <p className="text-[#848E9C] text-xs mt-0.5">{errorMsg}</p>
            </div>
            <button
              onClick={() => setPageState('form')}
              className="ml-auto text-[#848E9C] hover:text-[#EAECEF] text-xs transition-colors"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* -------------------------------------------------------- */}
        {/* LEFT — Buy form                                           */}
        {/* -------------------------------------------------------- */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: '#1C1F26',
            border: '1px solid #2B2F36',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          <div className="flex items-center gap-2 mb-5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(247,147,26,0.15)' }}
            >
              <BtcIcon className="w-4 h-4 text-[#F7931A]" />
            </div>
            <h2 className="font-semibold text-[#EAECEF] text-base">Buy Order</h2>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Amount input */}
            <div>
              <label className="block text-[#848E9C] text-xs font-medium uppercase tracking-wider mb-2">
                Amount (KES)
              </label>

              {/* Large styled amount display */}
              <div
                className="relative rounded-xl transition-all duration-200"
                style={{
                  background: '#131720',
                  border: `1px solid ${errors.amountKes ? '#F6465D' : '#363B44'}`,
                }}
              >
                <span
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#848E9C] text-sm font-medium"
                  style={{ userSelect: 'none' }}
                >
                  KES
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={displayAmount}
                  onChange={handleAmountInput}
                  placeholder="0"
                  className="w-full pl-14 pr-4 py-4 text-3xl font-bold font-mono tabular-nums bg-transparent focus:outline-none"
                  style={{
                    color: displayAmount ? '#EAECEF' : '#5A6275',
                    caretColor: '#F7931A',
                  }}
                  aria-invalid={!!errors.amountKes}
                />
                {/* Hidden real field for react-hook-form */}
                <input type="hidden" {...register('amountKes', { valueAsNumber: true })} />
              </div>

              {errors.amountKes && (
                <motion.p
                  initial={{ opacity: 0, y: -2 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[#F6465D] text-xs mt-1.5 flex items-center gap-1"
                >
                  <AlertIcon className="w-3 h-3 flex-shrink-0" />
                  {errors.amountKes.message}
                </motion.p>
              )}
            </div>

            {/* Quick amount buttons */}
            <div>
              <p className="text-[#5A6275] text-xs mb-2">Quick select</p>
              <div className="grid grid-cols-4 gap-2">
                {QUICK_AMOUNTS.map((amt) => {
                  const active = currentAmount === amt;
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleQuickAmount(amt)}
                      className="py-2 rounded-lg text-sm font-semibold transition-all duration-150 active:scale-95"
                      style={{
                        background: active
                          ? 'rgba(247,147,26,0.15)'
                          : 'rgba(255,255,255,0.04)',
                        border: active
                          ? '1px solid rgba(247,147,26,0.4)'
                          : '1px solid #2B2F36',
                        color: active ? '#F7931A' : '#848E9C',
                        boxShadow: active ? '0 0 12px rgba(247,147,26,0.2)' : 'none',
                      }}
                    >
                      {amt >= 1000 ? `${amt / 1000}K` : amt}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* M-Pesa phone input */}
            <div>
              <label className="block text-[#848E9C] text-xs font-medium uppercase tracking-wider mb-2">
                M-Pesa Phone Number
              </label>
              <div
                className="relative rounded-xl transition-all duration-200"
                style={{
                  background: '#131720',
                  border: `1px solid ${errors.phone ? '#F6465D' : '#363B44'}`,
                }}
              >
                {/* Flag + prefix */}
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
                  aria-invalid={!!errors.phone}
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
                Enter the number registered with M-Pesa (e.g. 0712 345 678)
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitLoading}
              className="w-full py-4 rounded-xl font-bold text-base transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{
                background: submitLoading
                  ? 'rgba(247,147,26,0.5)'
                  : 'linear-gradient(135deg, #FF9A24 0%, #F7931A 50%, #E07800 100%)',
                color: '#0B0E11',
                boxShadow: submitLoading
                  ? 'none'
                  : '0 4px 20px rgba(247,147,26,0.45)',
              }}
              onMouseEnter={(e) => {
                if (!submitLoading)
                  (e.currentTarget as HTMLButtonElement).style.boxShadow =
                    '0 6px 28px rgba(247,147,26,0.6)';
              }}
              onMouseLeave={(e) => {
                if (!submitLoading)
                  (e.currentTarget as HTMLButtonElement).style.boxShadow =
                    '0 4px 20px rgba(247,147,26,0.45)';
              }}
            >
              {submitLoading ? (
                <>
                  <SpinnerIcon className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <BtcIcon className="w-4 h-4" />
                  Buy Bitcoin
                  <span className="ml-0.5">→</span>
                </>
              )}
            </button>

            {/* Trust line */}
            <p className="text-center text-[#5A6275] text-xs">
              Secured by M-Pesa · Bitcoin delivered instantly · KES {(500).toLocaleString()} – {(500_000).toLocaleString()} per transaction
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
                {/* Chart icon */}
                <svg className="w-4 h-4 text-[#0ECB81]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                  <polyline points="16 7 22 7 22 13" />
                </svg>
              </div>
              <h2 className="font-semibold text-[#EAECEF] text-base">Live Quote</h2>
            </div>

            {/* Live indicator */}
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
            <QuotePanel quote={quote} loading={quoteLoading} amount={currentAmount} />
          </div>

          {/* Bottom note */}
          {quote && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-[#5A6275] text-xs mt-5 pt-4 border-t border-[#2B2F36]"
            >
              Quotes are indicative and valid for 30 seconds. Final rate locked at payment.
            </motion.p>
          )}
        </div>
      </div>
    </div>
  );
}
