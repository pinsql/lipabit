'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------
const C = {
  bgBase:          '#0B0E11',
  bgCard:          '#1C1F26',
  bgCardSecondary: '#22262F',
  bgHover:         '#2B2F36',
  border:          '#2B2F36',
  borderStrong:    '#363B44',
  textPrimary:     '#EAECEF',
  textSecondary:   '#848E9C',
  textMuted:       '#5A6275',
  brand:           '#F7931A',
  brandSubtle:     'rgba(247,147,26,0.12)',
  brandBorder:     'rgba(247,147,26,0.30)',
  success:         '#0ECB81',
  successSubtle:   'rgba(14,203,129,0.12)',
  successText:     '#33E0A0',
  danger:          '#F6465D',
  dangerSubtle:    'rgba(246,70,93,0.12)',
  dangerText:      '#F88F9C',
  warning:         '#F0B90B',
  warningSubtle:   'rgba(240,185,11,0.12)',
  warningText:     '#FFD040',
} as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type TxType   = 'BUY_BTC' | 'SELL_BTC' | 'DEPOSIT' | 'WITHDRAWAL';
type TxStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'EXPIRED';
type FilterTab = 'ALL' | 'BUY' | 'SELL' | 'PENDING' | 'COMPLETED';

interface Transaction {
  id:              string;
  type:            TxType;
  status:          TxStatus;
  reference:       string;
  amountKes:       number;
  amountSats:      number;
  feeKes?:         number;
  netAmountKes?:   number;
  btcPriceKes?:    number;
  mpesaReceipt?:   string;
  mpesaTransaction?: { mpesaReceiptNumber?: string; status?: string };
  btcTxid?:        string;
  phone?:          string;
  createdAt:       string;
  updatedAt?:      string;
}

