
export const meta = {
  name: 'lipabit-full-redesign',
  description: 'Complete production redesign — premium landing page, user UX, admin panel, RBAC',
  phases: [
    { title: 'Landing Page', detail: 'Build world-class fintech landing page from scratch' },
    { title: 'User Experience', detail: 'Premium dashboard, profile, settings pages' },
    { title: 'Admin Panel', detail: 'Full operations center with RBAC' },
    { title: 'Backend RBAC', detail: 'Role-based access control with SUPPORT/ADMIN/SUPER_ADMIN' },
  ],
}

phase('Landing Page')

const landing = await agent(`You are a Principal Product Designer and Senior Frontend Engineer building a WORLD-CLASS fintech landing page.

Platform: LipaBit — Bitcoin ↔ M-Pesa exchange, Kenya
Stack: Next.js 15, TypeScript, Tailwind CSS, Framer Motion

DESIGN TOKENS:
- Background base: #0B0E11
- Background elevated: #131720
- Card: #1C1F26
- Card secondary: #22262F
- Brand orange: #F7931A
- Text primary: #EAECEF
- Text secondary: #848E9C
- Text muted: #5A6275
- Success: #0ECB81
- Danger: #F6465D
- Warning: #F0B90B
- Border: rgba(255,255,255,0.06)

REFERENCES: Binance, Coinbase, Stripe, Revolut — not a startup template.

Write the COMPLETE file content for /home/pinky/lipabit/apps/web/app/page.tsx

The page must have these sections in order:

1. NAVBAR — sticky, blur backdrop, logo + nav links + Sign In + Get Started CTA

2. HERO SECTION:
   - Left side: Badge "🇰🇪 Kenya's #1 Bitcoin Exchange", headline "Buy Bitcoin.\nSell Bitcoin.\nInstant M-Pesa.", subheadline about 60-second settlements, Buy Bitcoin button (orange gradient) + Sell Bitcoin button (ghost), trust badges row (CBK Compliant, 256-bit SSL, 38,000+ Users)
   - Right side: A BEAUTIFUL animated trading card mock-up showing:
     * Live BTC price with pulsing indicator (fetch from /api/v1/trading/rate)
     * Buy rate / Sell rate
     * A mock buy order form with amount input and "Buy Now" button
     * Small recent transactions list
   - Background: radial orange glow behind the card, dark base

3. ANIMATED STATS BAR — four stats with counting animations on scroll:
   "KES 2.4B+" traded, "38,000+" verified users, "99.97%" uptime, "< 45 sec" avg settlement

4. HOW IT WORKS — two tabs (Buy BTC / Sell BTC), each showing 3 steps with connecting arrows:
   BUY: 1. Send M-Pesa → 2. We confirm payment → 3. Receive Bitcoin in 60s
   SELL: 1. Send Bitcoin → 2. We confirm on-chain → 3. Receive M-Pesa instantly

5. LIVE MARKET — live BTC/KES price card, buy/sell rates, a sparkline mini chart (use SVG path animation), price change indicator (up/down with color), refresh every 15s

6. FEATURES — 6 cards on a grid:
   - Instant M-Pesa Settlement
   - Non-custodial Wallet Option
   - Real-time Rate Feeds
   - AML/KYC Compliance
   - 24/7 Customer Support
   - Mobile-First Design
   Each card: icon + title + description, hover glow effect

7. WHY LIPABIT — comparison table (us vs P2P marketplaces vs informal traders):
   Rows: Settlement speed, Security, Rate transparency, KYC process, Support, Availability
   Use checkmarks and X marks with color coding

8. FAQ — accordion with smooth height animation:
   Q: How fast are transactions?
   Q: What documents do I need for KYC?
   Q: What are the transaction limits?
   Q: How is my Bitcoin stored?
   Q: What are the fees?
   Q: Is LipaBit regulated?

9. FINAL CTA SECTION — full-width gradient section, headline "Start trading in under 5 minutes", two CTA buttons, background with subtle animated pattern

10. FOOTER — 4 columns: LipaBit brand + tagline + socials, Company links, Trade links, Legal/Support links. Bottom bar with copyright + policy links.

CRITICAL REQUIREMENTS:
- 'use client' at top
- Import { motion, AnimatePresence, useInView, useAnimation } from 'framer-motion'
- Import { useState, useEffect, useRef, useCallback } from 'react'
- Import { api } from '@/lib/api'
- Import Link from 'next/link'
- Fetch live rate from /api/v1/trading/rate on mount and poll every 15s
- Animated counters in stats section using useInView + counting animation
- All sections fade-slide-up on scroll
- Zero placeholder text — real, professional copy throughout
- NO white backgrounds, NO light colors — everything dark
- Mobile responsive (hamburger menu on mobile)
- The page must look like it cost $50,000 to design

Write the COMPLETE file. Every line. No truncation. No placeholders. This is production code.`, { label: 'landing-page', phase: 'Landing Page' })

