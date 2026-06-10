'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/auth';

// ---------------------------------------------------------------------------
// Design tokens (inlined from design-system.ts for self-containment)
// ---------------------------------------------------------------------------
const C = {
  bgBase:        '#0B0E11',
  bgElevated:    '#131720',
  bgCard:        '#1C1F26',
  bgHover:       '#22262F',
  border:        '#2B2F36',
  textPrimary:   '#EAECEF',
  textSecondary: '#848E9C',
  textMuted:     '#5A6275',
  brand:         '#F7931A',
  brandSubtle:   'rgba(247,147,26,0.10)',
  brandBorder:   'rgba(247,147,26,0.35)',
  brandGlow:     'rgba(247,147,26,0.40)',
  success:       '#0ECB81',
  danger:        '#F6465D',
  dangerSubtle:  'rgba(246,70,93,0.08)',
} as const;

const SIDEBAR_EXPANDED  = 240;
const SIDEBAR_COLLAPSED = 68;
const STORAGE_KEY       = 'lipabit_sidebar_collapsed';

// ---------------------------------------------------------------------------
// SVG icon library (inline to avoid extra imports beyond lucide-react)
// ---------------------------------------------------------------------------
function IconDashboard() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="10" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="2" y="10" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="10" y="10" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}
function IconBuyBTC() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M6.5 9l2.5 2.5L11.5 9M9 5.5v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function IconSellBTC() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M6.5 9l2.5-2.5L11.5 9M9 12.5v-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function IconTransactions() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M3 5h12M3 9h8M3 13h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M14 11l2 2-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16 13h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
function IconProfile() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="6.5" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M3.5 15c0-3.038 2.462-5.5 5.5-5.5s5.5 2.462 5.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
function IconSettings() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M9 2v1.5M9 14.5V16M2 9h1.5M14.5 9H16M3.757 3.757l1.06 1.06M13.182 13.182l1.061 1.061M3.757 14.243l1.06-1.06M13.182 4.818l1.061-1.061" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
function IconChevronLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function IconChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function IconLogout() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M11 11l3-3-3-3M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function IconMenu() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
function IconX() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
function IconBell() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M9 2a5 5 0 00-5 5v3l-1.5 2h13L14 10V7a5 5 0 00-5-5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7.5 14.5a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
function IconBitcoin() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
      <path d="M10.97 6.63c.18-1.08-.64-1.66-1.73-2.05l.35-1.44-.86-.22-.34 1.4c-.22-.06-.45-.11-.69-.16l.35-1.4-.86-.22-.35 1.46c-.18-.04-.35-.08-.52-.12l.01.01-1.18-.3-.23.91s.64.15.62.16c.35.09.41.34.4.53l-.43 1.76.1.03-.1-.03-.56 2.29c-.04.1-.16.26-.42.2 0 0-.63-.16-.63-.16l-.43.97 1.12.28c.21.05.42.11.62.17l-.36 1.48.86.22.35-1.46c.24.07.47.13.7.16l-.35 1.45.86.22.35-1.47c1.57.3 2.75.18 3.25-1.24.4-1.13-.02-1.78-.83-2.2.59-.14 1.04-.52 1.15-1.32zm-2.06 2.88c-.28 1.15-2.2.53-2.82.37l.5-2.02c.62.16 2.6.47 2.32 1.65zm.33-2.91c-.25 1.05-1.82.52-2.33.39l.46-1.85c.51.13 2.14.38 1.87 1.46z"/>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Nav configuration
// ---------------------------------------------------------------------------
interface NavItem {
  href:  string;
  label: string;
  Icon:  () => React.JSX.Element;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard',    label: 'Dashboard',    Icon: IconDashboard    },
  { href: '/buy',          label: 'Buy BTC',      Icon: IconBuyBTC       },
  { href: '/sell',         label: 'Sell BTC',     Icon: IconSellBTC      },
  { href: '/transactions', label: 'Transactions', Icon: IconTransactions },
  { href: '/profile',      label: 'Profile',      Icon: IconProfile      },
  { href: '/settings',     label: 'Settings',     Icon: IconSettings     },
];

