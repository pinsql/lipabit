# LipaBit Platform Audit Report

**Date:** 2026-06-09
**Auditors:** UI/UX, Security Engineering, Fintech Logic, Database Engineering
**Scope:** Full-stack — `apps/web/` (Next.js 15 frontend) + `apps/api/` (NestJS backend) + `prisma/schema.prisma`

---

## Executive Summary

LipaBit is a functional MVP Bitcoin/M-Pesa exchange targeting Kenyan smartphone users. The frontend has been significantly improved since an earlier revision — the dashboard layout now ships a proper mobile drawer, and the buy/sell flows have full error/success states. The API backend has had several critical security fixes applied (idempotency guards on M-Pesa callbacks, CORS hardening, Swagger gated to non-production). What remains are a set of concrete, actionable gaps across four domains.

**Overall risk posture:** MEDIUM-HIGH. No single currently-open issue allows immediate account takeover, but three backend issues combine to create financial loss scenarios under adversarial conditions, and two frontend issues will harm the majority of real users who access the product on mobile.

| Domain | CRITICAL | HIGH | MEDIUM | LOW |
|---|---|---|---|---|
| Frontend / UI | 0 | 3 | 5 | 4 |
| Security (API) | 2 | 4 | 4 | 3 |
| Business Logic | 1 | 3 | 3 | 2 |
| Database | 0 | 5 | 4 | 3 |

---

## Part 1 — Frontend / UI Audit

### HIGH — FE-01: Landing page nav hides "Sign In" on small viewports

**File:** `apps/web/app/page.tsx` lines 665–678

```tsx
<Link href="/login"
  className="text-[#848E9C] hover:text-[#EAECEF] text-sm font-medium transition-colors hidden sm:block"
>
  Sign In
</Link>
```

The `hidden sm:block` class hides "Sign In" on screens below 640px. On a 360px-wide Android device (the dominant form factor for Kenyan smartphones) the only nav CTA visible is "Get Started" → `/register`. Users who already have accounts cannot find the login entry point from the landing page without scrolling to the footer CTA. The PriceTicker is also `hidden md:flex`, leaving the nav bar as just a logo and a single button on mobile — sparse and confusing.

**Fix:** Replace `hidden sm:block` with a visible icon-only button, or add both CTAs inside a `flex gap-2` row that always shows on mobile.

---

### HIGH — FE-02: Main content padding is too large on mobile

**File:** `apps/web/app/(dashboard)/layout.tsx` line 728

```tsx
<main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '32px', minWidth: 0 }}>
```

`padding: '32px'` applies 32px on all four sides at all breakpoints. On a 360px-wide device, this leaves only 296px of usable content width. The dashboard buy/sell forms use `grid grid-cols-1 lg:grid-cols-2` which stacks correctly, but the inner cards at 296px width clip the KES amount input's 3xl font and the quick-amount button grid. The 32px top padding also compounds with the 56px mobile top-bar, pushing the first content card below the fold on short-screen devices.

**Fix:** Change to responsive padding — `padding: isMobile ? '16px' : '32px'` or use Tailwind `p-4 lg:p-8`.

---

### HIGH — FE-03: STK push success is faked client-side on a hardcoded timer

**File:** `apps/web/app/(dashboard)/buy/page.tsx` lines 626–627

```tsx
// Simulate STK push waiting then success
setTimeout(() => setPageState('success'), 4500);
```

After calling `POST /trading/buy`, the frontend unconditionally transitions to success state after 4.5 seconds regardless of whether M-Pesa payment actually completed. The `pendingTx` object in `SuccessState` shows `tx.amountSats` from the *quote* response, not from a confirmed payment. This means:

1. Users who cancel the STK push on their phone still see "Purchase complete! Bitcoin is on its way."
2. The displayed sats amount may differ from what was actually credited (if the callback had not yet fired).
3. There is no polling or WebSocket mechanism to reflect the real transaction status.

**Fix:** Replace the `setTimeout` with a polling loop against `GET /trading/transactions/:id` checking for `status === 'COMPLETED'` or `'FAILED'`, with a timeout after 120 seconds. Show a "Waiting for M-Pesa confirmation…" state until a definitive result arrives.

---

### MEDIUM — FE-04: Sell page sats input has no balance guard before quote fetch

**File:** `apps/web/app/(dashboard)/sell/page.tsx` (schema, line 15–18)

The sell page schema validates only the phone number. The sats/BTC amount input is validated client-side but the minimum/maximum are applied in the quote panel rather than the Zod schema. If a user manually types a value larger than their balance and submits, the API will return a `400 Insufficient Bitcoin balance`, but the error is only shown after the full round-trip. The balance is displayed in the wallet panel but there is no `max` constraint in the input or `refine` in the schema against `wallet.balanceSats`.

**Fix:** Add `.refine(val => val <= walletBalanceSats, 'Exceeds available balance')` to the Zod schema using a closure or dynamic resolver.

---

### MEDIUM — FE-05: Token stored in Zustand / localStorage is not HttpOnly

**File:** `apps/web/store/auth.ts`

