-- Create all tables for Supabase migration
-- Based on Prisma schema

-- Enum types
CREATE TYPE "GameType" AS ENUM ('POKEMON', 'MTG', 'YUGIOH', 'SPORTS', 'ONE_PIECE', 'LORCANA', 'OTHER');
CREATE TYPE "Condition" AS ENUM ('MINT', 'NEAR_MINT', 'LIGHTLY_PLAYED', 'MODERATELY_PLAYED', 'HEAVILY_PLAYED', 'DAMAGED');
CREATE TYPE "ListingStatus" AS ENUM ('ACTIVE', 'SOLD', 'CANCELLED', 'EXPIRED');
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'DISPUTED', 'REFUNDED', 'CANCELLED');

-- User table
CREATE TABLE "User" (
  id VARCHAR(255) PRIMARY KEY DEFAULT cuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  passwordHash VARCHAR(255),
  googleId VARCHAR(255) UNIQUE,
  appleId VARCHAR(255) UNIQUE,
  username VARCHAR(255) UNIQUE,
  displayName VARCHAR(255) NOT NULL,
  avatarId VARCHAR(255),
  isPublic BOOLEAN DEFAULT true,
  hideCollectionValue BOOLEAN DEFAULT false,
  country VARCHAR(255),
  twitterHandle VARCHAR(255),
  instagramHandle VARCHAR(255),
  tiktokHandle VARCHAR(255),
  avatarUrl TEXT,
  stripeCustomerId VARCHAR(255),
  stripeAccountId VARCHAR(255),
  isVerifiedSeller BOOLEAN DEFAULT false,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);

-- PokemonSet table
CREATE TABLE "PokemonSet" (
  id VARCHAR(255) PRIMARY KEY DEFAULT cuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(255) UNIQUE NOT NULL,
  totalCards INT NOT NULL,
  releaseYear INT NOT NULL,
  imageUrl TEXT,
  language VARCHAR(255) DEFAULT 'EN',
  printedTotal INT
);

-- Card table
CREATE TABLE "Card" (
  id VARCHAR(255) PRIMARY KEY DEFAULT cuid(),
  gameType "GameType" DEFAULT 'POKEMON',
  name VARCHAR(255) NOT NULL,
  setName VARCHAR(255) NOT NULL,
  setCode VARCHAR(255) NOT NULL,
  cardNumber VARCHAR(255) NOT NULL,
  rarity VARCHAR(255),
  imageUrl TEXT,
  pokemonTcgId VARCHAR(255) UNIQUE,
  language VARCHAR(255) DEFAULT 'EN',
  createdAt TIMESTAMP DEFAULT NOW(),
  setId VARCHAR(255),
  supertype VARCHAR(255),
  FOREIGN KEY ("setId") REFERENCES "PokemonSet"(id)
);

-- CardPrice table
CREATE TABLE "CardPrice" (
  id VARCHAR(255) PRIMARY KEY DEFAULT cuid(),
  cardId VARCHAR(255) NOT NULL,
  date TIMESTAMP DEFAULT NOW(),
  priceLow FLOAT,
  priceMid FLOAT,
  priceHigh FLOAT,
  priceMarket FLOAT,
  ebaySoldAvg FLOAT,
  priceChartingValue FLOAT,
  gradedPSA10 FLOAT,
  gradedPSA9 FLOAT,
  gradedBGS10 FLOAT,
  gradedBGS95 FLOAT,
  expectedValue FLOAT,
  ebayBuyNowLow FLOAT,
  lastUpdated TIMESTAMP,
  isStale BOOLEAN DEFAULT false,
  listingCount INT DEFAULT 0,
  variant VARCHAR(255),
  FOREIGN KEY ("cardId") REFERENCES "Card"(id)
);

CREATE INDEX "CardPrice_cardId_date_idx" ON "CardPrice"("cardId", "date");

-- PriceHistory table
CREATE TABLE "PriceHistory" (
  id VARCHAR(255) PRIMARY KEY DEFAULT cuid(),
  cardId VARCHAR(255) NOT NULL,
  price FLOAT NOT NULL,
  date TIMESTAMP DEFAULT NOW(),
  source VARCHAR(255) DEFAULT 'ebay',
  FOREIGN KEY ("cardId") REFERENCES "Card"(id)
);

CREATE INDEX "PriceHistory_cardId_date_idx" ON "PriceHistory"("cardId", "date");

-- Portfolio table
CREATE TABLE "Portfolio" (
  id VARCHAR(255) PRIMARY KEY DEFAULT cuid(),
  userId VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  isPublic BOOLEAN DEFAULT false,
  shareSlug VARCHAR(255) UNIQUE,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY ("userId") REFERENCES "User"(id)
);