interface PaginationMeta {
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatKes(n: number): string {
  return new Intl.NumberFormat('en-KE', {
    style:                 'currency',
    currency:              'KES',
    maximumFractionDigits: 0,
  }).format(n);
}

function formatSats(n: number): string {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(4)} BTC`;
  if (n >= 1_000_000)   return `${(n / 1_000_000).toFixed(2)}M sats`;
  if (n >= 1_000)       return `${(n / 1_000).toFixed(2)}K sats`;
  return `${n.toLocaleString()} sats`;
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)     return 'just now';
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-KE', {
    day:    '2-digit',
    month:  'short',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function truncateStr(str: string, n = 12): string {
  if (!str || str.length <= n) return str;
  return `${str.slice(0, Math.floor(n / 2))}…${str.slice(-Math.ceil(n / 2))}`;
}

function isBuyType(type: TxType): boolean {
  return type === 'BUY_BTC' || type === 'DEPOSIT';
}

function typeLabel(type: TxType): string {
  switch (type) {
    case 'BUY_BTC':    return 'Buy BTC';
    case 'SELL_BTC':   return 'Sell BTC';
    case 'DEPOSIT':    return 'Deposit';
    case 'WITHDRAWAL': return 'Withdrawal';
    default:           return type;
  }
}

function matchesFilter(tx: Transaction, filter: FilterTab): boolean {
  switch (filter) {
    case 'ALL':       return true;
    case 'BUY':       return tx.type === 'BUY_BTC'  || tx.type === 'DEPOSIT';
    case 'SELL':      return tx.type === 'SELL_BTC'  || tx.type === 'WITHDRAWAL';
    case 'PENDING':   return tx.status === 'PENDING' || tx.status === 'PROCESSING';
    case 'COMPLETED': return tx.status === 'COMPLETED';
    default:          return true;
  }
}

function statusCfg(status: TxStatus): { label: string; color: string; bg: string; dot: string } {
  switch (status) {
    case 'COMPLETED':
      return { label: 'Completed',  color: C.successText, bg: C.successSubtle, dot: C.success };
    case 'PROCESSING':
      return { label: 'Processing', color: C.warningText, bg: C.warningSubtle, dot: C.warning };
    case 'PENDING':
      return { label: 'Pending',    color: C.warningText, bg: C.warningSubtle, dot: C.warning };
    case 'FAILED':
      return { label: 'Failed',     color: C.dangerText,  bg: C.dangerSubtle,  dot: C.danger  };
    case 'CANCELLED':
      return { label: 'Cancelled',  color: C.textMuted,   bg: 'rgba(90,98,117,0.14)', dot: C.textMuted };
    case 'EXPIRED':
      return { label: 'Expired',    color: C.textMuted,   bg: 'rgba(90,98,117,0.14)', dot: C.textMuted };
    default:
      return { label: status,       color: C.textSecondary, bg: C.bgHover, dot: C.textSecondary };
  }
}

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: 'ALL',       label: 'All'       },
  { id: 'BUY',       label: 'Buy'       },
  { id: 'SELL',      label: 'Sell'      },
  { id: 'PENDING',   label: 'Pending'   },
  { id: 'COMPLETED', label: 'Completed' },
];

const LIMIT = 15;

// ---------------------------------------------------------------------------
// Small SVG icons
// ---------------------------------------------------------------------------
function IconArrowDown({ color }: { color: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M8 3v10M4 9l4 4 4-4" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconArrowUp({ color }: { color: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M8 13V3M4 7l4-4 4 4" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconChevronDown({ size = 14, color = C.textSecondary }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M3 5l4 4 4-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconCopy({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 13 13" fill="none">
      <rect x="4" y="4" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M1 9V2a1 1 0 011-1h7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

function IconExternal({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 13 13" fill="none">
      <path d="M7.5 1.5h4v4M11.5 1.5L6 7M5.5 2.5H2A.5.5 0 001.5 3v8a.5.5 0 00.5.5h8a.5.5 0 00.5-.5V8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconCheck({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 13 13" fill="none">
      <path d="M2 6.5l4 4 5-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconRefresh({ spinning }: { spinning: boolean }) {
  return (
    <svg
      width="15" height="15" viewBox="0 0 16 16" fill="none"
      style={{ animation: spinning ? 'txSpin 0.75s linear infinite' : 'none' }}
    >
      <path d="M13.5 8A5.5 5.5 0 113 4.5M13.5 2v4h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------
function StatusBadge({ status }: { status: TxStatus }) {
  const cfg = statusCfg(status);
  const pulsing = status === 'PENDING' || status === 'PROCESSING';
  return (
    <span
      style={{
        display:       'inline-flex',
        alignItems:    'center',
        gap:           5,
        padding:       '3px 9px',
        borderRadius:  9999,
        background:    cfg.bg,
        color:         cfg.color,
        fontSize:      '11px',
        fontWeight:    600,
        letterSpacing: '0.02em',
        whiteSpace:    'nowrap',
        lineHeight:    1.4,
      }}
    >
      <span
        style={{
          width:        6,
          height:       6,
          borderRadius: '50%',
          background:   cfg.dot,
          flexShrink:   0,
          animation:    pulsing ? 'txPulse 2s ease-in-out infinite' : 'none',
        }}
      />
      {cfg.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Type icon (circle with arrow)
// ---------------------------------------------------------------------------
function TypeIcon({ type }: { type: TxType }) {
  const buy   = isBuyType(type);
  const color = buy ? C.success : C.danger;
  const bg    = buy ? C.successSubtle : C.dangerSubtle;
  const brd   = buy ? 'rgba(14,203,129,0.20)' : 'rgba(246,70,93,0.20)';
  return (
    <div
      style={{
        width:          36,
        height:         36,
        borderRadius:   '50%',
        background:     bg,
        border:         `1px solid ${brd}`,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        flexShrink:     0,
      }}
    >
      {buy ? <IconArrowDown color={color} /> : <IconArrowUp color={color} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton row
// ---------------------------------------------------------------------------
function SkeletonRow({ mobile }: { mobile?: boolean }) {
  const shimmer: React.CSSProperties = {
    background:     'linear-gradient(90deg, #1C1F26 25%, #22262F 50%, #1C1F26 75%)',
    backgroundSize: '200% 100%',
    animation:      'txShimmer 1.6s ease-in-out infinite',
    borderRadius:   '4px',
  };

  if (mobile) {
    return (
      <div
        style={{
          background:   C.bgCard,
          border:       `1px solid ${C.border}`,
          borderRadius: '12px',
          padding:      '14px',
          marginBottom: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ ...shimmer, width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ ...shimmer, height: 13, width: '55%', marginBottom: 6 }} />
            <div style={{ ...shimmer, height: 11, width: '40%' }} />
          </div>
          <div style={{ ...shimmer, height: 22, width: 72, borderRadius: 99 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ ...shimmer, height: 14, width: '38%' }} />
          <div style={{ ...shimmer, height: 11, width: '20%' }} />
        </div>
      </div>
    );
  }

  return (
    <tr>
      <td style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ ...shimmer, width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
          <div>
            <div style={{ ...shimmer, height: 12, width: 80, marginBottom: 5 }} />
            <div style={{ ...shimmer, height: 10, width: 110 }} />
          </div>
        </div>
      </td>
      <td style={{ padding: '14px 16px' }}>
        <div style={{ ...shimmer, height: 11, width: 70 }} />
      </td>
      <td style={{ padding: '14px 16px' }}>
        <div style={{ ...shimmer, height: 13, width: 85, marginBottom: 5 }} />
        <div style={{ ...shimmer, height: 10, width: 60 }} />
      </td>
      <td style={{ padding: '14px 16px' }}>
        <div style={{ ...shimmer, height: 22, width: 82, borderRadius: 99 }} />
      </td>
      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
        <div style={{ ...shimmer, height: 20, width: 20, borderRadius: 4, marginLeft: 'auto' }} />
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Expandable detail panel
// ---------------------------------------------------------------------------
function DetailPanel({
  tx,
  onCopy,
}: {
  tx:     Transaction;
  onCopy: (text: string, key: string) => void;
}) {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    onCopy(text, key);
    setTimeout(() => setCopied(null), 1800);
  };

  const mpesaReceipt =
    tx.mpesaReceipt ?? tx.mpesaTransaction?.mpesaReceiptNumber ?? null;

  const DetailRow = ({
    label,
    value,
    fieldKey,
    link,
    mono = false,
  }: {
    label:    string;
    value:    string;
    fieldKey: string;
    link?:    string;
    mono?:    boolean;
  }) => (
    <div
      style={{
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'center',
        padding:        '8px 0',
        borderBottom:   `1px solid ${C.border}`,
        gap:            16,
      }}
    >
      <span style={{ color: C.textMuted, fontSize: 11, flexShrink: 0, minWidth: 100 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span
          style={{
            color:      C.textSecondary,
            fontSize:   12,
            fontFamily: mono ? "'JetBrains Mono', 'Fira Code', monospace" : 'inherit',
            wordBreak:  'break-all',
            textAlign:  'right',
          }}
        >
          {value}
        </span>
        <button
          onClick={() => handleCopy(value, fieldKey)}
          title="Copy"
          style={{
            background: 'none',
            border:     'none',
            cursor:     'pointer',
            color:      copied === fieldKey ? C.success : C.textMuted,
            padding:    2,
            display:    'flex',
            alignItems: 'center',
            flexShrink: 0,
            transition: 'color 0.15s',
          }}
        >
          {copied === fieldKey ? <IconCheck /> : <IconCopy />}
        </button>
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color:      C.textMuted,
              display:    'flex',
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            <IconExternal />
          </a>
        )}
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
      style={{ overflow: 'hidden' }}
    >
      <div
        style={{
          background:  C.bgCardSecondary,
          borderTop:   `1px solid ${C.border}`,
          padding:     '12px 16px 14px calc(16px + 36px + 10px)',
        }}
      >
        <DetailRow label="Reference"  value={tx.reference}       fieldKey="ref"   mono />
        <DetailRow label="Date"       value={formatDateTime(tx.createdAt)} fieldKey="date" />
        {tx.amountKes  > 0  && <DetailRow label="KES Amount" value={formatKes(tx.amountKes)}   fieldKey="kes"  />}
        {tx.amountSats > 0  && <DetailRow label="Sats"       value={formatSats(tx.amountSats)} fieldKey="sats" mono />}
        {tx.feeKes != null  && <DetailRow label="Fee (KES)"  value={formatKes(tx.feeKes!)}     fieldKey="fee"  />}
        {tx.netAmountKes != null && (
          <DetailRow label="Net Amount" value={formatKes(tx.netAmountKes!)} fieldKey="net" />
        )}
        {tx.btcPriceKes != null && (
          <DetailRow label="BTC Rate" value={formatKes(tx.btcPriceKes!)} fieldKey="rate" />
        )}
        {tx.phone       && <DetailRow label="Phone"       value={tx.phone}       fieldKey="phone" mono />}
        {mpesaReceipt   && <DetailRow label="M-Pesa Receipt" value={mpesaReceipt} fieldKey="mpesa" mono />}
        {tx.btcTxid && (
          <DetailRow
            label="BTC TxID"
            value={truncateStr(tx.btcTxid, 26)}
            fieldKey="txid"
            mono
            link={`https://mempool.space/tx/${tx.btcTxid}`}
          />
        )}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Desktop table row