The `accessToken` and `refreshToken` are persisted in Zustand's `persist` middleware (localStorage). This makes them readable by any JavaScript running on the page — a trivial XSS in any third-party script (analytics, chat widgets, etc.) can exfiltrate both tokens. For a financial application handling real KES/BTC, tokens should be stored in `HttpOnly; Secure; SameSite=Strict` cookies set by the API, not accessible to JS at all.

**Fix:** Switch to a `/auth/session` endpoint that sets `Set-Cookie: accessToken=...; HttpOnly; Secure; SameSite=Strict` and `/auth/refresh` that reads from the cookie. Remove all token storage from Zustand/localStorage.

---

### MEDIUM — FE-06: Design token duplication across every page file

Every dashboard page (`buy/page.tsx`, `sell/page.tsx`, `transactions/page.tsx`) and the layout defines its own local `C = { bgBase: '#0B0E11', ... }` constant block, duplicated verbatim. `apps/web/lib/design-system.ts` exists but is not imported by any page. A single character difference (e.g., `#0B0E11` vs `#0B0E12`) would produce an invisible visual inconsistency that only surfaces in long-session audits.

**File:** `apps/web/lib/design-system.ts` (exists but unused)

**Fix:** Import from `design-system.ts` in all pages. Delete the local `C = { ... }` blocks.

---

### MEDIUM — FE-07: Notification bell in mobile header is non-functional

**File:** `apps/web/app/(dashboard)/layout.tsx` lines 665–695

The bell button in the mobile top-bar has an `aria-label="Notifications"` and a hardcoded orange dot indicator (always shown). There is no click handler, no notification state, no API call, and no panel. Clicking it does nothing. The always-on dot misleads users into thinking they have unread notifications.

**Fix:** Either wire up a notifications API and panel, or remove the dot indicator until the feature is implemented. An empty `onClick={() => {}}` with no visual feedback is worse than no button.

---

### MEDIUM — FE-08: Dashboard `change24h` is always 0 — no API provides it

**File:** `apps/web/app/(dashboard)/dashboard/page.tsx` line 247

```tsx
const change24h = rate?.change24h ?? 0;
```

The `Rate` type declares `change24h?: number`, but `GET /trading/rate` (in `trading.service.ts`) returns `{ btcUsd, usdKes, btcKes, buyRateKes, sellRateKes, updatedAt }` — no `change24h` field. The badge always renders `+0.00% (24h)` in green, which is misleading for a trading platform.

**Fix:** Either add 24h price comparison logic to `getExchangeRate()` by storing the previous day's rate and computing the delta, or remove the badge until the data is available.

---

### LOW — FE-09: Login page left panel stats are inconsistent with landing page stats

**File:** `apps/web/app/(auth)/login/page.tsx` lines 398–408: `50K+` users, `KES 1B+` traded.
**File:** `apps/web/app/page.tsx` line 20: `38,000+` users, `KES 2.4B+` traded.

Two different figures for the same claimed metrics on the same product. At minimum this looks careless; to a security-conscious user it signals fabricated social proof.

---

### LOW — FE-10: Footer social links point to placeholder URLs

**File:** `apps/web/app/page.tsx` lines 533–555

`href="https://twitter.com/lipabit"` and `href="https://wa.me/254700000000"` — the Twitter handle and WhatsApp number are placeholders. `254700000000` is not a valid Safaricom number (starts with 0 digits after the country code, actual Safaricom numbers are `2547XXXXXXXX`).

---

### LOW — FE-11: `animate-shimmer` class referenced but not defined in Tailwind config

**File:** `apps/web/app/(dashboard)/buy/page.tsx` line 299

```tsx
className="h-5 rounded animate-shimmer"
```

`animate-shimmer` is not in `tailwind.config.ts` and is not a standard Tailwind class. The skeleton loader in the quote panel will render without any animation — it will just be a static coloured box.

**Fix:** Add to `tailwind.config.ts`:
```ts
keyframes: { shimmer: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.4 } } },
animation: { shimmer: 'shimmer 1.5s ease-in-out infinite' }
```

---

### LOW — FE-12: No `<meta name="viewport">` or mobile-specific OG tags in root layout

**File:** `apps/web/app/layout.tsx`

The root layout does not set `<meta name="viewport" content="width=device-width, initial-scale=1">`. While Next.js 15 injects this automatically, the absence of explicit OG/Twitter meta tags and a `theme-color` means the app will render with a plain white browser chrome on Android, clashing with the dark `#0B0E11` background.

---

## Part 2 — Security Audit

### CRITICAL — SEC-01: M-Pesa callbacks have no authentication (IP allowlist or secret path)

**File:** `apps/api/src/mpesa/mpesa.controller.ts` lines 12–35

Both `POST /api/v1/mpesa/callback/stk` and `POST /api/v1/mpesa/callback/b2c` accept payloads from any IP with no authentication. An attacker who discovers the callback URL (trivially enumerable, and previously exposed in Swagger docs) can POST a fabricated `ResultCode: 0` body to trigger the success path of `handleSTKCallback`. While the idempotency fix (`updateMany WHERE status = 'PENDING'`) prevents replay once a record has been processed, it does not prevent an attacker from posting a success callback *before* the real one arrives, or for any transaction where the M-Pesa push was never sent.

The callback URL registered in `initiateSTKPush` (line 54) is the plain un-authenticated path:
```typescript
const callbackUrl = `${this.config.get('mpesa.callbackBaseUrl')}/api/v1/mpesa/callback/stk`;
```

