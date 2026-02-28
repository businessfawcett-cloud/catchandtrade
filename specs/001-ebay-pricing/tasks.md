# Tasks: eBay Pricing Integration

**Input**: Design documents from `/specs/001-ebay-pricing/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/api-endpoints.md

**Tests**: No test framework configured — tests not included. Manual testing via quickstart.md verification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Environment configuration for the new pricing source

- [x] T001 Update environment variable template — add `STALE_THRESHOLD_HOURS=48` and `EBAY_DAILY_BUDGET=5000` to `.env.example`; remove `TCGPLAYER_PUBLIC_KEY`, `TCGPLAYER_PRIVATE_KEY`, `TCGPLAYER_AFFILIATE_ID`; verify `EBAY_APP_ID` and `EBAY_CERT_ID` are already present

---

## Phase 2: Foundational (Schema Migration)

**Purpose**: Rename source-specific columns, add new fields, remove PriceAlert model. BLOCKS all user stories.

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 Update Prisma schema in `packages/db/prisma/schema.prisma`: rename `Card.tcgplayerId` → `pokemonTcgId`; rename `CardPrice.tcgplayerLow/Mid/High/Market` → `priceLow/Mid/High/Market`; rename `CardPrice.ebayRecentAvg` → `ebaySoldAvg`; add `CardPrice.ebayBuyNowLow Float?`, `CardPrice.lastUpdated DateTime?`, `CardPrice.isStale Boolean @default(false)`, `CardPrice.listingCount Int @default(0)`; change `PriceHistory.source` default from `"tcgplayer"` to `"ebay"`; delete `PriceAlert` model and `AlertType` enum; remove `priceAlerts` relation from `User` and `Card`; remove `triggeredAlerts` field from `SyncLog`
- [x] T003 Generate and hand-edit migration — run `npx prisma migrate dev --name ebay-pricing-rename --create-only` in `packages/db/`, then edit the generated SQL file in `packages/db/prisma/migrations/` to replace any `DROP COLUMN` + `ADD COLUMN` pairs with `ALTER TABLE ... RENAME COLUMN` for all renamed fields (priceLow, priceMid, priceHigh, priceMarket, ebaySoldAvg, pokemonTcgId), keep Prisma-generated `DROP TABLE` for PriceAlert and `DROP TYPE` for AlertType as-is, then apply with `npx prisma migrate dev`
- [x] T004 [P] Update seed file — rename `tcgplayerId` → `pokemonTcgId` in `packages/db/prisma/seed.js`

**Checkpoint**: Schema migration complete — all renamed fields preserve data, new columns added, PriceAlert removed. Verify in Prisma Studio.

---

## Phase 3: User Story 1 — View Current Card Prices (Priority: P1) MVP

**Goal**: Users see accurate eBay-sourced market price and Buy It Now price on card detail pages. Nightly sync keeps prices fresh.

**Independent Test**: Navigate to any card detail page → verify market price, Buy It Now price, and price range display with eBay-sourced data. Trigger manual sync → verify prices update.

### Implementation for User Story 1

- [x] T005 [US1] Create eBay pricing service in `packages/api/src/services/pricing/ebay.ts` — implement `EbayPriceFetcher` class with: (1) `getAccessToken()` using OAuth2 Client Credentials Grant to `https://api.ebay.com/identity/v1/oauth2/token` with Base64 `EBAY_APP_ID:EBAY_CERT_ID`, caching token in-memory with 5-min-before-expiry refresh; (2) `searchBySet(setName)` querying Browse API `item_summary/search` with `q="{setName} Pokemon Card"`, `category_ids=183454`, `filter=buyingOptions:{FIXED_PRICE},conditions:{NEW|LIKE_NEW|VERY_GOOD}`, `fieldgroups=EXTENDED`, `limit=200`; (3) `searchByCard(setName, cardNumber)` with query `"{setName}" "{cardNumber}"`; (4) `matchListingsToCards(listings, setCode)` extracting card number from `localizedAspects` "Card Number" aspect first, fallback regex `/(\d{1,3})\s*\/\s*\d{1,3}/` on title; (5) `calculatePrices(listings)` implementing tiered trimmed mean per R5 (<3: raw avg, 3-4: untrimmed avg, 5+: trim top/bottom 10%) outputting priceMarket/priceMid/priceLow/priceHigh/ebayBuyNowLow; (6) `BudgetTracker` class with midnight UTC reset, `canMakeCall()`, `recordCall()`, `getRemainingBudget()`, total from `EBAY_DAILY_BUDGET` env (default 5000), 500 reserved for on-demand; (7) exponential backoff on HTTP 429 rate-limit responses (initial delay 60s, doubling per retry, max 3 retries); (8) mock fallback returning random prices when `EBAY_APP_ID` not set
- [x] T006 [US1] Update price aggregator in `packages/api/src/services/pricing/aggregator.ts` — replace `TCGPlayerFetcher` import/usage with `EbayPriceFetcher`; rename `AggregatedPrice` interface fields from `tcgplayer*` to `price*`; add `ebayBuyNowLow`, `lastUpdated`, `isStale`, `listingCount` to interface; update `calculateExpectedValue()` to query `priceMarket` instead of `tcgplayerMarket`; update `snapshotPrices()` to use `card.pokemonTcgId` and call eBay fetcher, writing new field names to CardPrice
- [x] T007 [US1] Rewrite sync engine in `packages/api/src/cron/nightlySync.ts` — remove hardcoded TCGPlayer API key on line 7; rewrite `syncPrices()` as two-tiered engine: (1) `runBulkPass()` iterating all PokemonSet records calling `ebay.searchBySet(set.name)`, matching listings to cards, updating CardPrice with calculated prices + lastUpdated/isStale=false/listingCount, stopping when budget <= 500 remaining; (2) `runPrecisionPass()` querying stale cards ordered by portfolio/watchlist membership then highest priceMarket then oldest lastUpdated, calling `ebay.searchByCard()` per card until budget exhausted; (3) after both passes run staleness sweep marking cards with lastUpdated older than `STALE_THRESHOLD_HOURS` (env, default 48) as isStale=true; wrap each per-card price update in try/catch so a single card failure does not abort the batch — log the error and continue to the next card; add console.log statements for: sync start/end timestamps, budget consumed per tier, total cards matched per bulk pass, error count, remaining budget at sync end; remove all alert evaluation logic from syncPrices; update `syncCards()` to use `pokemonTcgId` instead of `tcgplayerId`
- [x] T008 [US1] Update pricing routes in `packages/api/src/routes/pricing/index.ts` — in GET `/api/pricing/cards/:id/prices` (lines 21-29): rename `tcgplayerMarket/Low/Mid/High` → `priceMarket/Low/Mid/High` in Prisma select and response mapping, rename `ebayRecentAvg` → `ebaySoldAvg`, add `ebayBuyNowLow`, `lastUpdated`, `isStale`, `listingCount` to select and response; in POST `/api/pricing/cards/:id/snapshot` (lines 35-43): update to use EbayPriceFetcher via aggregator, check budget before calling
- [x] T009 [P] [US1] Update card routes in `packages/api/src/routes/cards/index.ts` — rename `tcgplayerMarket` → `priceMarket` at lines 56, 155, 157, 170, 199 across GET `/api/cards`, GET `/api/cards/search`, GET `/api/cards/:id`, and GET `/api/cards/:id/price-history` endpoints; update Prisma select clauses and response mappings to use new field names; add `ebayBuyNowLow`, `lastUpdated`, `isStale`, `listingCount` to card detail response
- [x] T010 [US1] Update card detail frontend in `apps/web/src/app/marketplace/[id]/page.tsx` — update `CardPrice` TypeScript interface: rename `tcgplayerLow/Mid/High/Market` → `priceLow/Mid/High/Market`, add `ebayBuyNowLow: number | null`, `lastUpdated: string | null`, `listingCount: number`; add "Buy Now From: $X.XX" display for `ebayBuyNowLow`; add "No market data available" display when card has no pricing data (all price fields null); remove `tcgplayer` from `getAffiliateLinks()` call; update all price field references throughout the component
- [x] T011 [US1] Update CardDetailPage component in `apps/web/src/components/cards/CardDetailPage.tsx` — rename all `tcgplayerMarket` references to `priceMarket`; update any price display logic to use new field names

