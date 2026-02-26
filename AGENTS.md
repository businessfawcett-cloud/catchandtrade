# Agent Guidelines

## Database Commands

**NEVER run these commands** as they will wipe all data:
- `npx prisma db push --force-reset`
- `npx prisma migrate reset`
- Any command with `--force-reset` or `migrate reset`

## Safe Commands

Safe commands that preserve data:
- `npx prisma db push` - Safe, won't delete data
- `npx prisma migrate dev --name <name>` - Only safe if not using --create-only or similar flags

## Testing - CRITICAL

**Tests use the TEST database (port 5436), NOT the DEV database (port 5435)**

Test scripts are configured to use:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5436/catchandtrade_test
```

**Running tests must ALWAYS use the test script**:
```bash
# Correct - uses test database
npm run test
# or
npx turbo run test

# INCORRECT - may use dev database
npx jest  # Don't run jest directly without DATABASE_URL set!
```

The tests use `deleteMany()` in `beforeEach` to clean up test data. This is correct behavior for the test database but would be catastrophic if run against the dev database.

## Seed Script

The seed script at `packages/db/prisma/seed.js` uses upsert operations and should preserve existing data. Only run it during initial setup or when intentionally reseeding.

## Troubleshooting

If the DEV database (port 5435) is empty:
1. Run `node packages/db/scripts/fetch-cards.js` to fetch card data
2. Run `node packages/db/prisma/seed.js` to populate the database
3. This will add 20,000+ cards with prices to the dev database
