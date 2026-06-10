-- AlterEnum: Add AWAITING_CRYPTO to TransactionStatus
ALTER TYPE "TransactionStatus" ADD VALUE IF NOT EXISTS 'AWAITING_CRYPTO';

-- AlterEnum: Add ETH transaction types
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'BUY_ETH';
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'SELL_ETH';

-- AlterTable transactions: make userId optional, add new fields
ALTER TABLE "transactions"
  ALTER COLUMN "userId" DROP NOT NULL,
  ALTER COLUMN "amountSats" SET DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "coin" TEXT NOT NULL DEFAULT 'BTC',
  ADD COLUMN IF NOT EXISTS "amountWei" BIGINT,
  ADD COLUMN IF NOT EXISTS "cryptoPriceKes" DECIMAL(18,2),
  ADD COLUMN IF NOT EXISTS "depositAddress" TEXT,
  ADD COLUMN IF NOT EXISTS "cryptoAddress" TEXT,
  ADD COLUMN IF NOT EXISTS "guestPhone" TEXT,
  ADD COLUMN IF NOT EXISTS "guestEmail" TEXT,
  ADD COLUMN IF NOT EXISTS "cryptoTxid" TEXT;

-- Backfill cryptoPriceKes from btcPriceKes
UPDATE "transactions" SET "cryptoPriceKes" = "btcPriceKes" WHERE "cryptoPriceKes" IS NULL;
ALTER TABLE "transactions" ALTER COLUMN "cryptoPriceKes" SET NOT NULL;

-- Migrate btcAddress → cryptoAddress
UPDATE "transactions" SET "cryptoAddress" = "btcAddress" WHERE "btcAddress" IS NOT NULL AND "cryptoAddress" IS NULL;

-- Migrate btcTxid → cryptoTxid
UPDATE "transactions" SET "cryptoTxid" = "btcTxid" WHERE "btcTxid" IS NOT NULL AND "cryptoTxid" IS NULL;

-- Index on depositAddress for sell flow polling
CREATE INDEX IF NOT EXISTS "transactions_depositAddress_idx" ON "transactions"("depositAddress");

-- AlterTable exchange_rates: add ETH fields
ALTER TABLE "exchange_rates"
  ADD COLUMN IF NOT EXISTS "ethUsd" DECIMAL(18,2),
  ADD COLUMN IF NOT EXISTS "ethKes" DECIMAL(18,2),
  ADD COLUMN IF NOT EXISTS "ethBuyRateKes" DECIMAL(18,2),
  ADD COLUMN IF NOT EXISTS "ethSellRateKes" DECIMAL(18,2);