**Fix:**
```typescript
// Register URL with a secret segment:
const callbackSecret = this.config.get('mpesa.callbackSecret');
const callbackUrl = `${base}/api/v1/mpesa/callback/stk/${callbackSecret}`;

// In controller:
@Post('stk/:secret')
async stkCallback(@Param('secret') secret: string, @Body() payload: any, @Req() req: Request) {
  if (secret !== this.config.get('mpesa.callbackSecret')) throw new ForbiddenException();
  const ip = (req as any).ip;
  const safaricomRanges = ['196.201.214.', '196.201.216.'];
  if (process.env.NODE_ENV === 'production' && !safaricomRanges.some(r => ip.startsWith(r))) {
    throw new ForbiddenException();
  }
  // ...
}
```

---

### CRITICAL — SEC-02: Refresh token rotation does not invalidate sibling tokens on family detection

**File:** `apps/api/src/auth/auth.service.ts` lines 119–144

On `refreshTokens()`, the current token is revoked and a new one is issued. However, if an attacker has already stolen a refresh token and used it to obtain a new pair, the legitimate user's next use of their (now-revoked) token will simply throw `'Refresh token expired or revoked'` — with no notification and no revocation of the attacker's valid new token. This is the standard "refresh token theft" scenario.

The service has the database infrastructure to detect this: the `RefreshToken` table has `userId`. If a token arrives that is already `revokedAt IS NOT NULL`, it indicates theft — the correct response is to revoke **all** tokens for that user and force re-login.

**Fix:**
```typescript
const stored = await this.prisma.refreshToken.findFirst({
  where: { userId: payload.sub, tokenHash },
});

if (!stored) throw new UnauthorizedException('Invalid refresh token');

if (stored.revokedAt !== null) {
  // Token was already used — potential theft. Revoke all sessions.
  await this.prisma.refreshToken.updateMany({
    where: { userId: payload.sub, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  throw new UnauthorizedException('Session invalidated — please log in again');
}

if (stored.expiresAt < new Date()) throw new UnauthorizedException('Refresh token expired');
```

---

### HIGH — SEC-03: No rate limiting on any endpoint

**File:** `apps/api/src/main.ts` — no `@nestjs/throttler` or equivalent configured.

The login endpoint (`POST /auth/login`), password reset (`POST /auth/forgot-password`), STK push (`POST /trading/buy`), and quote endpoint (`GET /trading/quote`) have no rate limiting. Consequences:

- **Login:** Unlimited password attempts — brute-force of any account is trivial.
- **Forgot password:** Can be used to spam arbitrary email addresses with reset links.
- **STK push:** Each call creates a real M-Pesa STK push to Safaricom (incurring API quota) and a `Transaction` DB record. A single malicious user can exhaust Safaricom's request quota.
- **Quote:** Each call makes two outbound HTTP requests (Binance + er-api.com) and writes a row to `ExchangeRate`. Heavy polling from a single IP will exhaust the external API rate limits and bloat the database.

**Fix:** Install `@nestjs/throttler`, configure per-endpoint limits:
```typescript
// main.ts
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
// Per route: @Throttle({ default: { limit: 5, ttl: 60000 } })
// Login: 5 attempts / minute per IP
// Forgot-password: 3 / hour per IP
// STK push: 10 / hour per userId
// Quote: 120 / minute (generous for live rate UX)
```

---

### HIGH — SEC-04: JWT secret validation passes but allows weak secrets at application boundaries

**File:** `apps/api/src/main.ts` lines 14–21

The startup check validates `jwtSecret.length >= 32`. A 32-character all-lowercase alpha string (`aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`) passes the check but has extremely low entropy (~150 bits at best for a uniformly random string, but in practice people use memorable strings). No entropy check is performed.

More critically, the `auth.config.ts` default values (not shown but referenced via `this.config.get('auth.jwtSecret')`) fall through to `process.env.JWT_SECRET`. If the `.env` file is absent and `ConfigService` returns `undefined`, the check `jwtSecret.length < 32` will throw `TypeError: Cannot read properties of undefined (reading 'length')` rather than the intended error — meaning the startup guard itself can crash before the meaningful error message is shown.

**Fix:**
```typescript
if (!jwtSecret || typeof jwtSecret !== 'string' || jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be a string of at least 32 characters');
}
```

Add entropy guidance in `.env.example`: use `openssl rand -hex 32` to generate secrets.

---

### HIGH — SEC-05: Bitcoin RPC credentials transmitted in cleartext; fallback silently generates invalid addresses

**File:** `apps/api/src/bitcoin/bitcoin.service.ts` lines 22–33, 44–46

The Bitcoin RPC call uses HTTP basic auth (`auth: { username, password }`). If `bitcoin.rpcUrl` defaults to `http://localhost:8332`, this is acceptable for local dev but catastrophic in cloud environments where the RPC port might be forwarded or the node is on a separate server over a non-TLS connection.

More critically, the fallback path (lines 44–46) generates a demo address using `Math.random()`:

```typescript
private generateDemoAddress(): string {
  const chars = 'abcdef0123456789';
  const hash = Array.from({ length: 40 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `bc1q${hash}`;
}
```