**Checkpoint**: Card detail pages display eBay-sourced market price and Buy It Now price. Cards with no data show "No market data available." Manual sync updates prices correctly. Budget tracking enforces daily limit.

---

## Phase 4: User Story 2 — Accurate Portfolio Valuation (Priority: P2)

**Goal**: Portfolio and watchlist views calculate values from eBay-sourced market prices using the renamed `priceMarket` field.

**Independent Test**: Create/view a portfolio with several cards → verify each card shows eBay-sourced price, total value = sum(priceMarket × quantity) for cards with pricing data, unpriced cards excluded from total.

### Implementation for User Story 2

- [x] T012 [P] [US2] Update portfolio routes in `packages/api/src/routes/portfolios/index.ts` — rename `tcgplayerMarket` → `priceMarket` at lines 301, 356 in GET `/api/portfolios/:id/value` and GET `/api/portfolios/:id/summary` endpoints; update Prisma select and value calculation to use `priceMarket`
- [x] T013 [P] [US2] Update watchlist route in `packages/api/src/routes/watchlist/index.ts` — rename `tcgplayerMarket` → `priceMarket` at line 51 in GET `/api/watchlist` endpoint
- [x] T014 [US2] Update portfolio page in `apps/web/src/app/portfolio/page.tsx` — remove TCGPlayer affiliate link; update any price field references to use new names