phase('User Experience')

const [dashboard, buyPage, sellPage, profilePage, transactionsPage] = await parallel([
  () => agent(`Write the COMPLETE redesigned dashboard page for /home/pinky/lipabit/apps/web/app/(dashboard)/dashboard/page.tsx

Design tokens: bg #0B0E11, card #1C1F26, brand #F7931A, success #0ECB81, danger #F6465D, text #EAECEF/#848E9C

'use client' — uses framer-motion, api client, useAuthStore

Build a PREMIUM Binance-quality dashboard with:
1. Page header: "Good morning, [name]" + date + Refresh button
2. TOP ROW — 4 metric cards with hover glow:
   - BTC Balance (sats + KES value + BTC)
   - Today's Portfolio Change (up/down with %)
   - Total Traded (cumulative KES)
   - Pending Transactions (count badge)
3. MIDDLE ROW — 2 col:
   Left: Live BTC Price Card with mini sparkline (8 SVG data points), buy/sell rate, last updated
   Right: Quick Trade card — tabs Buy/Sell, amount input, phone input, quote, submit
4. BOTTOM ROW — Recent transactions table (last 5) with status badges, amounts, timestamps, type icons
5. KYC status banner (if not APPROVED) — amber with progress steps
6. All data fetched from: /api/v1/users/me, /api/v1/trading/rate, /api/v1/trading/transactions?limit=5
7. Skeleton loaders for all async data
8. framer-motion stagger entrance animation for cards
9. Poll rate every 15s

Complete file. No truncation.`, { label: 'dashboard', phase: 'User Experience' }),

  () => agent(`Write the COMPLETE redesigned buy page for /home/pinky/lipabit/apps/web/app/(dashboard)/buy/page.tsx

Design: dark fintech, #0B0E11 bg, #1C1F26 cards, #F7931A brand

'use client' — framer-motion, react-hook-form, zod, api

Build a premium buy flow with:
1. Page header with live BTC price badge (auto-refreshing)
2. TWO COLUMN LAYOUT:
   LEFT COLUMN (form):
   - Amount input (KES) with large font, currency formatting as you type
   - Quick amount chips: [500] [1,000] [5,000] [10,000] [50,000]
   - Phone input with Kenya flag (+254)
   - Tier limit indicator (progress bar: used / limit)
   - Submit button (orange gradient)
   RIGHT COLUMN (live quote):
   - Animates in when amount > 0
   - Shows: Amount, Fee (X%), Spread (1%), Total sats you get
   - BTC rate used
   - "Quote valid for Xs" countdown ring
   - "Rate refreshes in Xs" secondary label
3. PROCESSING STATE: Phone pulse animation (pulsing rings + phone icon), "Check your M-Pesa" message
4. SUCCESS STATE: Animated SVG checkmark, receipt card, "Buy More" button
5. ERROR STATE: Red banner, "Try Again" button
6. Zod validation: amountKes min 500, phone +254XXXXXXXXX
7. Debounced quote fetch on amount change

Complete file. No truncation.`, { label: 'buy-page', phase: 'User Experience' }),

  () => agent(`Write the COMPLETE redesigned profile page for /home/pinky/lipabit/apps/web/app/(dashboard)/profile/page.tsx

Design: dark fintech, same tokens

'use client' — framer-motion, react-hook-form, api

Sections:
1. Profile header card: Avatar initials circle, name, email, member since, role badge
2. TABS: Profile | Verification | Security | Wallet
   
TAB: Profile
- Editable form: First Name, Last Name, Phone
- Save changes button

TAB: Verification (KYC)
- Tier progress bar: Tier 1 → Tier 2 → Tier 3
- Current tier limits table (daily limits, max tx)
- KYC status (NONE/PENDING/APPROVED/REJECTED) with appropriate UI
- If NONE: "Start Verification" card with steps
- If PENDING: "Under Review" with expected timeline
- If APPROVED: Green badge with tier details
- If REJECTED: Red banner + rejection reason + "Re-submit" button
- Document upload UI (ID front, ID back, selfie)

TAB: Security
- 2FA toggle (placeholder — coming soon badge)
- Active sessions list (device, IP, last seen)
- "Sign out all sessions" button
- Password change form

TAB: Wallet
- Bitcoin deposit address (with QR-like display and copy button)
- Balance: sats + BTC + KES value
- Deposit instructions

Complete file. No truncation.`, { label: 'profile-page', phase: 'User Experience' }),

  () => agent(`Write the COMPLETE redesigned sell page for /home/pinky/lipabit/apps/web/app/(dashboard)/sell/page.tsx

Design: dark fintech (#0B0E11, #1C1F26, #F7931A)

'use client' — framer-motion, react-hook-form, zod, api

Build a premium sell flow:
1. Page header with current BTC balance prominently shown
2. TWO COLUMN:
   LEFT:
   - Input: Amount in sats (with BTC equivalent shown below)
   - Toggle: sats / BTC input mode
   - "Sell Max" button
   - Phone input (+254 Kenya)
   - Real-time KES payout preview
   - Confirmation checkbox: "I confirm I'm selling X sats for KES Y"
   - Submit: dark red-tinted button "Sell Bitcoin"
   RIGHT:
   - Quote panel: gross KES, fee, net KES payout
   - Current sell rate
   - Processing time estimate: ~2 minutes
   - Fee breakdown
3. CONFIRM MODAL: slide-up modal with full order summary before final submission
4. PROCESSING STATE: spinning loader + "Initiating M-Pesa payout..."
5. SUCCESS: animated checkmark + receipt + "View Transactions" link
6. Zero balance state: empty state with "Buy Bitcoin first"

Complete file. No truncation.`, { label: 'sell-page', phase: 'User Experience' }),

  () => agent(`Write the COMPLETE redesigned transactions page for /home/pinky/lipabit/apps/web/app/(dashboard)/transactions/page.tsx

Design: dark fintech premium

'use client' — framer-motion, api

Build a premium transaction history:
1. Header: "Transaction History" + total count + filter bar
2. FILTER BAR: pills (All | Buy | Sell | Completed | Pending | Failed) + date range picker (simple)
3. TRANSACTION TABLE (desktop) / CARD LIST (mobile):
   Each row:
   - Icon: orange arrow-down (buy) or red arrow-up (sell)
   - Type badge: BUY/SELL pill
   - Reference: monospace, truncated with copy button
   - Date: "2 hours ago" with full date on hover
   - Amount KES: formatted
   - Amount sats: formatted  
   - Status badge: green/yellow/red
   - Expand chevron
   EXPANDED:
   - Full reference
   - M-Pesa receipt number
   - BTC rate used
   - Fee breakdown
   - Timestamps
4. Skeleton loaders (5 rows) during loading
5. Empty state: illustration-style with "No transactions yet" + Buy/Sell CTAs
6. Pagination: Previous/Next with page indicator
7. Export button (downloads CSV stub)

Complete file. No truncation.`, { label: 'transactions-page', phase: 'User Experience' }),
])