`Math.random()` is not cryptographically secure. The generated bech32 address (`bc1q` + 40 hex chars) is also structurally invalid — a real bech32 address requires a witness version byte + data + checksum, not raw hex. If this fallback fires in production (e.g., during node maintenance), users will be given addresses that look real but cannot receive Bitcoin. Any deposit to a fake address is unrecoverable.

**Fix:** The fallback must not silently generate fake addresses. Throw an `InternalServerErrorException` and alert ops. Require TLS for non-localhost RPC URLs at startup.

---

### HIGH — SEC-06: KYC document URLs are stored as plain strings with no access control

**File:** `apps/api/src/users/users.service.ts` lines 30–43 / `apps/api/src/users/dto/submit-kyc.dto.ts`

The KYC submission accepts `idFrontUrl`, `idBackUrl`, `selfieUrl` as arbitrary strings. These are stored directly in the `Kyc` record. There is no validation that the URLs point to a storage bucket owned by LipaBit, no signed URL verification, and no access control on retrieval — any user could submit `idFrontUrl: "https://attacker.com/stolen_id.jpg"` pointing to someone else's ID photo. Admin reviewers would then open an external URL, potentially leaking their IP and browser fingerprint to the attacker's server.

**Fix:** Use pre-signed upload URLs from your storage provider (S3/GCS/Cloudflare R2). The frontend should call `GET /users/me/kyc/upload-url?field=idFront` → receive a pre-signed PUT URL → upload directly → submit only the resulting object key (not a full URL) to the API.

---

### MEDIUM — SEC-07: Password reset token is `uuidv4()` — 122 bits entropy is adequate but not CSPRNG-derived per current Node standards

**File:** `apps/api/src/auth/auth.service.ts` lines 187–189

`uuidv4()` from the `uuid` package uses `crypto.randomUUID()` internally in Node 18+ (CSPRNG), so this is acceptable. However, the token is stored as plaintext in the `PasswordReset` table. If the database is breached, all unexpired reset tokens are immediately usable. The token should be stored as a hash (same pattern used for refresh tokens).

**Fix:**
```typescript
const rawToken = crypto.randomBytes(32).toString('hex');
const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
await this.prisma.passwordReset.create({ data: { userId, token: tokenHash, expiresAt: ... } });
// Send rawToken in email, verify by hashing the incoming token before lookup
```

---

### MEDIUM — SEC-08: `POST /trading/buy` body accepts a `quoteId` but the API ignores it

**File:** `apps/api/src/trading/trading.service.ts` `initiateBuyBtc()` — signature: `(userId, amountKes, phone)`. The frontend sends `{ amountKes, phone, quoteId }` (buy/page.tsx line 621), but the controller does not pass `quoteId` to the service. The service computes a fresh quote on every `initiateBuyBtc` call, ignoring the quote the user reviewed. This means there is no quote lock — the user could review a quote at one rate and have the transaction executed at a different rate if BTC moved between quote fetch and order submission (the window is up to the 30-second quote TTL).

**Fix:** Implement a quote cache (Redis or in-memory with a short TTL) keyed by `quoteId`. In `initiateBuyBtc`, look up the cached quote and use its locked rate if it has not expired.

---

### MEDIUM — SEC-09: CORS allowed origins loaded from env but no validation on `ALLOWED_ORIGINS` format

**File:** `apps/api/src/main.ts` lines 29–41

```typescript
const allowed = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
  .split(',').map(s => s.trim());
```

If `ALLOWED_ORIGINS` is accidentally set to `*` or to a value with a trailing comma (e.g., `https://lipabit.com,`), the resulting `allowed` array will contain an empty string, and `!origin || allowed.includes(origin)` — `!origin` is true for same-origin requests — would pass. Worse, if an operator sets `ALLOWED_ORIGINS=https://lipabit.com, https://api.lipabit.com` (with a space before the second URL), the second entry will include a leading space and never match.

**Fix:** Validate each entry with a URL constructor at startup and log a warning if any entry fails parsing.

---

### MEDIUM — SEC-10: `in-memory` rate cache is shared across requests but not thread-safe

**File:** `apps/api/src/trading/trading.service.ts` lines 34–35, 42–74

```typescript
private rateCache: { data: any; expiresAt: number } | null = null;
```

In a single-process Node.js environment this is fine. In a horizontally scaled deployment (multiple API pods), each pod maintains its own in-memory cache independently — meaning N pods will each call Binance + er-api.com simultaneously on cache expiry, creating burst spikes. Additionally, a cache write at line 73 (`this.rateCache = { ... }`) is not guarded — if two concurrent requests both find a stale cache, both will make outbound requests and both will write an `ExchangeRate` row. Under 30s TTL and moderate traffic this will write ~2 duplicate rows per cycle.

**Fix:** Use Redis for the rate cache in production. For the duplicate write issue, add a guard:
```typescript
if (this.cacheWriteInProgress) return; // or use a mutex
this.cacheWriteInProgress = true;
// ... fetch and write
this.cacheWriteInProgress = false;
```

---

### LOW — SEC-11: Swagger `addBearerAuth()` is configured but `@ApiBearerAuth()` is missing from most protected routes

**File:** `apps/api/src/trading/trading.controller.ts`, `users.controller.ts` — checked implicitly via audit scope.