-- PortfolioItem table
CREATE TABLE "PortfolioItem" (
  id VARCHAR(255) PRIMARY KEY DEFAULT cuid(),
  portfolioId VARCHAR(255) NOT NULL,
  cardId VARCHAR(255) NOT NULL,
  quantity INT DEFAULT 1,
  condition "Condition" DEFAULT 'NEAR_MINT',
  isGraded BOOLEAN DEFAULT false,
  gradeCompany VARCHAR(255),
  gradeValue FLOAT,
  purchasePrice FLOAT,
  purchaseDate TIMESTAMP,
  notes TEXT,
  addedAt TIMESTAMP DEFAULT NOW(),
  valuationOverride FLOAT,
  certNumber VARCHAR(255) UNIQUE,
  subGradeCentering FLOAT,
  subGradeCorners FLOAT,
  subGradeEdges FLOAT,
  subGradeSurface FLOAT,
  FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"(id),
  FOREIGN KEY ("cardId") REFERENCES "Card"(id)
);

-- PsaCertCache table
CREATE TABLE "PsaCertCache" (
  id VARCHAR(255) PRIMARY KEY DEFAULT cuid(),
  certNumber VARCHAR(255) UNIQUE NOT NULL,
  cardId VARCHAR(255),
  grade VARCHAR(255) NOT NULL,
  grader VARCHAR(255) DEFAULT 'PSA',
  popCount INT,
  lastSalePrice FLOAT,
  lastSaleDate TIMESTAMP,
  saleCount30d INT DEFAULT 0,
  fetchedAt TIMESTAMP DEFAULT NOW(),
  expiresAt TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY ("cardId") REFERENCES "Card"(id)
);

CREATE INDEX "PsaCertCache_cardId_idx" ON "PsaCertCache"("cardId");

-- GradedPriceComparison table
CREATE TABLE "GradedPriceComparison" (
  id VARCHAR(255) PRIMARY KEY DEFAULT cuid(),
  cardId VARCHAR(255) NOT NULL,
  grade VARCHAR(255) NOT NULL,
  grader VARCHAR(255) NOT NULL,
  price FLOAT NOT NULL,
  lastFetchedAt TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY ("cardId") REFERENCES "Card"(id),
  UNIQUE("cardId", "grade", "grader")
);

-- Listing table
CREATE TABLE "Listing" (
  id VARCHAR(255) PRIMARY KEY DEFAULT cuid(),
  sellerId VARCHAR(255) NOT NULL,
  cardId VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  condition "Condition" DEFAULT 'NEAR_MINT',
  isGraded BOOLEAN DEFAULT false,
  gradeCompany VARCHAR(255),
  gradeValue FLOAT,
  buyNowPrice FLOAT NOT NULL,
  imageUrls TEXT[],
  status "ListingStatus" DEFAULT 'ACTIVE',
  commissionPct FLOAT DEFAULT 8,
  stripeProductId VARCHAR(255),
  createdAt TIMESTAMP DEFAULT NOW(),
  expiresAt TIMESTAMP,
  FOREIGN KEY ("sellerId") REFERENCES "User"(id),
  FOREIGN KEY ("cardId") REFERENCES "Card"(id)
);

-- Order table
CREATE TABLE "Order" (
  id VARCHAR(255) PRIMARY KEY DEFAULT cuid(),
  listingId VARCHAR(255) NOT NULL,
  buyerId VARCHAR(255) NOT NULL,
  sellerId VARCHAR(255) NOT NULL,
  amount FLOAT NOT NULL,
  platformFee FLOAT NOT NULL,
  sellerPayout FLOAT NOT NULL,
  stripePaymentIntentId VARCHAR(255),
  stripeTransferId VARCHAR(255),
  status "OrderStatus" DEFAULT 'PENDING',
  shippingAddress JSONB,
  createdAt TIMESTAMP DEFAULT NOW(),
  completedAt TIMESTAMP,
  FOREIGN KEY ("listingId") REFERENCES "Listing"(id),
  FOREIGN KEY ("buyerId") REFERENCES "User"(id),
  FOREIGN KEY ("sellerId") REFERENCES "User"(id)
);

-- Bid table
CREATE TABLE "Bid" (
  id VARCHAR(255) PRIMARY KEY DEFAULT cuid(),
  userId VARCHAR(255) NOT NULL,
  listingId VARCHAR(255) NOT NULL,
  amount FLOAT NOT NULL,
  isWinning BOOLEAN DEFAULT false,
  createdAt TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY ("userId") REFERENCES "User"(id)
);

-- WatchlistItem table
CREATE TABLE "WatchlistItem" (
  id VARCHAR(255) PRIMARY KEY DEFAULT cuid(),
  userId VARCHAR(255) NOT NULL,
  cardId VARCHAR(255) NOT NULL,
  addedAt TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY ("userId") REFERENCES "User"(id),
  FOREIGN KEY ("cardId") REFERENCES "Card"(id),
  UNIQUE("userId", "cardId")
);

-- SyncLog table
CREATE TABLE "SyncLog" (
  id VARCHAR(255) PRIMARY KEY DEFAULT cuid(),
  runAt TIMESTAMP DEFAULT NOW(),
  newSets INT DEFAULT 0,
  updatedSets INT DEFAULT 0,
  newCards INT DEFAULT 0,
  updatedCards INT DEFAULT 0,
  updatedPrices INT DEFAULT 0,
  errors TEXT,
  duration INT NOT NULL
);

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
