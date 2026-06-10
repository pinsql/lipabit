'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';

interface Transaction {
  id: string;
  type: 'BUY_BTC' | 'SELL_BTC';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'EXPIRED';
  amountKes: string | number;
  amountSats: string | number;
  feeKes: string | number;
  netAmountKes: string | number;
  reference: string;
  btcPriceKes: string | number;
  createdAt: string;
  mpesaTransaction?: { status: string; mpesaReceiptNumber?: string };
}

interface PaginatedResponse { items: Transaction[]; total: number; pages: number; page: number; }

const FILTERS = ['All', 'Buy', 'Sell', 'Completed', 'Pending', 'Failed'] as const;
type Filter = typeof FILTERS[number];

function formatKes(n: number) {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(n);
}

function timeAgo(dateStr: string): string {
  const d = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (d < 60) return 'just now';
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' });
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`rounded-lg animate-pulse ${className}`} style={{ background: 'linear-gradient(90deg,#1C1F26 25%,#22262F 50%,#1C1F26 75%)' }} />;
}

function StatusBadge({ status }: { status: Transaction['status'] }) {
  const map = {
    COMPLETED:  { color: '#0ECB81', bg: 'rgba(14,203,129,0.1)',  label: 'Completed'  },
    PENDING:    { color: '#F0B90B', bg: 'rgba(240,185,11,0.1)',  label: 'Pending'    },
    PROCESSING: { color: '#F0B90B', bg: 'rgba(240,185,11,0.1)',  label: 'Processing' },
    FAILED:     { color: '#F6465D', bg: 'rgba(246,70,93,0.1)',   label: 'Failed'     },
    CANCELLED:  { color: '#848E9C', bg: 'rgba(132,142,156,0.1)', label: 'Cancelled'  },
    EXPIRED:    { color: '#848E9C', bg: 'rgba(132,142,156,0.1)', label: 'Expired'    },
  };
  const c = map[status] ?? map.CANCELLED;
  return (
    <span className="inline-flex text-xs font-medium px-2 py-0.5 rounded-full" style={{ color: c.color, background: c.bg }}>
      {c.label}
    </span>
  );
}