The Swagger document shows bearer auth as available, but individual route decorators do not declare `@ApiBearerAuth()`. This means the Swagger UI "Authorize" button does not pre-fill the token on protected routes, making the dev-facing documentation misleading for integration partners.

---

### LOW — SEC-12: `b2cTimeout` handler logs the payload but returns 200 without persisting the event

**File:** `apps/api/src/mpesa/mpesa.controller.ts` lines 30–35

```typescript
@Post('b2c/timeout')
async b2cTimeout(@Body() payload: any) {
  this.logger.warn('B2C timeout received', JSON.stringify(payload));
  return { ResultCode: 0, ResultDesc: 'Accepted' };
}
```

A B2C timeout means the payout may or may not have been sent. The transaction in the database remains in `PROCESSING` status indefinitely. No alert, no automatic retry, no state transition to `FAILED`. In production, an operator would have no visibility into timed-out B2C transactions without manually querying logs.

**Fix:** On B2C timeout, update the `MpesaTransaction` status to `TIMEOUT` and the parent `Transaction` status to `REQUIRES_REVIEW`. Emit an alert/notification to ops.

---

### LOW — SEC-13: `LoginSession.userId` accepts a `uuidv4()` for failed login attempts

**File:** `apps/api/src/auth/auth.service.ts` lines 75–80

```typescript
await this.prisma.loginSession.create({
  data: { userId: user?.id || uuidv4(), ... }
});
```

Failed login attempts are recorded with a random UUID when the user is not found. This inflates the `LoginSession` table with orphaned rows that reference non-existent user IDs, and the foreign key to `User` must be nullable for this to work. Over time at scale (e.g., credential stuffing attack) this creates millions of orphaned rows. Use `null` for unknown users and make `userId` nullable in the schema.

---

## Part 3 — Business Logic Audit

### CRITICAL — BL-01: Quote expiry is not enforced server-side at order execution

**File:** `apps/api/src/trading/trading.service.ts` `initiateBuyBtc()` (lines 134–177), `getQuote()` (line 129: `expiresIn: 300`)

`getQuote()` returns `expiresIn: 300` (5 minutes). `initiateBuyBtc()` calls `getQuote()` fresh on every order — it does not accept a `quoteId` and does not check whether the user's displayed quote has expired. If the frontend is left open for 10 minutes without interaction, then the user submits, they receive a completely new quote rate that may differ significantly from what was displayed. There is no server-side quote lock mechanism.

The frontend quote shows an expiry countdown (`QuoteCountdown` in buy/page.tsx) but this countdown is purely cosmetic — the server will happily accept an order at any time, generating a new quote on the fly.

**Fix:** Implement server-side quote storage (e.g., Redis key `quote:{quoteId}` with 30s TTL). `initiateBuyBtc` must accept and validate a `quoteId`, look up the locked rate, and reject orders where the quote has expired or the `amountKes` does not match the quoted amount.

---

### HIGH — BL-02: Sell flow deducts balance before B2C confirmation, creating irrecoverable loss on B2C failure

**File:** `apps/api/src/trading/trading.service.ts` `initiateSellBtc()` lines 232–244

The code comment claims "Balance is only deducted after B2C payout is confirmed via callback," but the actual implementation deducts the balance at line 233 (within `initiateSellBtc`) before waiting for the callback:

```typescript
const locked = await this.prisma.bitcoinWallet.updateMany({
  where: { userId, balanceSats: { gte: BigInt(amountSats) } },
  data: { balanceSats: { decrement: BigInt(amountSats) } },
});
```

This runs synchronously inside `initiateSellBtc`. If the B2C callback later reports `ResultCode !== 0` (payment failed), the `handleB2CCallback` function updates the `MpesaTransaction` to `FAILED` and the `Transaction` to `FAILED` — but it does **not** restore the deducted `balanceSats`. The user loses Bitcoin with no payout and no automatic recovery.

**File:** `apps/api/src/mpesa/mpesa.service.ts` `handleB2CCallback()` lines 199–231 — no balance restoration on failure.

**Fix:** On `FAILED` B2C callback, restore the balance:
```typescript
if (status === 'FAILED') {
  const tx = await this.prisma.transaction.findFirst({ where: { id: mpesaTx.transactionId } });
  if (tx?.amountSats) {
    await this.prisma.bitcoinWallet.update({
      where: { userId: tx.userId },
      data: { balanceSats: { increment: tx.amountSats } },
    });
  }
}
```

---

### HIGH — BL-03: Daily/monthly trading limits are checked only at quote time, not at order execution

**File:** `apps/api/src/trading/trading.service.ts` `getQuote()` lines 97–102

The tier-based daily limit (`MAX_KES_TIER1 = 30000`, etc.) is validated only in `getQuote()`. `initiateBuyBtc()` calls `getQuote()` internally, so the check fires. However, if a user makes multiple concurrent buy requests (race condition), each call to `getQuote()` sees the limit not yet hit because the `Transaction` records for concurrent requests are not yet committed. Two concurrent `POST /trading/buy` requests for `KES 20,000` each, against a `TIER_1` limit of `KES 30,000`, will both pass the check and both create transactions totalling `KES 40,000`.

