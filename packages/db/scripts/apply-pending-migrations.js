/**
 * Apply pending schema changes that can't go through prisma migrate deploy
 * (because earlier migrations were applied via db push, not migrate).
 * All statements use IF NOT EXISTS / IF EXISTS for idempotency.
 */
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    // 2026-03-11: Add language to PokemonSet, variant to CardPrice
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "PokemonSet" ADD COLUMN IF NOT EXISTS "language" TEXT NOT NULL DEFAULT 'EN'`
    );
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "CardPrice" ADD COLUMN IF NOT EXISTS "variant" TEXT`
    );
    console.log('[migrate] Applied pending schema changes successfully');
  } catch (err) {
    console.error('[migrate] Error applying migrations:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