function TxRow({ tx, onClick, expanded }: { tx: Transaction; onClick: () => void; expanded: boolean }) {
  const isBuy = tx.type === 'BUY_BTC';
  const kes = parseFloat(String(tx.amountKes));
  const sats = parseInt(String(tx.amountSats));
  const fee = parseFloat(String(tx.feeKes));

  return (
    <motion.div layout className="rounded-xl overflow-hidden" style={{ background: '#1C1F26', border: `1px solid ${expanded ? '#363B44' : '#2B2F36'}` }}>
      {/* Main row */}
      <button onClick={onClick} className="w-full text-left">
        <div className="flex items-center gap-4 p-4">
          {/* Icon */}
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: isBuy ? 'rgba(14,203,129,0.12)' : 'rgba(246,70,93,0.12)' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              {isBuy
                ? <path d="M8 3v10M4 9l4 4 4-4" stroke="#0ECB81" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                : <path d="M8 3v10M4 7l4-4 4 4" stroke="#F6465D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              }
            </svg>
          </div>

          {/* Label + ref */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-[#EAECEF]">{isBuy ? 'Bought Bitcoin' : 'Sold Bitcoin'}</p>
              <StatusBadge status={tx.status} />
            </div>
            <p className="text-xs text-[#5A6275] mt-0.5 font-mono truncate">{tx.reference}</p>
          </div>

          {/* Amount */}
          <div className="text-right flex-shrink-0">
            <p className="text-sm font-semibold font-mono" style={{ color: isBuy ? '#0ECB81' : '#F6465D' }}>
              {isBuy ? '+' : '-'}{sats.toLocaleString()} sats
            </p>
            <p className="text-xs text-[#848E9C] mt-0.5">{formatKes(kes)}</p>
          </div>

          {/* Time + expand */}
          <div className="text-right flex-shrink-0 hidden sm:block">
            <p className="text-xs text-[#848E9C]">{timeAgo(tx.createdAt)}</p>
            <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }} className="ml-auto mt-1 w-4 h-4 flex items-center justify-center" style={{ color: '#5A6275' }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
            </motion.div>
          </div>
        </div>
      </button>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-4 pb-4 border-t" style={{ borderColor: '#2B2F36' }}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 text-xs">
                <div><p className="text-[#5A6275] mb-0.5">Date & Time</p><p className="text-[#EAECEF]">{new Date(tx.createdAt).toLocaleString('en-KE')}</p></div>
                <div><p className="text-[#5A6275] mb-0.5">BTC Price</p><p className="text-[#EAECEF] font-mono">{formatKes(parseFloat(String(tx.btcPriceKes)))}</p></div>
                <div><p className="text-[#5A6275] mb-0.5">Fee</p><p className="text-[#EAECEF]">{formatKes(fee)}</p></div>
                <div><p className="text-[#5A6275] mb-0.5">Net Amount</p><p className="text-[#EAECEF] font-semibold">{formatKes(parseFloat(String(tx.netAmountKes)))}</p></div>
                {tx.mpesaTransaction?.mpesaReceiptNumber && (
                  <div className="col-span-2"><p className="text-[#5A6275] mb-0.5">M-Pesa Receipt</p><p className="text-[#EAECEF] font-mono">{tx.mpesaTransaction.mpesaReceiptNumber}</p></div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function TransactionsPage() {
  const [transactions, setTx] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('All');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchTx = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get<PaginatedResponse>(`/trading/transactions?page=${p}&limit=20`);
      setTx(data.items || []);
      setTotalPages(data.pages || 1);
      setTotal(data.total || 0);
      setPage(p);
    } catch { setTx([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTx(1); }, [fetchTx]);

  const filtered = transactions.filter((tx) => {
    if (filter === 'All') return true;
    if (filter === 'Buy') return tx.type === 'BUY_BTC';
    if (filter === 'Sell') return tx.type === 'SELL_BTC';
    if (filter === 'Completed') return tx.status === 'COMPLETED';
    if (filter === 'Pending') return ['PENDING', 'PROCESSING'].includes(tx.status);
    if (filter === 'Failed') return ['FAILED', 'CANCELLED', 'EXPIRED'].includes(tx.status);
    return true;
  });

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#EAECEF]">Transactions</h1>
          <p className="text-[#848E9C] text-sm mt-0.5">{total > 0 ? `${total} total transactions` : 'Your complete trade history'}</p>
        </div>
        <button onClick={() => fetchTx(page)} className="p-2 rounded-lg transition-colors" style={{ color: '#848E9C', background: '#1C1F26', border: '1px solid #2B2F36' }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#EAECEF')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#848E9C')}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8a6 6 0 1010.5-3.9M2 2v4h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-5 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0"
            style={{
              background: filter === f ? 'rgba(247,147,26,0.12)' : '#1C1F26',
              color: filter === f ? '#F7931A' : '#848E9C',
              border: `1px solid ${filter === f ? 'rgba(247,147,26,0.3)' : '#2B2F36'}`,
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="rounded-xl p-4 flex items-center gap-4" style={{ background: '#1C1F26', border: '1px solid #2B2F36' }}>
              <Skeleton className="w-9 h-9 rounded-full" />
              <div className="flex-1 space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-24" /></div>
              <div className="space-y-2 text-right"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-16" /></div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl p-12 text-center" style={{ background: '#1C1F26', border: '1px solid #2B2F36' }}>
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(247,147,26,0.08)' }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M4 7h20M4 14h12M4 21h8" stroke="#F7931A" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </div>
          <h3 className="text-[#EAECEF] font-semibold mb-2">{filter === 'All' ? 'No transactions yet' : `No ${filter.toLowerCase()} transactions`}</h3>
          <p className="text-[#848E9C] text-sm">
            {filter === 'All' ? 'Your trades will appear here once you start.' : 'Try a different filter.'}
          </p>
        </motion.div>
      ) : (
        <motion.div layout className="space-y-2">
          {filtered.map((tx) => (
            <TxRow
              key={tx.id}
              tx={tx}
              expanded={expanded === tx.id}
              onClick={() => setExpanded(expanded === tx.id ? null : tx.id)}
            />
          ))}
        </motion.div>
      )}

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button disabled={page <= 1} onClick={() => fetchTx(page - 1)} className="px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-30" style={{ background: '#1C1F26', color: '#848E9C', border: '1px solid #2B2F36' }}>
            ← Prev
          </button>
          <span className="text-sm text-[#848E9C] px-2">Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => fetchTx(page + 1)} className="px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-30" style={{ background: '#1C1F26', color: '#848E9C', border: '1px solid #2B2F36' }}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
