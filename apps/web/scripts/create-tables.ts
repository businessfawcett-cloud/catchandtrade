import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTables() {
  try {
    console.log('Connecting to database...');
    await prisma.$connect();
    console.log('Connected to database');
    
    // Drop existing tables in correct order (foreign keys first)
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "PriceHistory" CASCADE`);
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "GradedPriceComparison" CASCADE`);
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "PsaCertCache" CASCADE`);
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "CardPrice" CASCADE`);
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "PortfolioItem" CASCADE`);
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "WatchlistItem" CASCADE`);
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "Listing" CASCADE`);
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "Bid" CASCADE`);
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "Order" CASCADE`);
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "Portfolio" CASCADE`);
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "Slab" CASCADE`);
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "Card" CASCADE`);
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "PokemonSet" CASCADE`);
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "User" CASCADE`);
    console.log('Dropped existing tables');
    
    // Create tables matching Prisma schema
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "User" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "email" TEXT NOT NULL UNIQUE,
        "passwordHash" TEXT,
        "googleId" TEXT UNIQUE,
        "appleId" TEXT UNIQUE,
        "username" TEXT UNIQUE,
        "displayName" TEXT NOT NULL,
        "avatarId" TEXT,
        "isPublic" BOOLEAN DEFAULT true,
        "hideCollectionValue" BOOLEAN DEFAULT false,
        "country" TEXT,
        "twitterHandle" TEXT,
        "instagramHandle" TEXT,
        "tiktokHandle" TEXT,
        "avatarUrl" TEXT,
        "stripeCustomerId" TEXT,
        "stripeAccountId" TEXT,
        "isVerifiedSeller" BOOLEAN DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "PokemonSet" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "code" TEXT NOT NULL UNIQUE,
        "totalCards" INTEGER NOT NULL,
        "releaseYear" INTEGER NOT NULL,
        "imageUrl" TEXT,
        "language" TEXT DEFAULT 'EN',
        "printedTotal" INTEGER
      )
    `);
    
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "Card" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "gameType" TEXT DEFAULT 'POKEMON',
        "name" TEXT NOT NULL,
        "setName" TEXT NOT NULL,
        "setCode" TEXT NOT NULL,
        "cardNumber" TEXT NOT NULL,
        "rarity" TEXT,
        "imageUrl" TEXT,
        "pokemonTcgId" TEXT UNIQUE,
        "language" TEXT DEFAULT 'EN',
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "setId" TEXT REFERENCES "PokemonSet"("id"),
        "supertype" TEXT
      )
    `);
    
    console.log('Created tables');
    
    const tables = await prisma.$queryRawUnsafe<any[]>(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('Existing tables:', tables.map(t => t.table_name));
    
    await prisma.$disconnect();
    console.log('Done');
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

createTables();