// ---------------------------------------------------------------------------
// NavLink
// ---------------------------------------------------------------------------
function NavLink({
  item,
  active,
  collapsed,
  onClick,
}: {
  item:      NavItem;
  active:    boolean;
  collapsed: boolean;
  onClick?:  () => void;
}) {
  const { Icon } = item;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      style={{
        display:        'flex',
        alignItems:     'center',
        gap:            '10px',
        padding:        collapsed ? '10px 0' : '10px 12px 10px 10px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        borderRadius:   '8px',
        fontSize:       '14px',
        fontWeight:     500,
        textDecoration: 'none',
        position:       'relative',
        transition:     'background 140ms ease, color 140ms ease',
        color:          active ? C.brand : C.textSecondary,
        background:     active ? C.brandSubtle : 'transparent',
        // Left accent border simulation via box-shadow so it doesn't eat padding
        boxShadow:      active
          ? `inset 3px 0 0 0 ${C.brand}`
          : 'inset 3px 0 0 0 transparent',
        overflow:    'hidden',
        whiteSpace:  'nowrap',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          const el = e.currentTarget as HTMLAnchorElement;
          el.style.background = C.bgHover;
          el.style.color      = C.textPrimary;
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          const el = e.currentTarget as HTMLAnchorElement;
          el.style.background = 'transparent';
          el.style.color      = C.textSecondary;
        }
      }}
    >
      <span style={{ flexShrink: 0, display: 'flex' }}>
        <Icon />
      </span>
      {!collapsed && (
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.label}
        </span>
      )}
    </Link>
  );
}

// ---------------------------------------------------------------------------
// SidebarInner — extracted to stable component to prevent re-mount issues
// ---------------------------------------------------------------------------
interface SidebarInnerProps {
  collapsed:         boolean;
  isDesktop:         boolean;
  onToggleCollapse?: () => void;
  onClose?:          () => void;
}