phase('Admin Panel')

const [adminLayout, adminDashboard, adminUsers, adminKyc, adminTransactions] = await parallel([
  () => agent(`Write the COMPLETE admin layout for /home/pinky/lipabit/apps/web/app/(admin)/layout.tsx

This is a separate layout from the user dashboard.

Design: Slightly different sidebar — darker, more serious, admin-specific navigation.

'use client' — framer-motion, useAuthStore, next/navigation

Requirements:
1. Check role on mount — redirect to /dashboard if not ADMIN/SUPER_ADMIN/SUPPORT
2. Sidebar sections:
   OVERVIEW: Dashboard
   OPERATIONS: Users, KYC Reviews, Transactions
   SYSTEM (SUPER_ADMIN only): Settings, Audit Logs, Analytics
   Show role badge on sidebar (ADMIN / SUPPORT / SUPER_ADMIN)
3. Top bar: "Admin Panel" breadcrumb + current page + admin user avatar + logout
4. Role-based nav item visibility
5. Collapsible sidebar same as user layout
6. Red/orange color accent for admin (distinct from user green)

Include a file /home/pinky/lipabit/apps/web/app/(admin)/page.tsx that redirects to /admin/dashboard.

Complete file. No truncation.`, { label: 'admin-layout', phase: 'Admin Panel' }),

  () => agent(`Write the COMPLETE admin dashboard for /home/pinky/lipabit/apps/web/app/(admin)/dashboard/page.tsx

Design: Premium operations center, dark fintech

'use client' — framer-motion, api (calls /api/v1/admin/*)

Build a professional admin operations dashboard:

1. TOP METRICS ROW (6 cards):
   - Total Users (with daily growth %)
   - Total Volume KES (7d)
   - Total Revenue KES (fees, 7d)
   - Pending KYC Reviews (with urgent badge if > 10)
   - Active Transactions (in-progress)
   - Failed Transactions Today (red if > 0)

2. ALERTS SECTION (if any):
   - Pending KYC > 5: amber warning
   - Failed transactions today: red alert
   - Each dismissible

3. RECENT ACTIVITY TABLE:
   Last 10 transactions with:
   - User email (truncated)
   - Type (Buy/Sell)
   - Amount KES
   - Status badge
   - Time ago
   - "View" link

4. PENDING KYC QUEUE (up to 5):
   - User name + email
   - Submitted date
   - Documents uploaded count
   - "Review" button

5. REVENUE CHART (SVG sparkline, 7 days):
   Simple bar chart with daily fees

All data from /api/v1/admin/dashboard

Complete file. No truncation.`, { label: 'admin-dashboard', phase: 'Admin Panel' }),

  () => agent(`Write the COMPLETE admin users page for /home/pinky/lipabit/apps/web/app/(admin)/users/page.tsx

Design: Premium admin panel, dark fintech

'use client' — framer-motion, api

Build a professional user management page:

1. SEARCH + FILTERS BAR:
   - Search input (email, name)
   - Filter: All / Verified / Unverified / Suspended
   - Filter: KYC (None / Pending / Approved / Rejected)
   - Filter: Role (User / Support / Admin)

2. USERS TABLE:
   Columns: Avatar+Name | Email | Phone | KYC Status | Role | Joined | Status | Actions
   - KYC badge: colored pill
   - Status: Active (green dot) / Suspended (red dot)
   - Actions dropdown: View, Edit Role, Suspend/Unsuspend, View Transactions

3. USER DETAIL DRAWER (slides in from right):
   - Full profile info
   - KYC status + documents
   - Transaction history (last 5)
   - Account actions: Suspend, Change Role, Approve KYC, Reject KYC
   - Audit log for this user

4. ROLE CHANGE MODAL:
   - Select new role (USER/SUPPORT/ADMIN — only SUPER_ADMIN can assign ADMIN)
   - Confirmation

5. SUSPEND MODAL:
   - Reason input (required)
   - Confirm button

6. Pagination: 20 per page

All actions call /api/v1/admin/* endpoints

Complete file. No truncation.`, { label: 'admin-users', phase: 'Admin Panel' }),

  () => agent(`Write the COMPLETE admin KYC review page for /home/pinky/lipabit/apps/web/app/(admin)/kyc/page.tsx

Design: Professional document review interface, dark fintech

'use client' — framer-motion, api

Build a KYC review interface:

1. QUEUE VIEW (default):
   - Pending KYC submissions sorted by submitted date
   - Each card: User name/email, ID type, submitted date, tier requested, "Review" button
   - Status tabs: Pending | Approved | Rejected | All
   - Stats: X pending, X approved today, X rejected today

2. REVIEW MODAL (full-screen overlay):
   - Left: User info (name, email, phone, joined date, current tier)
   - Center: Document viewer
     * ID Front image (placeholder/link)
     * ID Back image
     * Selfie
     * ID Number displayed
   - Right: Review panel
     * ID Type detected
     * ID Number
     * Notes textarea (internal notes)
     * Approve button (green)
     * Reject button (red) — requires rejection reason
     * Request Resubmission (amber)
   - Keyboard shortcuts hint: A = Approve, R = Reject

3. BATCH OPERATIONS:
   - Select multiple with checkboxes
   - Bulk approve button

All actions call /api/v1/admin/kyc/* endpoints

Complete file. No truncation.`, { label: 'admin-kyc', phase: 'Admin Panel' }),

  () => agent(`Write the COMPLETE admin transactions page for /home/pinky/lipabit/apps/web/app/(admin)/transactions/page.tsx

Design: Professional transaction monitoring, dark fintech

'use client' — framer-motion, api

Build a transaction monitoring dashboard:

1. STATS ROW:
   - Today's volume (KES)
   - Today's revenue (fees)
   - Pending count
   - Failed count (red badge)

2. FILTERS:
   - Search by reference or user email
   - Type filter: All / Buy / Sell
   - Status filter: All / Pending / Completed / Failed / Cancelled
   - Date range

3. TRANSACTIONS TABLE:
   Columns: Reference | User | Type | Amount KES | Amount Sats | Fee | M-Pesa Receipt | Status | Time | Actions
   - Expandable rows with full JSON details
   - "Mark Failed" action for stuck pending transactions
   - "View User" link

4. FAILED TRANSACTIONS SECTION:
   - Highlighted section at top if failed transactions exist
   - Quick resolve action

5. EXPORT button: generates CSV

All from /api/v1/admin/transactions (needs to be added to admin service)

Complete file. No truncation.`, { label: 'admin-transactions', phase: 'Admin Panel' }),
])

