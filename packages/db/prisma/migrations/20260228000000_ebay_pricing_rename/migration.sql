-- Rename Card.tcgplayerId → pokemonTcgId
ALTER TABLE "Card" RENAME COLUMN "tcgplayerId" TO "pokemonTcgId";

-- Rename CardPrice fields to source-agnostic names
ALTER TABLE "CardPrice" RENAME COLUMN "tcgplayerLow" TO "priceLow";
ALTER TABLE "CardPrice" RENAME COLUMN "tcgplayerMid" TO "priceMid";
ALTER TABLE "CardPrice" RENAME COLUMN "tcgplayerHigh" TO "priceHigh";
ALTER TABLE "CardPrice" RENAME COLUMN "tcgplayerMarket" TO "priceMarket";
ALTER TABLE "CardPrice" RENAME COLUMN "ebayRecentAvg" TO "ebaySoldAvg";

-- Add new CardPrice columns
ALTER TABLE "CardPrice" ADD COLUMN "ebayBuyNowLow" DOUBLE PRECISION;
ALTER TABLE "CardPrice" ADD COLUMN "lastUpdated" TIMESTAMP(3);
ALTER TABLE "CardPrice" ADD COLUMN "isStale" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "CardPrice" ADD COLUMN "listingCount" INTEGER NOT NULL DEFAULT 0;

-- Change PriceHistory default source from "tcgplayer" to "ebay"
ALTER TABLE "PriceHistory" ALTER COLUMN "source" SET DEFAULT 'ebay';

-- Remove triggeredAlerts from SyncLog
ALTER TABLE "SyncLog" DROP COLUMN "triggeredAlerts";

-- Drop PriceAlert table and AlertType enum
DROP TABLE IF EXISTS "PriceAlert";
DROP TYPE IF EXISTS "AlertType";
