require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const NEON_DATABASE_URL = 'postgresql://neondb_owner:npg_sX5c2WEpPqwd@ep-lucky-bird-akkvyh6x-pooler.c-3.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const SUPABASE_DATABASE_URL = 'postgresql://postgres:umvYuTBwUK3SJQng@db.ijnajdpcplapwiyvzsdh.supabase.co:5432/postgres';

const TABLES = [
  'User',
  'PokemonSet',
  'Card',
  'CardPrice',
  'PriceHistory',
  'Portfolio',
  'PortfolioItem',
  'PsaCertCache',
  'GradedPriceComparison',
  'Listing',
  'Order',
  'Bid',
  'WatchlistItem',
  'SyncLog'
];

async function getTableCount(prisma, table) {
  try {
    const result = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM "${table}"`);
    return result[0]?.count || 0;
  } catch {
    return 0;
  }
}

async function fetchAllData(prisma, table) {
  return prisma.$queryRawUnsafe(`SELECT * FROM "${table}"`);
}

async function migrateTable(target, table, data) {
  if (data.length === 0) return 0;
  
  let inserted = 0;
  const BATCH_SIZE = 50;
  
  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = data.slice(i, i + BATCH_SIZE);
    
    const fields = Object.keys(batch[0]);
    const placeholders = batch.map((_, batchIdx) => 
      `(${fields.map((_, fieldIdx) => `$${batchIdx * fields.length + fieldIdx + 1}`).join(', ')})`
    ).join(', ');
    
    const values = [];
    for (const record of batch) {
      for (const key of fields) {
        let val = record[key];
        if (val instanceof Uint8Array) {
          val = Buffer.from(val);
        } else if (val && typeof val === 'object' && !(val instanceof Date)) {
          val = JSON.stringify(val);
        }
        values.push(val);
      }
    }
    
    const insertQuery = `
      INSERT INTO "${table}" (${fields.map(f => `"${f}"`).join(', ')})
      VALUES ${placeholders}
      ON CONFLICT DO NOTHING
    `;
    
    try {
      const result = await target.$executeRawUnsafe(insertQuery, ...values);
      inserted += result;
    } catch (e) {
      console.log(`    Batch error: ${e.message.substring(0, 100)}`);
    }
    
    process.stdout.write(`\r    Progress: ${Math.min(i + BATCH_SIZE, data.length)}/${data.length}`);
  }
  
  return inserted;
}

async function migrate() {
  console.log('═══════════════════════════════════════════════');
  console.log('  Neon → Supabase Migration Script');
  console.log('═══════════════════════════════════════════════\n');

  const source = new PrismaClient({
    datasources: { db: { url: NEON_DATABASE_URL } }
  });
  
  const target = new PrismaClient({
    datasources: { db: { url: SUPABASE_DATABASE_URL } }
  });

  try {
    console.log('Testing connections...\n');
    
    try {
      await source.$connect();
      console.log('✓ Neon: Connected');
    } catch (e) {
      console.log(`✗ Neon: Connection failed - ${e.message}`);
      console.log('\nMake sure your Neon IP is allowed in Supabase dashboard:');
      console.log('Settings → Database → Connection Pooling → Add your IP\n');
      throw e;
    }
    
    try {
      await target.$connect();
      console.log('✓ Supabase: Connected\n');
    } catch (e) {
      console.log(`✗ Supabase: Connection failed - ${e.message}`);
      throw e;
    }

    console.log('───────────────────────────────────────────────');
    console.log('  Source Data Analysis');
    console.log('───────────────────────────────────────────────\n');
    
    const counts = {};
    for (const table of TABLES) {
      counts[table] = await getTableCount(source, table);
      console.log(`  ${table.padEnd(25)} ${String(counts[table]).padStart(8)} rows`);
    }

    const totalRows = Object.values(counts).reduce((a, b) => a + b, 0);
    console.log(`\n  ${'─'.repeat(36)}`);
    console.log(`  ${'TOTAL'.padEnd(25)} ${String(totalRows).padStart(8)} rows`);
    console.log('───────────────────────────────────────────────\n');

    if (totalRows === 0) {
      console.log('⚠ No data found in source database.\n');
      return;
    }

    console.log('Starting migration...\n');
    
    const results = {};
    
    for (const table of TABLES) {
      if (counts[table] === 0) {
        console.log(`⏭ ${table.padEnd(25)} Skipped (no data)`);
        continue;
      }

      console.log(`→ ${table.padEnd(25)} Migrating...`);
      
      try {
        const data = await fetchAllData(source, table);
        const inserted = await migrateTable(target, table, data);
        results[table] = inserted;
        console.log(`\n  ✓ ${inserted} records migrated\n`);
      } catch (e) {
        console.log(`\n  ✗ Failed: ${e.message}\n`);
        results[table] = 0;
      }
    }

    console.log('═══════════════════════════════════════════════');
    console.log('  Migration Complete');
    console.log('═══════════════════════════════════════════════\n');
    
    let totalMigrated = 0;
    for (const [table, count] of Object.entries(results)) {
      console.log(`  ${table.padEnd(25)} ${String(count).padStart(8)} migrated`);
      totalMigrated += count;
    }
    
    console.log(`\n  ${'─'.repeat(36)}`);
    console.log(`  ${'TOTAL MIGRATED'.padEnd(25)} ${String(totalMigrated).padStart(8)}`);
    console.log('\n✓ Migration finished successfully!\n');

  } catch (error) {
    console.error('\n✗ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await source.$disconnect();
    await target.$disconnect();
  }
}

migrate();
