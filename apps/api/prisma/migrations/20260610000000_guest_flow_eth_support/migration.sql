-- ============================================================
-- Full schema migration — idempotent (safe on fresh or existing DB)
-- ============================================================

-- Enums (create if missing, add values if missing)
DO $$ BEGIN
  CREATE TYPE "UserRole" AS ENUM ('USER', 'SUPPORT', 'ADMIN', 'SUPER_ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "KycStatus" AS ENUM ('NONE', 'PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "KycTier" AS ENUM ('TIER_1', 'TIER_2', 'TIER_3');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "TransactionType" AS ENUM ('BUY_BTC', 'SELL_BTC', 'BUY_ETH', 'SELL_ETH');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'BUY_ETH';
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'SELL_ETH';

DO $$ BEGIN
  CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'AWAITING_CRYPTO', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'EXPIRED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
ALTER TYPE "TransactionStatus" ADD VALUE IF NOT EXISTS 'AWAITING_CRYPTO';

DO $$ BEGIN
  CREATE TYPE "MpesaTransactionType" AS ENUM ('STK_PUSH', 'B2C');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "MpesaStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'TIMEOUT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── users ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "users" (
  "id"               TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "email"            TEXT NOT NULL,
  "phone"            TEXT,
  "passwordHash"     TEXT NOT NULL,
  "firstName"        TEXT,
  "lastName"         TEXT,
  "role"             "UserRole" NOT NULL DEFAULT 'USER',
  "isEmailVerified"  BOOLEAN NOT NULL DEFAULT false,
  "isActive"         BOOLEAN NOT NULL DEFAULT true,
  "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
  "twoFactorSecret"  TEXT,
  "lastLoginAt"      TIMESTAMP(3),
  "lastLoginIp"      TEXT,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "users_phone_key" ON "users"("phone");

-- ── email_verifications ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "email_verifications" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"    TEXT NOT NULL,
  "token"     TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt"    TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "email_verifications_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "email_verifications_token_key" ON "email_verifications"("token");

-- ── password_resets ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "password_resets" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"    TEXT NOT NULL,
  "token"     TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt"    TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "password_resets_token_key" ON "password_resets"("token");

-- ── refresh_tokens ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "refresh_tokens" (
  "id"          TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"      TEXT NOT NULL,
  "tokenHash"   TEXT NOT NULL,
  "deviceInfo"  TEXT,
  "ipAddress"   TEXT,
  "expiresAt"   TIMESTAMP(3) NOT NULL,
  "revokedAt"   TIMESTAMP(3),
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");
CREATE INDEX IF NOT EXISTS "refresh_tokens_userId_revokedAt_idx" ON "refresh_tokens"("userId", "revokedAt");

-- ── login_sessions ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "login_sessions" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"    TEXT NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "country"   TEXT,
  "success"   BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "login_sessions_pkey" PRIMARY KEY ("id")
);

-- ── kyc ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "kyc" (
  "id"              TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"          TEXT NOT NULL,
  "tier"            "KycTier" NOT NULL DEFAULT 'TIER_1',
  "status"          "KycStatus" NOT NULL DEFAULT 'NONE',
  "idType"          TEXT,
  "idNumber"        TEXT,
  "idFrontUrl"      TEXT,
  "idBackUrl"       TEXT,
  "selfieUrl"       TEXT,
  "rejectionReason" TEXT,
  "reviewedBy"      TEXT,
  "reviewedAt"      TIMESTAMP(3),
  "submittedAt"     TIMESTAMP(3),
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "kyc_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "kyc_userId_key" ON "kyc"("userId");

-- ── bitcoin_wallets ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "bitcoin_wallets" (
  "id"                TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"            TEXT NOT NULL,
  "address"           TEXT NOT NULL,
  "balanceSats"       BIGINT NOT NULL DEFAULT 0,
  "totalReceivedSats" BIGINT NOT NULL DEFAULT 0,
  "totalSentSats"     BIGINT NOT NULL DEFAULT 0,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "bitcoin_wallets_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "bitcoin_wallets_userId_key" ON "bitcoin_wallets"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "bitcoin_wallets_address_key" ON "bitcoin_wallets"("address");

-- ── bitcoin_transactions ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "bitcoin_transactions" (
  "id"            TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "walletId"      TEXT NOT NULL,
  "txid"          TEXT,
  "amountSats"    BIGINT NOT NULL,
  "feeSats"       BIGINT NOT NULL DEFAULT 0,
  "confirmations" INTEGER NOT NULL DEFAULT 0,
  "confirmed"     BOOLEAN NOT NULL DEFAULT false,
  "confirmedAt"   TIMESTAMP(3),
  "direction"     TEXT NOT NULL,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "bitcoin_transactions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "bitcoin_transactions_txid_key" ON "bitcoin_transactions"("txid");

-- ── transactions ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "transactions" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"         TEXT,
  "coin"           TEXT NOT NULL DEFAULT 'BTC',
  "type"           "TransactionType" NOT NULL,
  "status"         "TransactionStatus" NOT NULL DEFAULT 'PENDING',
  "amountKes"      DECIMAL(18,2) NOT NULL,
  "amountSats"     BIGINT NOT NULL DEFAULT 0,
  "amountWei"      BIGINT,
  "cryptoPriceKes" DECIMAL(18,2) NOT NULL,
  "feeKes"         DECIMAL(18,2) NOT NULL,
  "feePercent"     DECIMAL(5,4) NOT NULL,
  "spreadKes"      DECIMAL(18,2) NOT NULL,
  "netAmountKes"   DECIMAL(18,2) NOT NULL,
  "reference"      TEXT NOT NULL,
  "mpesaRef"       TEXT,
  "cryptoTxid"     TEXT,
  "cryptoAddress"  TEXT,
  "depositAddress" TEXT,
  "guestPhone"     TEXT,
  "guestEmail"     TEXT,
  "expiresAt"      TIMESTAMP(3),
  "completedAt"    TIMESTAMP(3),
  "failureReason"  TEXT,
  "metadata"       JSONB,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "transactions_reference_key" ON "transactions"("reference");
CREATE INDEX IF NOT EXISTS "transactions_userId_createdAt_idx" ON "transactions"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "transactions_userId_status_idx" ON "transactions"("userId", "status");
CREATE INDEX IF NOT EXISTS "transactions_status_createdAt_idx" ON "transactions"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "transactions_reference_idx" ON "transactions"("reference");
CREATE INDEX IF NOT EXISTS "transactions_depositAddress_idx" ON "transactions"("depositAddress");

-- Handle existing tables — add new columns if they don't exist
ALTER TABLE "transactions"
  ADD COLUMN IF NOT EXISTS "coin" TEXT NOT NULL DEFAULT 'BTC',
  ADD COLUMN IF NOT EXISTS "amountWei" BIGINT,
  ADD COLUMN IF NOT EXISTS "cryptoPriceKes" DECIMAL(18,2),
  ADD COLUMN IF NOT EXISTS "depositAddress" TEXT,
  ADD COLUMN IF NOT EXISTS "cryptoAddress" TEXT,
  ADD COLUMN IF NOT EXISTS "guestPhone" TEXT,
  ADD COLUMN IF NOT EXISTS "guestEmail" TEXT,
  ADD COLUMN IF NOT EXISTS "cryptoTxid" TEXT;

-- Backfill cryptoPriceKes from old btcPriceKes if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='btcPriceKes')
  AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='cryptoPriceKes') THEN
    UPDATE "transactions" SET "cryptoPriceKes" = "btcPriceKes" WHERE "cryptoPriceKes" IS NULL;
  END IF;
END $$;

-- Make userId nullable on existing tables
ALTER TABLE "transactions" ALTER COLUMN "userId" DROP NOT NULL;

-- ── mpesa_transactions ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "mpesa_transactions" (
  "id"                TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "transactionId"     TEXT NOT NULL,
  "type"              "MpesaTransactionType" NOT NULL,
  "status"            "MpesaStatus" NOT NULL DEFAULT 'PENDING',
  "phone"             TEXT NOT NULL,
  "amountKes"         DECIMAL(18,2) NOT NULL,
  "merchantRequestId" TEXT,
  "checkoutRequestId" TEXT,
  "mpesaReceiptNumber" TEXT,
  "resultCode"        INTEGER,
  "resultDesc"        TEXT,
  "conversationId"    TEXT,
  "originatorConvId"  TEXT,
  "requestedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt"       TIMESTAMP(3),
  "callbackPayload"   JSONB,
  CONSTRAINT "mpesa_transactions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "mpesa_transactions_transactionId_key" ON "mpesa_transactions"("transactionId");
CREATE INDEX IF NOT EXISTS "mpesa_transactions_transactionId_idx" ON "mpesa_transactions"("transactionId");
CREATE INDEX IF NOT EXISTS "mpesa_transactions_checkoutRequestId_idx" ON "mpesa_transactions"("checkoutRequestId");
CREATE INDEX IF NOT EXISTS "mpesa_transactions_conversationId_idx" ON "mpesa_transactions"("conversationId");

-- ── exchange_rates ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "exchange_rates" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "btcUsd"         DECIMAL(18,2) NOT NULL,
  "ethUsd"         DECIMAL(18,2),
  "usdKes"         DECIMAL(10,4) NOT NULL,
  "btcKes"         DECIMAL(18,2) NOT NULL,
  "ethKes"         DECIMAL(18,2),
  "buyRateKes"     DECIMAL(18,2) NOT NULL,
  "sellRateKes"    DECIMAL(18,2) NOT NULL,
  "ethBuyRateKes"  DECIMAL(18,2),
  "ethSellRateKes" DECIMAL(18,2),
  "source"         TEXT NOT NULL DEFAULT 'binance',
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "exchange_rates"
  ADD COLUMN IF NOT EXISTS "ethUsd" DECIMAL(18,2),
  ADD COLUMN IF NOT EXISTS "ethKes" DECIMAL(18,2),
  ADD COLUMN IF NOT EXISTS "ethBuyRateKes" DECIMAL(18,2),
  ADD COLUMN IF NOT EXISTS "ethSellRateKes" DECIMAL(18,2);

-- ── audit_logs ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id"         TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"     TEXT,
  "action"     TEXT NOT NULL,
  "resource"   TEXT,
  "resourceId" TEXT,
  "ipAddress"  TEXT,
  "userAgent"  TEXT,
  "metadata"   JSONB,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "audit_logs_userId_idx" ON "audit_logs"("userId");
CREATE INDEX IF NOT EXISTS "audit_logs_action_idx" ON "audit_logs"("action");
CREATE INDEX IF NOT EXISTS "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");
CREATE INDEX IF NOT EXISTS "audit_logs_userId_createdAt_idx" ON "audit_logs"("userId", "createdAt");

-- ── app_settings ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "app_settings" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "key"       TEXT NOT NULL,
  "value"     TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "app_settings_key_key" ON "app_settings"("key");

-- ── Foreign keys (add if not already present) ─────────────────────────────
DO $$ BEGIN
  ALTER TABLE "email_verifications" ADD CONSTRAINT "email_verifications_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "login_sessions" ADD CONSTRAINT "login_sessions_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "kyc" ADD CONSTRAINT "kyc_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "bitcoin_wallets" ADD CONSTRAINT "bitcoin_wallets_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "bitcoin_transactions" ADD CONSTRAINT "bitcoin_transactions_walletId_fkey"
    FOREIGN KEY ("walletId") REFERENCES "bitcoin_wallets"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "transactions" ADD CONSTRAINT "transactions_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "mpesa_transactions" ADD CONSTRAINT "mpesa_transactions_transactionId_fkey"
    FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