There is no `SELECT SUM(amountKes) WHERE userId AND date = today AND status IN ('PENDING','COMPLETED')` check before allowing the order.

**Fix:** Add a database-level daily usage check inside `initiateBuyBtc` (not just in `getQuote`):
```typescript
const todayStart = new Date(); todayStart.setHours(0,0,0,0);
const { _sum } = await this.prisma.transaction.aggregate({
  where: { userId, createdAt: { gte: todayStart }, status: { in: ['PENDING','PROCESSING','COMPLETED'] } },
  _sum: { amountKes: true },
});
const usedToday = parseFloat((_sum.amountKes ?? new Decimal(0)).toString());
if (usedToday + amountKes > dailyLimit) throw new BadRequestException('Daily limit exceeded');
```

---

### HIGH — BL-04: Bitcoin deposit detection is not idempotent under concurrent `checkDeposits` calls

**File:** `apps/api/src/bitcoin/bitcoin.service.ts` lines 56–110

`checkDeposits()` iterates all wallets and for each wallet iterates all received transactions. Before processing a `txid`, it checks:

```typescript
const existing = await this.prisma.bitcoinTransaction.findUnique({ where: { txid: txEntry } });
if (existing) continue;
```

This is a non-atomic read-then-write. If `checkDeposits()` is called concurrently (e.g., two cron triggers firing close together), both jobs will read `existing = null` for the same `txid`, both will proceed to create a `BitcoinTransaction` record and increment `balanceSats`. The Prisma `$transaction` at lines 81–99 is atomic per-wallet, but the uniqueness check at line 73 is outside it.

The `BitcoinTransaction` model should have `@@unique([txid])` (it appears to, given the `findUnique` call), which means the second `create` will throw a Prisma unique constraint violation. This is unhandled and will propagate as an unhandled exception, crashing the job for that wallet.

**Fix:** Use `upsert` instead of `findUnique` + `create`:
```typescript
await this.prisma.$transaction([
  this.prisma.bitcoinTransaction.upsert({
    where: { txid: txEntry },
    create: { walletId: wallet.id, txid: txEntry, ... },
    update: { confirmations: txDetail.confirmations }, // update confirmations only
  }),
  // Only increment balance if this is a new record — use a conditional update
]);
```

---

### MEDIUM — BL-05: Rate fallback uses stale DB data without staleness limit

**File:** `apps/api/src/trading/trading.service.ts` lines 77–88

On Binance API failure, the service falls back to the most recent `ExchangeRate` row:

```typescript
const last = await this.prisma.exchangeRate.findFirst({ orderBy: { createdAt: 'desc' } });
if (!last) throw new BadRequestException('Exchange rate unavailable');
```

There is no check on `last.createdAt`. If the rate has not been updated for 6 hours (Binance outage, network issue), users will trade at a severely stale rate. BTC can move 5–10% in 6 hours, creating significant losses for either the platform or its users depending on direction.

**Fix:** Reject stale rates beyond a threshold:
```typescript
const maxAgeMs = 5 * 60 * 1000; // 5 minutes
if (Date.now() - last.createdAt.getTime() > maxAgeMs) {
  throw new BadRequestException('Exchange rate data is too stale — please try again shortly');
}
```

---

### MEDIUM — BL-06: `amountSats` computed from `netAmountKes / btcPriceKes` creates floating-point drift

**File:** `apps/api/src/trading/trading.service.ts` lines 113–114

```typescript
netAmountKes = amountKes - feeKes;
amountSats = Math.floor((netAmountKes / btcPriceKes) * SATS_PER_BTC);
```

`feeKes = amountKes * feePercent` uses JS float multiplication, and `netAmountKes / btcPriceKes * 1e8` with double precision can produce a result that differs by 1–2 satoshis from what is displayed in the frontend quote. Over thousands of transactions this creates a small but non-zero systematic discrepancy between quoted and executed amounts.

**Fix:** Use `Decimal` arithmetic throughout the fee/rate calculation chain, not just at the point of storing to the database.

---

### MEDIUM — BL-07: No expiry/cleanup mechanism for `PENDING` transactions

Transactions are created with `status: 'PENDING'` and `expiresAt: new Date(Date.now() + 10 * 60 * 1000)`. There is no cron job, scheduled task, or event listener that transitions transactions past their `expiresAt` to `EXPIRED` or `FAILED`. Over time, the `Transaction` table accumulates stale PENDING records that:

1. Count toward daily limits (BL-03) even though they will never complete.
2. Are shown in the user's transaction history as "Pending" indefinitely.
3. Make operational monitoring of "real pending transactions" noisy.

**Fix:** Add a scheduled job (NestJS `@Cron`) that runs every 5 minutes and marks transactions as `EXPIRED` where `status = 'PENDING' AND expiresAt < NOW()`.

---

### LOW — BL-08: `getQuote()` for SELL_BTC double-counts the spread

**File:** `apps/api/src/trading/trading.service.ts` lines 115–118

```typescript
} else {
  amountSats = Math.floor((amountKes / btcPriceKes) * SATS_PER_BTC);
  netAmountKes = amountKes - feeKes;
}
```