phase('Backend RBAC')

const rbac = await agent(`Update the backend to support 4 roles: USER, SUPPORT, ADMIN, SUPER_ADMIN

Read these files first:
- /home/pinky/lipabit/apps/api/src/admin/admin.controller.ts
- /home/pinky/lipabit/apps/api/src/admin/admin.service.ts
- /home/pinky/lipabit/apps/api/prisma/schema.prisma
- /home/pinky/lipabit/apps/api/src/auth/guards/roles.guard.ts

Make these changes:

1. Update prisma/schema.prisma — add SUPPORT to UserRole enum

2. Update admin.controller.ts:
   - GET /admin/dashboard, /admin/transactions, /admin/users: allow ADMIN, SUPER_ADMIN, SUPPORT
   - POST /admin/kyc/:userId/approve, /admin/kyc/:userId/reject: allow ADMIN, SUPER_ADMIN only
   - POST /admin/users/:userId/suspend: allow ADMIN, SUPER_ADMIN only
   - NEW: PATCH /admin/users/:userId/role — SUPER_ADMIN only
   - NEW: GET /admin/audit-logs — ADMIN, SUPER_ADMIN only
   - SUPPORT role: read-only access

3. Update admin.service.ts — add:
   - changeUserRole(userId, newRole, adminId) — validates role hierarchy (can't promote to ADMIN unless SUPER_ADMIN)
   - getTransactions(filters, page, limit) — with filters for admin transaction monitoring
   - getDashboardStats() — enhanced stats

4. Fix RolesGuard to handle SUPPORT role correctly

Return the COMPLETE updated content for:
[FILE: apps/api/src/admin/admin.controller.ts]
...content...
[FILE: apps/api/src/admin/admin.service.ts]
...content...
[FILE: apps/api/prisma/schema.prisma — just the UserRole enum change]

Label each section clearly.`, { label: 'rbac-backend', phase: 'Backend RBAC' })

log('All agents complete. Writing files...')

return { landing, dashboard, buyPage, sellPage, profilePage, transactionsPage, adminLayout, adminDashboard, adminUsers, adminKyc, adminTransactions, rbac }
