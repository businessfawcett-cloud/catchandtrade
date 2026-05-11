const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function pushSchema() {
  try {
    console.log('Pushing schema...');
    await prisma.$connect();
    console.log('Connected to database');
    
    // Create tables manually since prisma db push isn't working
    const schema = `
    CREATE TABLE IF NOT EXISTS "User" (
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
    );
    `;
    
    await prisma.$executeRawUnsafe(schema);
    console.log('Schema pushed successfully');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

pushSchema();