**Checkpoint**: Portfolio total value and individual card prices reflect eBay-sourced data via `priceMarket`. Watchlist displays correct prices.

---

## Phase 5: User Story 3 — Continuous Price History (Priority: P3)

**Goal**: Price history charts display a continuous trend line across the legacy-to-eBay transition with no gaps.

**Independent Test**: View price history chart for a card with both legacy "tcgplayer" and new "ebay" source records → verify continuous line across all time periods (7D, 30D, 90D, 1Y).

### Implementation for User Story 3

> **Note**: Most US3 requirements are satisfied by foundational and US1 work — the `PriceHistory.source` default change (T002), the `priceMarket` rename in card routes (T009), and `PriceHistoryChart.tsx` requiring no changes (it uses the generic `price` field from PriceHistory, not CardPrice fields). The task below covers the remaining verification concern.

- [x] T015 [US3] Verify price history endpoint continuity in `packages/api/src/routes/cards/index.ts` — confirm GET `/api/cards/:id/price-history` returns both legacy (`source: "tcgplayer"`) and new (`source: "ebay"`) PriceHistory records in chronological order; confirm `currentPrice` in response is sourced from `priceMarket`; confirm no filtering by source field excludes legacy data

**Checkpoint**: Price history charts show unbroken trend lines across source transition. Legacy data preserved and displayed alongside new eBay data.

---

## Phase 6: User Story 4 — Dead Code Cleanup (Priority: P4)

**Goal**: Remove all TCGPlayer code, Price Alerts feature, obsolete scripts, and stale references. Zero "tcgplayer" references remain in active code.

**Independent Test**: Run `grep -r "tcgplayer" packages/ apps/ --include="*.ts" --include="*.tsx" --include="*.js"` → zero matches in active code (historical PriceHistory records with `source: "tcgplayer"` in the database are expected and excluded).

### Implementation for User Story 4

- [x] T016 [US4] Delete TCGPlayer service file `packages/api/src/services/pricing/tcgplayer.ts`
- [x] T017 [US4] Delete alerts route and remove from router — delete `packages/api/src/routes/alerts/index.ts`; remove `alertsRouter` import (line 14) and route registration (line 67) from `packages/api/src/index.ts`
- [x] T018 [P] [US4] Delete obsolete pricing scripts — delete `packages/db/scripts/puppeteer-prices.js`, `packages/db/scripts/scrape-prices.js`, `packages/db/scripts/sync-prices.js`
- [x] T019 [P] [US4] Update remaining DB scripts — in `packages/db/scripts/add-sample-prices.js` rename all `tcgplayerLow/Mid/High/Market` → `priceLow/Mid/High/Market`; in `packages/db/scripts/record-price-snapshot.js` rename tcgplayer fields and change source from `"tcgplayer"` to `"ebay"`; in `packages/db/scripts/import-cards.js` rename `tcgplayerId` → `pokemonTcgId`
- [x] T020 [US4] Remove TCGPlayer affiliate method from `packages/shared/src/affiliate.ts` — remove the tcgplayer-specific affiliate link generation function/method
- [x] T021 [US4] Remove TCGPlayer affiliate link from marketplace listing page `apps/web/src/app/marketplace/page.tsx`