// ---------------------------------------------------------------------------
function TxTableRow({
  tx,
  expanded,
  onToggle,
  onCopy,
}: {
  tx:       Transaction;
  expanded: boolean;
  onToggle: () => void;
  onCopy:   (text: string, key: string) => void;
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        style={{
          cursor:       'pointer',
          borderBottom: expanded ? 'none' : `1px solid ${C.border}`,
          background:   expanded ? C.bgCardSecondary : 'transparent',
          transition:   'background 0.12s',
        }}
        onMouseEnter={e => {
          if (!expanded)
            (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(34,38,47,0.55)';
        }}
        onMouseLeave={e => {
          if (!expanded)
            (e.currentTarget as HTMLTableRowElement).style.background = 'transparent';
        }}
      >
        {/* Type + reference */}
        <td style={{ padding: '13px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <TypeIcon type={tx.type} />
            <div>
              <p style={{ color: C.textPrimary, fontSize: 13, fontWeight: 500, margin: '0 0 2px' }}>
                {typeLabel(tx.type)}
              </p>
              <p
                style={{
                  color:      C.textMuted,
                  fontSize:   11,
                  fontFamily: "'JetBrains Mono', monospace",
                  margin:     0,
                }}
              >
                {truncateStr(tx.reference, 18)}
              </p>
            </div>
          </div>
        </td>

        {/* Time */}
        <td style={{ padding: '13px 16px' }}>
          <span
            style={{ color: C.textSecondary, fontSize: 12 }}
            title={formatDateTime(tx.createdAt)}
          >
            {timeAgo(tx.createdAt)}
          </span>
        </td>

        {/* Amounts */}
        <td style={{ padding: '13px 16px' }}>
          <p style={{ color: C.textPrimary, fontSize: 13, fontWeight: 600, margin: '0 0 2px' }}>
            {formatKes(tx.amountKes)}
          </p>
          <p
            style={{
              color:      C.textMuted,
              fontSize:   11,
              fontFamily: "'JetBrains Mono', monospace",
              margin:     0,
            }}
          >
            {formatSats(tx.amountSats)}
          </p>
        </td>

        {/* Status */}
        <td style={{ padding: '13px 16px' }}>
          <StatusBadge status={tx.status} />
        </td>

        {/* Expand toggle */}
        <td style={{ padding: '13px 16px', textAlign: 'right' }}>
          <div
            style={{
              display:        'inline-flex',
              alignItems:     'center',
              justifyContent: 'center',
              width:          26,
              height:         26,
              borderRadius:   6,
              background:     expanded ? C.brandSubtle : 'transparent',
              color:          expanded ? C.brand : C.textMuted,
              transform:      expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition:     'transform 0.2s, background 0.15s, color 0.15s',
            }}
          >
            <IconChevronDown color={expanded ? C.brand : C.textSecondary} />
          </div>
        </td>
      </tr>

      {/* Detail panel injected as full-width row */}
      <AnimatePresence>
        {expanded && (
          <tr key={`${tx.id}-detail`}>
            <td colSpan={5} style={{ padding: 0, borderBottom: `1px solid ${C.border}` }}>
              <DetailPanel tx={tx} onCopy={onCopy} />
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  );
}

// ---------------------------------------------------------------------------
// Mobile card
// ---------------------------------------------------------------------------
function TxMobileCard({
  tx,
  expanded,
  onToggle,
  onCopy,
}: {
  tx:       Transaction;
  expanded: boolean;
  onToggle: () => void;
  onCopy:   (text: string, key: string) => void;
}) {
  return (
    <motion.div
      layout
      style={{
        background:   C.bgCard,
        border:       `1px solid ${expanded ? C.borderStrong : C.border}`,
        borderRadius: 12,
        marginBottom: 8,
        overflow:     'hidden',
        transition:   'border-color 0.15s',
      }}
    >
      {/* Tap header */}
      <div
        onClick={onToggle}
        style={{
          display:    'flex',
          alignItems: 'center',
          gap:        12,
          padding:    '13px 14px',
          cursor:     'pointer',
        }}
      >
        <TypeIcon type={tx.type} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
            <span style={{ color: C.textPrimary, fontSize: 13, fontWeight: 500 }}>
              {typeLabel(tx.type)}
            </span>
            <StatusBadge status={tx.status} />
          </div>
          <span
            style={{
              color:      C.textMuted,
              fontSize:   11,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {truncateStr(tx.reference, 22)}
          </span>
        </div>

        <div
          style={{
            color:      expanded ? C.brand : C.textMuted,
            transform:  expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s, color 0.15s',
            flexShrink: 0,
          }}
        >
          <IconChevronDown color={expanded ? C.brand : C.textSecondary} />
        </div>
      </div>

      {/* Amount + time row */}
      <div
        onClick={onToggle}
        style={{
          display:        'flex',
          justifyContent: 'space-between',
          alignItems:     'center',
          padding:        '0 14px 13px',
          cursor:         'pointer',
        }}
      >
        <div>
          <span style={{ color: C.textPrimary, fontSize: 14, fontWeight: 700 }}>
            {formatKes(tx.amountKes)}
          </span>
          <span
            style={{
              color:      C.textMuted,
              fontSize:   11,
              marginLeft: 8,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {formatSats(tx.amountSats)}
          </span>
        </div>
        <span
          style={{ color: C.textMuted, fontSize: 11 }}
          title={formatDateTime(tx.createdAt)}
        >
          {timeAgo(tx.createdAt)}
        </span>
      </div>

      {/* Detail panel */}
      <AnimatePresence>
        {expanded && (
          <DetailPanel tx={tx} onCopy={onCopy} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Pagination controls
// ---------------------------------------------------------------------------
function Pagination({
  page,
  totalPages,
  total,
  limit,
  onChange,
}: {
  page:       number;
  totalPages: number;
  total:      number;
  limit:      number;
  onChange:   (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const start = (page - 1) * limit + 1;
  const end   = Math.min(page * limit, total);

  const baseBtn: React.CSSProperties = {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    minWidth:       32,
    height:         32,
    padding:        '0 8px',
    borderRadius:   6,
    fontSize:       13,
    cursor:         'pointer',
    transition:     'all 0.15s',
  };

  const pageBtn = (active: boolean, disabled: boolean): React.CSSProperties => ({
    ...baseBtn,
    border:     `1px solid ${active ? C.brand : C.border}`,
    background: active ? C.brandSubtle : 'transparent',
    color:      active ? C.brand : disabled ? C.textMuted : C.textSecondary,
    fontWeight: active ? 600 : 400,
    cursor:     disabled ? 'not-allowed' : 'pointer',
    opacity:    disabled ? 0.4 : 1,
  });

  // Build page number list with ellipsis
  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++)
      pages.push(i);
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <div
      style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        flexWrap:       'wrap',
        gap:            12,
        paddingTop:     16,
      }}
    >
      <span style={{ color: C.textMuted, fontSize: 12 }}>
        {start}–{end} of {total} transactions
      </span>

      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {/* Prev */}
        <button
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
          style={pageBtn(false, page === 1)}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {pages.map((p, idx) =>
          p === '...'
            ? (
              <span
                key={`ellipsis-${idx}`}
                style={{ color: C.textMuted, padding: '0 4px', fontSize: 13, userSelect: 'none' }}
              >
                …
              </span>
            )
            : (
              <button
                key={p}
                onClick={() => onChange(p as number)}
                style={pageBtn(p === page, false)}
                onMouseEnter={e => {
                  if (p !== page) {
                    const b = e.currentTarget as HTMLButtonElement;
                    b.style.background = 'rgba(234,236,239,0.05)';
                    b.style.color      = C.textPrimary;
                  }
                }}
                onMouseLeave={e => {
                  if (p !== page) {
                    const b = e.currentTarget as HTMLButtonElement;
                    b.style.background = 'transparent';
                    b.style.color      = C.textSecondary;
                  }
                }}
              >
                {p}
              </button>
            )
        )}

        {/* Next */}
        <button
          disabled={page === totalPages}
          onClick={() => onChange(page + 1)}
          style={pageBtn(false, page === totalPages)}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state illustration
// ---------------------------------------------------------------------------
function EmptyState({ filter }: { filter: FilterTab }) {
  const msgs: Record<FilterTab, { title: string; desc: string }> = {
    ALL:       { title: 'No transactions yet',       desc: 'Your complete buy and sell history will appear here once you make your first trade.' },
    BUY:       { title: 'No buy transactions',       desc: "You haven't purchased any Bitcoin yet. Head to the Buy page to get started." },
    SELL:      { title: 'No sell transactions',      desc: "You haven't sold any Bitcoin yet." },
    PENDING:   { title: 'No pending transactions',   desc: 'All caught up — no transactions are waiting for processing.' },
    COMPLETED: { title: 'No completed transactions', desc: 'Completed trades will show up here.' },
  };
  const { title, desc } = msgs[filter];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        '56px 24px',
        textAlign:      'center',
      }}
    >
      {/* Illustration */}
      <div
        style={{
          width:          72,
          height:         72,
          borderRadius:   '50%',
          background:     'rgba(247,147,26,0.07)',
          border:         `1px solid rgba(247,147,26,0.15)`,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          marginBottom:   20,
        }}
      >
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <rect x="4" y="6" width="24" height="20" rx="3" stroke={C.brand} strokeWidth="1.5" strokeOpacity="0.6"/>
          <path d="M4 12h24" stroke={C.brand} strokeWidth="1.5" strokeOpacity="0.6"/>
          <rect x="8" y="17" width="10" height="2.5" rx="1.25" fill={C.textMuted}/>
          <rect x="8" y="21.5" width="6" height="2" rx="1" fill={C.borderStrong}/>
          <circle cx="23" cy="22" r="5" fill="#1C1F26" stroke={C.border} strokeWidth="1.5"/>
          <path d="M21 22h4M23 20v4" stroke={C.textMuted} strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
      </div>
      <p style={{ color: C.textPrimary, fontSize: 15, fontWeight: 600, margin: '0 0 8px' }}>
        {title}
      </p>
      <p style={{ color: C.textMuted, fontSize: 13, maxWidth: 320, lineHeight: 1.65, margin: 0 }}>
        {desc}
      </p>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      style={{
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        '48px 24px',
        textAlign:      'center',
      }}
    >
      <div
        style={{
          width:          52,
          height:         52,
          borderRadius:   '50%',
          background:     C.dangerSubtle,
          border:         'rgba(246,70,93,0.20)',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          marginBottom:   16,
        }}
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <circle cx="11" cy="11" r="9" stroke={C.danger} strokeWidth="1.5"/>
          <path d="M11 7v5M11 15.5v.01" stroke={C.danger} strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
      <p style={{ color: C.textPrimary, fontSize: 14, fontWeight: 600, margin: '0 0 6px' }}>
        Failed to load transactions
      </p>
      <p style={{ color: C.textMuted, fontSize: 12, margin: '0 0 20px', maxWidth: 280, lineHeight: 1.6 }}>
        {message}
      </p>
      <button
        onClick={onRetry}
        style={{
          background:   C.dangerSubtle,
          border:       '1px solid rgba(246,70,93,0.25)',
          color:        C.danger,
          borderRadius: 8,
          padding:      '8px 20px',
          fontSize:     13,
          fontWeight:   500,
          cursor:       'pointer',
          transition:   'all 0.15s',
        }}
      >
        Try again
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------
function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 14, scale: 0.97 }}
          animate={{ opacity: 1, y: 0,  scale: 1     }}
          exit={{ opacity: 0, y: 8, scale: 0.97 }}
          transition={{ duration: 0.18 }}
          style={{
            position:     'fixed',
            bottom:       28,
            left:         '50%',
            transform:    'translateX(-50%)',
            zIndex:       600,
            background:   C.bgCard,
            border:       `1px solid ${C.border}`,
            borderRadius: 8,
            padding:      '10px 18px',
            color:        C.textPrimary,
            fontSize:     13,
            fontWeight:   500,
            boxShadow:    '0 8px 24px rgba(0,0,0,0.55)',
            display:      'flex',
            alignItems:   'center',
            gap:          8,
            whiteSpace:   'nowrap',
            pointerEvents: 'none',
          }}
        >
          <span style={{ color: C.success, display: 'flex', alignItems: 'center' }}>
            <IconCheck size={14} />
          </span>
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------
export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [filter,       setFilter]       = useState<FilterTab>('ALL');
  const [page,         setPage]         = useState(1);
  const [pagination,   setPagination]   = useState<PaginationMeta>({
    total: 0, page: 1, limit: LIMIT, totalPages: 1,
  });
  const [expandedId,   setExpandedId]   = useState<string | null>(null);
  const [toastMsg,     setToastMsg]     = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // -------------------------------------------------------------------------
  // Data fetch
  // -------------------------------------------------------------------------
  const fetchTransactions = useCallback(
    async (p: number, silent = false) => {
      if (!silent) setLoading(true);
      else         setRefreshing(true);
      setError(null);

      try {
        const params: Record<string, string | number> = { page: p, limit: LIMIT };
        if (filter === 'BUY')       params.type   = 'BUY_BTC';
        if (filter === 'SELL')      params.type   = 'SELL_BTC';
        if (filter === 'PENDING')   params.status = 'PENDING';
        if (filter === 'COMPLETED') params.status = 'COMPLETED';

        const res = await api.get('/trading/transactions', { params });
        const body = res.data as Record<string, unknown>;

        // Normalise various API response shapes
        const items: Transaction[] = Array.isArray(body)
          ? (body as Transaction[])
          : Array.isArray((body as any).transactions)
            ? (body as any).transactions
            : Array.isArray((body as any).items)
              ? (body as any).items
              : Array.isArray((body as any).data)
                ? (body as any).data
                : [];

        const rawMeta = (body as any).pagination ?? (body as any).meta ?? body;
        const meta: PaginationMeta = {
          total:      Number((rawMeta as any).total      ?? items.length),
          page:       Number((rawMeta as any).page       ?? p),
          limit:      Number((rawMeta as any).limit      ?? LIMIT),
          totalPages: Number(
            (rawMeta as any).totalPages ??
            (rawMeta as any).pages      ??
            Math.ceil((Number((rawMeta as any).total ?? items.length)) / LIMIT)
          ),
        };

        // Normalise numeric fields that the API might return as strings
        const normalised = items.map(tx => ({
          ...tx,
          amountKes:  Number(tx.amountKes  ?? 0),
          amountSats: Number(tx.amountSats ?? 0),
          feeKes:     tx.feeKes     != null ? Number(tx.feeKes)    : undefined,
          netAmountKes: tx.netAmountKes != null ? Number(tx.netAmountKes) : undefined,
          btcPriceKes:  tx.btcPriceKes  != null ? Number(tx.btcPriceKes)  : undefined,
        }));

        setTransactions(normalised);
        setPagination(meta);
      } catch (err: unknown) {
        const e = err as Record<string, unknown>;
        const msg =
          (e?.response as any)?.data?.message ??
          (e?.response as any)?.data?.error   ??
          (e as any)?.message                 ??
          'Something went wrong. Please try again.';
        setError(String(msg));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filter],
  );

  // Reset page + expanded row when filter changes
  useEffect(() => {
    setPage(1);
    setExpandedId(null);
  }, [filter]);

  useEffect(() => {
    fetchTransactions(page);
  }, [fetchTransactions, page]);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------
  const handlePageChange = (p: number) => {
    setPage(p);
    setExpandedId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggle = (id: string) =>
    setExpandedId(prev => (prev === id ? null : id));

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVisible(false), 2200);
  };

  const handleCopy = (_text: string, key: string) => {
    const labels: Record<string, string> = {
      ref:   'Reference copied',
      mpesa: 'M-Pesa receipt copied',
      txid:  'TxID copied',
      phone: 'Phone copied',
      kes:   'KES amount copied',
      sats:  'Sats amount copied',
    };
    showToast(labels[key] ?? 'Copied to clipboard');
  };

  // Client-side filter (handles cases where API returns all + we filter locally)
  const displayedTx = transactions.filter(tx => matchesFilter(tx, filter));

  // Tab counts (based on unfiltered data on this page)
  const counts: Record<FilterTab, number> = {
    ALL:       transactions.length,
    BUY:       transactions.filter(t => isBuyType(t.type)).length,
    SELL:      transactions.filter(t => !isBuyType(t.type)).length,
    PENDING:   transactions.filter(t => t.status === 'PENDING' || t.status === 'PROCESSING').length,
    COMPLETED: transactions.filter(t => t.status === 'COMPLETED').length,
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <>
      {/* Global keyframe animations */}
      <style>{`
        @keyframes txShimmer {
          from { background-position: -200% 0; }
          to   { background-position:  200% 0; }
        }
        @keyframes txSpin {
          from { transform: rotate(0deg);   }
          to   { transform: rotate(360deg); }
        }
        @keyframes txPulse {
          0%, 100% { opacity: 1;   }
          50%      { opacity: 0.4; }
        }
      `}</style>

      <div style={{ maxWidth: 1000, margin: '0 auto' }}>

        {/* ---------------------------------------------------------------- */}
        {/* Page header                                                       */}
        {/* ---------------------------------------------------------------- */}
        <div
          style={{
            display:        'flex',
            alignItems:     'flex-start',
            justifyContent: 'space-between',
            marginBottom:   24,
            flexWrap:       'wrap',
            gap:            12,
          }}
        >
          <div>
            <h1
              style={{
                color:         C.textPrimary,
                fontSize:      22,
                fontWeight:    700,
                margin:        '0 0 4px',
                letterSpacing: '-0.025em',
              }}
            >
              Transactions
            </h1>
            <p style={{ color: C.textMuted, fontSize: 13, margin: 0 }}>
              {!loading && pagination.total > 0
                ? `${pagination.total} total transaction${pagination.total !== 1 ? 's' : ''}`
                : 'Your complete buy & sell history'}
            </p>
          </div>

          <button
            onClick={() => fetchTransactions(page, true)}
            disabled={refreshing || loading}
            style={{
              display:      'flex',
              alignItems:   'center',
              gap:          6,
              padding:      '8px 14px',
              background:   'transparent',
              border:       `1px solid ${C.border}`,
              borderRadius: 8,
              color:        refreshing ? C.brand : C.textSecondary,
              fontSize:     13,
              fontWeight:   500,
              cursor:       refreshing || loading ? 'not-allowed' : 'pointer',
              opacity:      loading ? 0.45 : 1,
              transition:   'all 0.15s',
            }}
            onMouseEnter={e => {
              if (!refreshing && !loading) {
                const b = e.currentTarget as HTMLButtonElement;
                b.style.color       = C.textPrimary;
                b.style.borderColor = C.borderStrong;
              }
            }}
            onMouseLeave={e => {
              if (!refreshing && !loading) {
                const b = e.currentTarget as HTMLButtonElement;
                b.style.color       = C.textSecondary;
                b.style.borderColor = C.border;
              }
            }}
          >
            <IconRefresh spinning={refreshing} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Filter tabs                                                       */}
        {/* ---------------------------------------------------------------- */}
        <div
          style={{
            display:        'flex',
            gap:            4,
            marginBottom:   16,
            overflowX:      'auto',
            paddingBottom:  2,
            scrollbarWidth: 'none',
          }}
        >
          {FILTER_TABS.map(tab => {
            const active = filter === tab.id;
            const count  = counts[tab.id];
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                style={{
                  display:      'flex',
                  alignItems:   'center',
                  gap:          6,
                  padding:      '7px 13px',
                  borderRadius: 8,
                  border:       `1px solid ${active ? C.brandBorder : C.border}`,
                  background:   active ? C.brandSubtle : 'transparent',
                  color:        active ? C.brand : C.textSecondary,
                  fontSize:     13,
                  fontWeight:   active ? 600 : 400,
                  cursor:       'pointer',
                  whiteSpace:   'nowrap',
                  flexShrink:   0,
                  transition:   'all 0.14s',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    const b = e.currentTarget as HTMLButtonElement;
                    b.style.color       = C.textPrimary;
                    b.style.borderColor = C.borderStrong;
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    const b = e.currentTarget as HTMLButtonElement;
                    b.style.color       = C.textSecondary;
                    b.style.borderColor = C.border;
                  }
                }}
              >
                {tab.label}
                {!loading && count > 0 && (
                  <span
                    style={{
                      background:   active ? C.brand : C.bgHover,
                      color:        active ? C.bgBase : C.textMuted,
                      borderRadius: 9999,
                      fontSize:     10,
                      fontWeight:   700,
                      padding:      '1px 6px',
                      minWidth:     18,
                      textAlign:    'center',
                      lineHeight:   '16px',
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Main card                                                         */}
        {/* ---------------------------------------------------------------- */}
        <div
          style={{
            background:   C.bgCard,
            border:       `1px solid ${C.border}`,
            borderRadius: 12,
            overflow:     'hidden',
            boxShadow:    '0 4px 12px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)',
          }}
        >
          {/* Error */}
          {error && !loading && (
            <ErrorState message={error} onRetry={() => fetchTransactions(page)} />
          )}

          {/* Loading skeletons */}
          {loading && !error && (
            <>
              {/* Desktop */}
              <div className="hidden md:block">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                      {['Transaction', 'Time', 'Amount', 'Status', ''].map((h, i) => (
                        <th
                          key={h || `th-${i}`}
                          style={{
                            padding:       '11px 16px',
                            color:         C.textMuted,
                            fontSize:      10,
                            fontWeight:    700,
                            textAlign:     i === 4 ? 'right' : 'left',
                            letterSpacing: '0.07em',
                            textTransform: 'uppercase',
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="md:hidden" style={{ padding: '12px' }}>
                {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} mobile />)}
              </div>
            </>
          )}

          {/* Loaded content */}
          {!loading && !error && (
            <>
              {displayedTx.length === 0 ? (
                <EmptyState filter={filter} />
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden md:block">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                          {[
                            { label: 'Transaction', align: 'left'  },
                            { label: 'Time',        align: 'left'  },
                            { label: 'Amount',      align: 'left'  },
                            { label: 'Status',      align: 'left'  },
                            { label: '',            align: 'right' },
                          ].map((h, i) => (
                            <th
                              key={h.label || `th-${i}`}
                              style={{
                                padding:       '11px 16px',
                                color:         C.textMuted,
                                fontSize:      10,
                                fontWeight:    700,
                                textAlign:     h.align as React.CSSProperties['textAlign'],
                                letterSpacing: '0.07em',
                                textTransform: 'uppercase',
                                whiteSpace:    'nowrap',
                              }}
                            >
                              {h.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {displayedTx.map(tx => (
                          <TxTableRow
                            key={tx.id}
                            tx={tx}
                            expanded={expandedId === tx.id}
                            onToggle={() => handleToggle(tx.id)}
                            onCopy={handleCopy}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile card list */}
                  <div className="md:hidden" style={{ padding: '12px' }}>
                    <AnimatePresence>
                      {displayedTx.map(tx => (
                        <TxMobileCard
                          key={tx.id}
                          tx={tx}
                          expanded={expandedId === tx.id}
                          onToggle={() => handleToggle(tx.id)}
                          onCopy={handleCopy}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div
                  style={{
                    borderTop: `1px solid ${C.border}`,
                    padding:   '0 16px 16px',
                  }}
                >
                  <Pagination
                    page={pagination.page}
                    totalPages={pagination.totalPages}
                    total={pagination.total}
                    limit={pagination.limit}
                    onChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Toast notification */}
      <Toast message={toastMsg} visible={toastVisible} />
    </>
  );
}