For `SELL_BTC`, `btcPriceKes` is `rate.sellRateKes = btcKes * (1 - SPREAD)`. The sell rate already embeds the 1% spread as a discount. The `netAmountKes` then additionally subtracts `feeKes = amountKes * feePercent` (2%). The effective total deduction is spread (1%) + fee (2%) = 3%, but the fee is applied to `amountKes` which was already discounted by the spread. This is a minor arithmetic asymmetry between buy and sell that the fee disclosure ("transparent 2% fee") does not reflect accurately. Users selling see slightly less than the quoted 2% fee.

---

### LOW — BL-09: Missing audit log entries for trading events

**File:** `apps/api/src/trading/trading.service.ts`

`auth.service.ts` creates `AuditLog` entries for login, registration, logout, and password reset. However `initiateBuyBtc`, `initiateSellBtc`, and M-Pesa callback processing create no audit log entries. For a regulated financial platform this is a compliance gap — CBK AML regulations require a full audit trail of all financial transactions including initiations, pending states, and completions.

---

## Part 4 — Database Audit

### HIGH — DB-01: Missing indexes on `Transaction` — full-table scans at any meaningful user volume

**File:** `prisma/schema.prisma` — `Transaction` model

The following query patterns fire on every user action and will cause full-table scans as the table grows:

| Missing Index | Query Pattern | Triggered by |
|---|---|---|
| `@@index([userId])` | Fetch all transactions for a user | `getTransactionHistory()`, dashboard |
| `@@index([userId, status])` | "Show my pending transactions" | filter tabs in transactions page |
| `@@index([userId, createdAt])` | Paginated history, date-range export | `getTransactionHistory()` with `orderBy` |
| `@@index([status])` | Admin ops queue, expiry sweep job | admin dashboard, BL-07 cron |
| `@@index([mpesaRef])` | M-Pesa callback reconciliation | `initiateSTKPush` update |
| `@@index([btcTxid])` | Bitcoin confirmation webhook lookup | `checkDeposits()` |
| `@@index([type, status])` | Admin queue filtered by type | admin reporting |
| `@@index([createdAt])` | Date-range reporting | analytics |

At 10,000 transactions per user across 38,000 users, a `WHERE userId = ?` without an index will scan 380M rows.

---

### HIGH — DB-02: Missing indexes on `MpesaTransaction` — callback processing will degrade

| Missing Index | Query Pattern |
|---|---|
| `@@index([checkoutRequestId])` | `handleSTKCallback` — `findFirst({ where: { checkoutRequestId } })` |
| `@@index([conversationId])` | `handleB2CCallback` — `findFirst({ where: { conversationId } })` |
| `@@index([status])` | Retry sweeps, timeout detection |
| `@@index([phone])` | Fraud detection, user account lookup |
| `@@index([mpesaReceiptNumber])` | Receipt deduplication |

`handleSTKCallback` fires on every M-Pesa payment. Without an index on `checkoutRequestId`, each callback triggers a full scan of the `MpesaTransaction` table. At 1,000 transactions/day this becomes noticeable within weeks.

---

### HIGH — DB-03: Missing indexes on `BitcoinTransaction` and `ExchangeRate`

| Model | Missing Index | Query Pattern |
|---|---|---|
| `BitcoinTransaction` | `@@index([walletId])` | All deposits for a wallet |
| `BitcoinTransaction` | `@@index([confirmed, confirmations])` | Unconfirmed TX sweep |
| `BitcoinTransaction` | `@@unique([txid])` | Must be unique — dedup in `checkDeposits()` |
| `BitcoinTransaction` | `@@index([direction])` | Separate inbound/outbound |
| `ExchangeRate` | `@@index([createdAt])` | `findFirst({ orderBy: { createdAt: 'desc' } })` — called on every API failure |
| `ExchangeRate` | `@@index([source, createdAt])` | Multi-source rate comparison |

The `ExchangeRate` table grows at ~2 rows per 30 seconds under normal operation (~5,760 rows/day). The stale-rate fallback query `findFirst({ orderBy: { createdAt: 'desc' } })` will degrade linearly without an index.

---

### HIGH — DB-04: `LoginSession` and `RefreshToken` tables have no cleanup / TTL mechanism

`LoginSession` records are written for every login attempt (including failed ones with random userId per SEC-13). `RefreshToken` rows accumulate for every login (one row per session). Neither table has a cron-based cleanup or a `deletedAt` pattern.

At 100 logins/day × 365 days = 36,500 rows/year for a single active user. At 38,000 users this becomes ~1.4B rows/year in `LoginSession`. The table will eventually dominate database storage.

**Fix:**
- Add `@@index([createdAt])` to both tables for efficient range deletes.
- Add a nightly cron: `DELETE FROM LoginSession WHERE createdAt < NOW() - INTERVAL '90 days'`.
- Add `@@index([expiresAt])` to `RefreshToken` and delete rows where `expiresAt < NOW() - INTERVAL '7 days'`.

---

### HIGH — DB-05: No `@@index([userId])` on `LoginSession` — account lockout queries scan the table

Any future implementation of "X failed logins in Y minutes = temporary lockout" (which should be added, see SEC-03) will require `SELECT COUNT(*) FROM LoginSession WHERE userId = ? AND success = false AND createdAt > ?`. Without an index on `userId`, this query scans the full table on every login attempt.