**Checkpoint**: Zero "tcgplayer" references in active TypeScript/JavaScript code. Alert endpoints return 404. Obsolete scripts deleted.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup and verification across all user stories

- [x] T022 Remove obsolete npm scripts from root `package.json` — remove any `sync-prices`, `fetch-prices`, `scrape-prices` script entries that referenced deleted files
- [x] T023 Run full codebase grep for "tcgplayer" — search all `packages/` and `apps/` directories for remaining references in `.ts`, `.tsx`, `.js` files; fix any missed occurrences (excluding comments explaining legacy data)
- [x] T024 Run quickstart.md verification — execute all steps in `specs/001-ebay-pricing/quickstart.md` verification checklist to confirm end-to-end functionality

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — **BLOCKS all user stories**
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - US1 (Phase 3) should be completed first as MVP
  - US2 (Phase 4) can begin after Phase 2 (no dependency on US1 backend, only shared schema)
  - US3 (Phase 5) is mostly satisfied by Phase 2 + US1 — verification only
  - US4 (Phase 6) should run AFTER US1 to avoid deleting tcgplayer.ts before aggregator is updated
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2. The eBay service (T005) must precede the aggregator update (T006), which must precede the sync engine rewrite (T007). Card route update (T009) can parallel with T005-T007. Pricing route update (T008) depends on T006 (snapshot endpoint uses aggregator). Frontend (T010, T011) depends on route contracts being finalized.
- **US2 (P2)**: Can start after Phase 2. Route updates (T012, T013) are independent of US1. Frontend (T014) can parallel with route work.
- **US3 (P3)**: Verification task (T015) depends on US1's card route update (T009) being complete.
- **US4 (P4)**: Must run AFTER US1 completion — deleting `tcgplayer.ts` (T016) requires `aggregator.ts` to already reference `ebay.ts`. T017 (alerts deletion) is independent. Script cleanup (T018, T019) can run anytime after Phase 2.

### Within Each User Story

- Services before aggregator before sync engine (T005 → T006 → T007)
- Route updates can parallel with each other (T008 ‖ T009, T012 ‖ T013)
- Frontend updates after backend routes are stable

### Parallel Opportunities

**After Phase 2 completes, these can run simultaneously:**

```
Stream A (US1 Core):    T005 → T006 → T007
Stream B (US1 Routes):  T009 (parallel with Stream A); T008 after T006
Stream C (US2 Routes):  T012 ‖ T013  (parallel with each other, parallel with Streams A/B)
Stream D (US4 Scripts): T018 ‖ T019  (parallel with each other, parallel with everything)
```

**After US1 Core completes:**

```
Stream E (US1 Frontend): T010 → T011
Stream F (US4 Cleanup):  T016, T017, T020, T021
Stream G (US3 Verify):   T015
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational schema migration (T002-T004)
3. Complete Phase 3: User Story 1 — eBay service, sync, routes, frontend (T005-T011)
4. **STOP and VALIDATE**: Trigger manual sync, verify card detail pages show eBay prices
5. Deploy/demo if ready — users can see card prices from eBay

### Incremental Delivery

1. Setup + Foundational → Schema ready, existing app still works (prices preserved)
2. Add US1 → Cards show eBay prices, sync runs nightly → **Deploy (MVP!)**
3. Add US2 → Portfolios/watchlists use eBay prices → Deploy
4. Add US3 → Verify price history continuity → Deploy
5. Add US4 → Dead code removed, codebase clean → Deploy
6. Polish → Final grep, quickstart verification → Release

---

## Summary

| Phase | Story | Tasks | Parallel |
|-------|-------|-------|----------|
| 1. Setup | — | 1 | — |
| 2. Foundational | — | 3 | T004 parallel with T003 |
| 3. US1 - Card Prices | P1 MVP | 7 | T009 parallel; T008 after T006; T005-T007 sequential |
| 4. US2 - Portfolio | P2 | 3 | T012 ‖ T013 |
| 5. US3 - History | P3 | 1 | — |
| 6. US4 - Cleanup | P4 | 6 | T018 ‖ T019 |
| 7. Polish | — | 3 | — |
| **Total** | | **24** | |

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- No test tasks included — no test framework configured
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- The eBay service (T005) is the largest single task — consider reviewing after implementation before proceeding
