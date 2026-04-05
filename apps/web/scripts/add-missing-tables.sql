-- Add missing tables to Supabase for CardVault/Catch & Trade

-- 1. PortfolioCard table (matches API usage)
CREATE TABLE IF NOT EXISTS "PortfolioCard" (
    id TEXT PRIMARY KEY,
    "portfolioId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    condition TEXT DEFAULT 'NEAR_MINT',
    "isGraded" BOOLEAN DEFAULT false,
    "gradeCompany" TEXT,
    "gradeValue" REAL,
    "purchasePrice" REAL,
    "purchaseDate" TIMESTAMP,
    notes TEXT,
    "addedAt" TIMESTAMP DEFAULT NOW(),
    "valuationOverride" REAL,
    "certNumber" TEXT UNIQUE,
    "subGradeCentering" REAL,
    "subGradeCorners" REAL,
    "subGradeEdges" REAL,
    "subGradeSurface" REAL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS "PortfolioCard_portfolioId_idx" ON "PortfolioCard"("portfolioId");
CREATE INDEX IF NOT EXISTS "PortfolioCard_cardId_idx" ON "PortfolioCard"("cardId");

-- 2. GradingSubmission table (for /api/grading)
CREATE TABLE IF NOT EXISTS "GradingSubmission" (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "gradingCompany" TEXT NOT NULL,
    "serviceLevel" TEXT DEFAULT 'STANDARD',
    "cardCondition" TEXT DEFAULT 'NEAR_MINT',
    status TEXT DEFAULT 'SUBMITTED',
    "submittedAt" TIMESTAMP DEFAULT NOW(),
    "trackingNumber" TEXT,
    "estimatedReturn" TIMESTAMP,
    "actualReturn" TIMESTAMP,
    grade TEXT,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS "GradingSubmission_userId_idx" ON "GradingSubmission"("userId");
CREATE INDEX IF NOT EXISTS "GradingSubmission_status_idx" ON "GradingSubmission"(status);

-- 3. OrderItem table (for /api/orders)
CREATE TABLE IF NOT EXISTS "OrderItem" (
    id TEXT PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    "unitPrice" REAL NOT NULL,
    condition TEXT,
    "gradeCompany" TEXT,
    grade TEXT
);

CREATE INDEX IF NOT EXISTS "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- 4. SellerReview table (for seller profiles)
CREATE TABLE IF NOT EXISTS "SellerReview" (
    id TEXT PRIMARY KEY,
    "sellerId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "SellerReview_sellerId_idx" ON "SellerReview"("sellerId");

-- 5. GradedSlab table (for /api/slabs)
CREATE TABLE IF NOT EXISTS "GradedSlab" (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    grade INTEGER NOT NULL,
    "gradingCompany" TEXT NOT NULL,
    "certificationNumber" TEXT UNIQUE,
    "imageUrl" TEXT,
    "purchasePrice" REAL,
    "purchaseDate" TIMESTAMP,
    notes TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "GradedSlab_userId_idx" ON "GradedSlab"("userId");

-- 6. Webhook table (for /api/webhooks)
CREATE TABLE IF NOT EXISTS "Webhook" (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    url TEXT NOT NULL,
    events TEXT NOT NULL,
    secret TEXT,
    active BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "lastTriggered" TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "Webhook_userId_idx" ON "Webhook"("userId");

-- 7. Bid table (if not exists)
CREATE TABLE IF NOT EXISTS "Bid" (
    id TEXT PRIMARY KEY,
    "listingId" TEXT NOT NULL,
    "bidderId" TEXT NOT NULL,
    amount REAL NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    status TEXT DEFAULT 'ACTIVE'
);

CREATE INDEX IF NOT EXISTS "Bid_listingId_idx" ON "Bid"("listingId");

-- 8. Add missing columns to existing tables if needed

-- Add columns to User table if missing
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sellerInfo" JSONB;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "banned" BOOLEAN DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP;

-- Add columns to Order table if missing
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "stripePaymentId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "trackingNumber" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP;

-- Add columns to Listing table if missing
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "ebayItemId" TEXT;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "listedOnEbay" BOOLEAN DEFAULT false;

-- Add columns to Card table if missing
ALTER TABLE "Card" ADD COLUMN IF NOT EXISTS "pokemonTcgId" TEXT;

-- Add columns to PokemonSet if needed
ALTER TABLE "PokemonSet" ADD COLUMN IF NOT EXISTS "totalCards" INTEGER;

-- Enable Row Level Security (RLS) - optional, disable for now since we use service role
-- ALTER TABLE "PortfolioCard" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "GradingSubmission" ENABLE ROW LEVEL SECURITY;

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON "PortfolioCard" TO postgres;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON "GradingSubmission" TO postgres;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON "OrderItem" TO postgres;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON "SellerReview" TO postgres;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON "GradedSlab" TO postgres;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON "Webhook" TO postgres;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON "Bid" TO postgres;