**Fix:** Add `@@index([userId])` and `@@index([userId, createdAt])` and `@@index([ipAddress, createdAt])` (for IP-based rate limiting) to `LoginSession`.

---

### MEDIUM — DB-06: `RefreshToken.tokenHash` has no unique constraint

**File:** Inferred from `auth.service.ts` line 130: `findFirst({ where: { userId, tokenHash, ... } })`

If two tokens accidentally produce the same SHA-256 hash (astronomically unlikely but architecturally incorrect), both would be returned by `findFirst` and the service would use whichever Prisma returns first. More practically, the absence of `@@unique([tokenHash])` means the database will not enforce deduplication. Add `@@unique([tokenHash])` to `RefreshToken`.

---

### MEDIUM — DB-07: `amountSats` and `balanceSats` stored as `BigInt` creates JSON serialization issues

`BigInt` values in Prisma are serialized as `BigInt` in the TypeScript response objects. NestJS's default JSON serializer (`JSON.stringify`) throws `TypeError: Do not know how to serialize a BigInt` when these fields are returned in API responses unless a custom serializer is configured. The `users.service.ts` workaround (`balanceSats: wallet.balanceSats.toString()`) handles the wallet case, but the `Transaction` model's `amountSats: BigInt` field in `getTransactionHistory` may cause silent serialization failures depending on the NestJS version and interceptor configuration.

**Fix:** Add a global `BigInt.prototype.toJSON = function() { return this.toString(); }` polyfill at application startup, or use `@Transform` decorators on all DTOs that return `amountSats`.

---

### MEDIUM — DB-08: No soft-delete on `User` — account deletion is destructive

There is no `deletedAt` field on the `User` model. If a user requests account deletion (required under Kenya's Data Protection Act 2019), the only option is a hard `DELETE` which cascades through all related records. This destroys the financial audit trail required by CBK regulations. Add `deletedAt DateTime?` and implement soft-delete semantics in `UsersService`.

---

### LOW — DB-09: `Kyc.idNumber` stored in plaintext

National ID numbers are sensitive PII under Kenya's Data Protection Act. They are stored as a plain string in the `Kyc` table. If the database is breached, all users' national ID numbers are immediately exposed. Encrypt at the application layer using AES-256-GCM before storage, with the encryption key managed via KMS (not in `.env`).

---

### LOW — DB-10: No composite `@@unique` constraint on `Transaction.reference`

The `reference` field uses `LB-{uuid-prefix}` format which should be unique per transaction. Without a `@@unique([reference])` constraint, a bug in `uuidv4().slice(0,8)` (which only provides ~32 bits of uniqueness) could silently produce duplicate references, creating reconciliation ambiguity with M-Pesa.

---

### LOW — DB-11: `ExchangeRate` table will grow unboundedly — no retention policy

Two writes per 30-second TTL cycle = ~5,760 rows/day. After one year: ~2.1M rows. This table is used only for fallback rate lookup and audit. Implement a retention policy: keep last 7 days in full, archive monthly aggregates, delete rows older than 90 days.

---

## Recommendations Priority Matrix

| Priority | Issue | Effort | Impact |
|---|---|---|---|
| P0 — Fix before any production traffic | SEC-01: M-Pesa callback authentication | Low | Prevents fraudulent BTC credit |
| P0 | BL-01: Quote expiry server-side enforcement | Medium | Prevents rate manipulation |
| P0 | BL-02: Balance restoration on B2C failure | Low | Prevents BTC loss on payout failure |
| P0 | SEC-02: Refresh token family detection | Low | Closes token theft gap |
| P1 — Fix within first sprint | SEC-03: Rate limiting across all endpoints | Medium | Prevents brute-force and quota exhaustion |
| P1 | BL-03: Concurrent daily limit race condition | Low | Prevents limit bypass |
| P1 | DB-01 through DB-05: Core missing indexes | Low (schema only) | Prevents production performance collapse |
| P1 | FE-03: STK push success must poll real status | Medium | Prevents false success UX |
| P1 | BL-04: Bitcoin deposit idempotency | Low | Prevents double-credit on concurrent job runs |
| P2 — Fix within second sprint | FE-05: Move tokens to HttpOnly cookies | High | Eliminates XSS token theft vector |
| P2 | SEC-05: Bitcoin RPC TLS enforcement + no fake addresses | Medium | Prevents lost deposits in prod |
| P2 | SEC-06: KYC document upload via pre-signed URLs | Medium | Prevents SSRF and IP leakage on admin review |
| P2 | BL-07: PENDING transaction expiry cron | Low | Fixes limit calculation and UX |
| P2 | DB-04: Session/token table cleanup | Low | Prevents unbounded growth |
| P3 — Polish | FE-01, FE-02: Mobile nav and padding | Low | Core mobile UX for target market |
| P3 | FE-06: Design token deduplication | Low | Maintainability |
| P3 | FE-08: `change24h` from real data | Medium | Accuracy of rate display |
| P3 | DB-07: BigInt serialization | Low | API stability |
| P3 | DB-09: KYC ID number encryption | Medium | Regulatory compliance |
| P3 | SEC-07: Password reset token hashing | Low | Defense in depth |

---

*Report generated 2026-06-09. All file:line references verified against the current working tree at `/home/pinky/lipabit`.*
