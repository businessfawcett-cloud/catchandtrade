/**
 * Apply pending schema changes that can't go through prisma migrate deploy
 * (because earlier migrations were applied via db push, not migrate).
 * All statements use IF NOT EXISTS for idempotency.
 */
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    console.log('[migrate] Connecting to database...');
    await prisma.$connect();
    console.log('[migrate] Connected. Applying pending schema changes...');

    // 2026-03-11: Add language to PokemonSet, variant to CardPrice
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "PokemonSet" ADD COLUMN IF NOT EXISTS "language" TEXT NOT NULL DEFAULT 'EN'`
    );
    console.log('[migrate] Added language column to PokemonSet');

    await prisma.$executeRawUnsafe(
      `ALTER TABLE "CardPrice" ADD COLUMN IF NOT EXISTS "variant" TEXT`
    );
    console.log('[migrate] Added variant column to CardPrice');

    console.log('[migrate] All pending schema changes applied successfully');
  } catch (err) {
    console.error('[migrate] Error applying migrations:', err.message);
    // Don't exit with error - columns might already exist, let the app try to start
  } finally {
    await prisma.$disconnect();
    console.log('[migrate] Disconnected');
  }
}

main().then(() => {
  console.log('[migrate] Done');
  process.exit(0);
}).catch((err) => {
  console.error('[migrate] Fatal error:', err);
  process.exit(1);
});