function SidebarInner({
  collapsed,
  isDesktop,
  onToggleCollapse,
  onClose,
}: SidebarInnerProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  const userInitials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : '?';
  const userName  = user ? `${user.firstName} ${user.lastName}`.trim() : '';
  const userEmail = user?.email ?? '';

  return (
    <div
      style={{
        display:       'flex',
        flexDirection: 'column',
        height:        '100%',
        width:         '100%',
        background:    C.bgElevated,
        borderRight:   `1px solid ${C.border}`,
        overflow:      'hidden',
        fontFamily:    "'Inter', 'SF Pro Display', system-ui, sans-serif",
      }}
    >
      {/* ------------------------------------------------------------------ */}
      {/* Logo row                                                            */}
      {/* ------------------------------------------------------------------ */}
      <div
        style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding:        collapsed ? '15px 0' : '15px 14px',
          borderBottom:   `1px solid ${C.border}`,
          flexShrink:     0,
          minHeight:      '64px',
        }}
      >
        <div
          style={{
            display:    'flex',
            alignItems: 'center',
            gap:        '10px',
            overflow:   'hidden',
          }}
        >
          {/* Bitcoin icon badge */}
          <div
            style={{
              width:          '34px',
              height:         '34px',
              borderRadius:   '9px',
              background:     'linear-gradient(135deg, #FF9A24 0%, #F7931A 50%, #E07800 100%)',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              flexShrink:     0,
              boxShadow:      `0 0 12px ${C.brandGlow}`,
            }}
          >
            <IconBitcoin />
          </div>

          {!collapsed && (
            <span
              style={{
                fontWeight:    700,
                fontSize:      '17px',
                color:         C.textPrimary,
                letterSpacing: '-0.02em',
                whiteSpace:    'nowrap',
              }}
            >
              LipaBit
            </span>
          )}
        </div>

        {/* Desktop: collapse toggle */}
        {isDesktop && onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{
              width:          '26px',
              height:         '26px',
              borderRadius:   '6px',
              border:         `1px solid ${C.border}`,
              background:     'transparent',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              cursor:         'pointer',
              color:          C.textMuted,
              flexShrink:     0,
              transition:     'background 140ms ease, color 140ms ease',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.background = C.bgHover;
              el.style.color      = C.textPrimary;
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.background = 'transparent';
              el.style.color      = C.textMuted;
            }}
          >
            {collapsed ? <IconChevronRight /> : <IconChevronLeft />}
          </button>
        )}

        {/* Mobile: close button */}
        {!isDesktop && onClose && (
          <button
            onClick={onClose}
            aria-label="Close menu"
            style={{
              width:          '30px',
              height:         '30px',
              borderRadius:   '6px',
              border:         'none',
              background:     'transparent',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              cursor:         'pointer',
              color:          C.textSecondary,
            }}
          >
            <IconX />
          </button>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Navigation                                                          */}
      {/* ------------------------------------------------------------------ */}
      <nav
        style={{
          flex:          1,
          padding:       '10px 8px',
          display:       'flex',
          flexDirection: 'column',
          gap:           '2px',
          overflowY:     'auto',
          overflowX:     'hidden',
        }}
      >
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={
              pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href + '/'))
            }
            collapsed={collapsed}
            onClick={onClose}
          />
        ))}
      </nav>

      {/* ------------------------------------------------------------------ */}
      {/* User footer                                                         */}
      {/* ------------------------------------------------------------------ */}
      <div
        style={{
          borderTop: `1px solid ${C.border}`,
          padding:   collapsed ? '10px 8px' : '10px 8px',
          flexShrink: 0,
        }}
      >
        {/* Avatar + info */}
        <div
          style={{
            display:        'flex',
            alignItems:     'center',
            gap:            '10px',
            padding:        collapsed ? '6px 0' : '6px 8px',
            borderRadius:   '8px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            overflow:       'hidden',
            marginBottom:   '4px',
          }}
        >
          {/* Avatar circle */}
          <div
            title={collapsed ? userName || undefined : undefined}
            style={{
              width:          '34px',
              height:         '34px',
              borderRadius:   '50%',
              background:     'rgba(247,147,26,0.12)',
              border:         `1.5px solid ${C.brandBorder}`,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              fontSize:       '11px',
              fontWeight:     700,
              color:          C.brand,
              flexShrink:     0,
              letterSpacing:  '0.05em',
              userSelect:     'none',
            }}
          >
            {userInitials}
          </div>

          {!collapsed && (
            <div style={{ minWidth: 0, flex: 1 }}>
              <p
                style={{
                  margin:       0,
                  fontSize:     '13px',
                  fontWeight:   600,
                  color:        C.textPrimary,
                  whiteSpace:   'nowrap',
                  overflow:     'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight:   '1.35',
                }}
              >
                {userName || 'User'}
              </p>
              <p
                style={{
                  margin:       0,
                  fontSize:     '11px',
                  color:        C.textSecondary,
                  whiteSpace:   'nowrap',
                  overflow:     'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight:   '1.35',
                }}
              >
                {userEmail}
              </p>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          title={collapsed ? 'Sign out' : undefined}
          style={{
            width:          '100%',
            display:        'flex',
            alignItems:     'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap:            '8px',
            padding:        collapsed ? '9px 0' : '9px 12px',
            borderRadius:   '8px',
            border:         'none',
            background:     'transparent',
            cursor:         'pointer',
            fontSize:       '13px',
            fontWeight:     500,
            color:          C.textSecondary,
            transition:     'background 140ms ease, color 140ms ease',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.background = C.dangerSubtle;
            el.style.color      = C.danger;
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.background = 'transparent';
            el.style.color      = C.textSecondary;
          }}
        >
          <span style={{ flexShrink: 0, display: 'flex' }}>
            <IconLogout />
          </span>
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root layout
// ---------------------------------------------------------------------------
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed,   setCollapsed]   = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [hydrated,    setHydrated]    = useState(false);

  const pathname     = usePathname();
  const prevPath     = useRef(pathname);

  // Hydrate collapsed state from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) setCollapsed(stored === 'true');
    } catch {}
    setHydrated(true);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    if (pathname !== prevPath.current) {
      prevPath.current = pathname;
      setMobileOpen(false);
    }
  }, [pathname]);

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const toggleCollapse = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem(STORAGE_KEY, String(next)); } catch {}
      return next;
    });
  }, []);

  const openMobile  = useCallback(() => setMobileOpen(true),  []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const desktopWidth = hydrated
    ? collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED
    : SIDEBAR_EXPANDED;

  return (
    <div
      style={{
        minHeight:     '100vh',
        background:    C.bgBase,
        display:       'flex',
        flexDirection: 'column',
        fontFamily:    "'Inter', 'SF Pro Display', system-ui, sans-serif",
        color:         C.textPrimary,
      }}
    >
      {/* ------------------------------------------------------------------ */}
      {/* Mobile top-bar                                                      */}
      {/* ------------------------------------------------------------------ */}
      <header
        className="lg:hidden"
        style={{
          height:       '56px',
          background:   C.bgElevated,
          borderBottom: `1px solid ${C.border}`,
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'space-between',
          padding:      '0 16px',
          position:     'sticky',
          top:          0,
          zIndex:       200,
          flexShrink:   0,
        }}
      >
        {/* Hamburger button */}
        <button
          onClick={openMobile}
          aria-label="Open navigation"
          style={{
            width:          '36px',
            height:         '36px',
            borderRadius:   '8px',
            border:         `1px solid ${C.border}`,
            background:     'transparent',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            cursor:         'pointer',
            color:          C.textSecondary,
          }}
        >
          <IconMenu />
        </button>

        {/* Center: Logo + wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width:          '28px',
              height:         '28px',
              borderRadius:   '7px',
              background:     'linear-gradient(135deg, #FF9A24 0%, #F7931A 50%, #E07800 100%)',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              boxShadow:      `0 2px 8px ${C.brandGlow}`,
              flexShrink:     0,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="white">
              <path d="M10.97 6.63c.18-1.08-.64-1.66-1.73-2.05l.35-1.44-.86-.22-.34 1.4c-.22-.06-.45-.11-.69-.16l.35-1.4-.86-.22-.35 1.46c-.18-.04-.35-.08-.52-.12l.01.01-1.18-.3-.23.91s.64.15.62.16c.35.09.41.34.4.53l-.43 1.76.1.03-.1-.03-.56 2.29c-.04.1-.16.26-.42.2 0 0-.63-.16-.63-.16l-.43.97 1.12.28c.21.05.42.11.62.17l-.36 1.48.86.22.35-1.46c.24.07.47.13.7.16l-.35 1.45.86.22.35-1.47c1.57.3 2.75.18 3.25-1.24.4-1.13-.02-1.78-.83-2.2.59-.14 1.04-.52 1.15-1.32zm-2.06 2.88c-.28 1.15-2.2.53-2.82.37l.5-2.02c.62.16 2.6.47 2.32 1.65zm.33-2.91c-.25 1.05-1.82.52-2.33.39l.46-1.85c.51.13 2.14.38 1.87 1.46z"/>
            </svg>
          </div>
          <span
            style={{
              fontWeight:    700,
              fontSize:      '16px',
              color:         C.textPrimary,
              letterSpacing: '-0.02em',
            }}
          >
            LipaBit
          </span>
        </div>

        {/* Notifications bell */}
        <button
          aria-label="Notifications"
          style={{
            width:          '36px',
            height:         '36px',
            borderRadius:   '8px',
            border:         `1px solid ${C.border}`,
            background:     'transparent',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            cursor:         'pointer',
            color:          C.textSecondary,
            position:       'relative',
          }}
        >
          <IconBell />
          {/* Unread indicator dot */}
          <span
            style={{
              position:     'absolute',
              top:          '8px',
              right:        '8px',
              width:        '7px',
              height:       '7px',
              borderRadius: '50%',
              background:   C.brand,
              border:       `1.5px solid ${C.bgElevated}`,
            }}
          />
        </button>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* Body row                                                            */}
      {/* ------------------------------------------------------------------ */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Desktop sidebar */}
        <motion.aside
          className="hidden lg:flex"
          animate={{ width: desktopWidth }}
          transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          style={{
            height:     '100vh',
            position:   'sticky',
            top:        0,
            flexShrink: 0,
            overflow:   'hidden',
          }}
        >
          {hydrated && (
            <SidebarInner
              collapsed={collapsed}
              isDesktop={true}
              onToggleCollapse={toggleCollapse}
            />
          )}
        </motion.aside>

        {/* Main content */}
        <main
          style={{
            flex:       1,
            overflowY:  'auto',
            overflowX:  'hidden',
            padding:    '32px',
            minWidth:   0,
          }}
        >
          {children}
        </main>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Mobile drawer + backdrop                                            */}
      {/* ------------------------------------------------------------------ */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="mobile-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeMobile}
              className="lg:hidden"
              style={{
                position:   'fixed',
                inset:      0,
                background: 'rgba(11,14,17,0.75)',
                backdropFilter: 'blur(3px)',
                zIndex:     300,
              }}
            />

            {/* Drawer */}
            <motion.div
              key="mobile-drawer"
              initial={{ x: -SIDEBAR_EXPANDED }}
              animate={{ x: 0 }}
              exit={{ x: -SIDEBAR_EXPANDED }}
              transition={{ duration: 0.26, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="lg:hidden"
              style={{
                position: 'fixed',
                top:      0,
                left:     0,
                bottom:   0,
                width:    SIDEBAR_EXPANDED,
                zIndex:   400,
              }}
            >
              <SidebarInner
                collapsed={false}
                isDesktop={false}
                onClose={closeMobile}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
