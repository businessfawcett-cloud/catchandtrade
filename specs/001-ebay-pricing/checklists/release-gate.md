# Release Gate Checklist: eBay Pricing Integration

**Purpose**: Formal sign-off checklist validating requirement quality, completeness, and clarity across all domains (migration, integration, algorithm, frontend, cleanup) before deployment
**Created**: 2026-02-28
**Feature**: [spec.md](../spec.md) | [plan.md](../plan.md)

## Requirement Completeness

- [ ] CHK001 - Are all CardPrice field renames exhaustively enumerated with before/after names? [Completeness, Spec §FR-012, Plan §Phase 1]
- [ ] CHK002 - Are requirements specified for what happens to existing CardPrice records that have NULL values in renamed fields during migration? [Completeness, Gap]
- [ ] CHK003 - Are all files to be deleted explicitly listed, and is there a requirement to verify no other code imports from them? [Completeness, Spec §FR-013]
- [ ] CHK004 - Are requirements defined for the SyncLog model changes when Price Alerts are removed (triggeredAlerts field)? [Completeness, Gap]
- [ ] CHK005 - Is the behavior specified for the `/api/pricing/cards/:id/snapshot` endpoint under the new eBay budget system? [Completeness, Spec §FR-008]
- [ ] CHK006 - Are requirements documented for how the weekly sync (syncSets/syncCards) handles the `pokemonTcgId` rename? [Completeness, Gap]
- [ ] CHK007 - Is the `listingCount` field's purpose and consumption defined in the spec? [Completeness, Gap — appears in plan but not spec]

## Requirement Clarity

- [ ] CHK008 - Is "configurable time window" in FR-009 now fully quantified with the 48-hour default and env var mechanism? [Clarity, Spec §FR-009, Clarification §Session]
- [ ] CHK009 - Is the trimmed mean calculation unambiguous for exactly 5 listings (10% of 5 = 0.5 — does this round to 0 or 1 items trimmed per end)? [Clarity, Spec §FR-004]
- [ ] CHK010 - Is "card number extracted from listing titles or structured listing attributes" specific enough for implementation? [Clarity, Spec §FR-016]
- [ ] CHK011 - Are the eBay listing condition filters ("new, like-new, or very good") mapped to specific eBay condition IDs or left as display names? [Clarity, Spec §FR-003]
- [ ] CHK012 - Is "back off when rate-limited" in FR-010 quantified with a specific backoff duration or strategy? [Clarity, Spec §FR-010]
- [ ] CHK013 - Is the meaning of "on-demand operations" for the reserved 500-call budget explicitly defined? [Clarity, Spec §FR-008]

## Requirement Consistency

- [ ] CHK014 - Are the field names consistent between the spec's Key Entities section and the plan's Phase 1 schema changes? [Consistency, Spec §Key Entities vs Plan §Phase 1]
- [ ] CHK015 - Does the edge case "excluded from total value calculation" for unpriced cards align with FR-015 which says "sum of (market price x quantity) for all cards"? [Consistency, Spec §Edge Cases vs §FR-015]
- [ ] CHK016 - Are the priority ordering criteria in FR-007 (portfolios/watchlists → highest-value → oldest) consistent between the spec and the plan's Tier 2 description? [Consistency, Spec §FR-007 vs Plan §Phase 3]
- [ ] CHK017 - Is the `ebayRecentAvg` → `ebaySoldAvg` rename referenced consistently across spec, plan, and contracts? [Consistency]
- [ ] CHK018 - Does the spec's User Story 4 acceptance scenario 1 ("zero references to tcgplayer") account for the `source: "tcgplayer"` values that must be preserved in PriceHistory? [Consistency, Spec §US4-AS1 vs §FR-011]

## Acceptance Criteria Quality

- [ ] CHK019 - Is SC-006 ("at least 20 cards per API call on average") measurable given that some sets may have fewer than 20 cards in the database? [Measurability, Spec §SC-006]
- [ ] CHK020 - Is SC-003 ("continuous data with no gaps") defined with a specific tolerance for the transition boundary between legacy and new price sources? [Measurability, Spec §SC-003]
- [ ] CHK021 - Is SC-008 ("less than $0.01 rounding variance") testable with a defined test methodology? [Measurability, Spec §SC-008]
- [ ] CHK022 - Is SC-001 ("within 7 days of launch") achievable given the 5,000 calls/day budget and ~15,000+ cards, and is the math documented? [Measurability, Spec §SC-001 vs §Assumptions]

## Scenario Coverage

- [ ] CHK023 - Are requirements defined for the first-ever sync run when ALL cards have no eBay data yet (initial migration backfill)? [Coverage, Gap]
- [ ] CHK024 - Are requirements specified for what happens when eBay API is completely unreachable for multiple consecutive days? [Coverage, Exception Flow]
- [ ] CHK025 - Are requirements defined for the transition period where some cards have eBay prices and others still only have legacy TCGPlayer prices? [Coverage, Alternate Flow]
- [ ] CHK026 - Are requirements specified for how the frontend handles the mix of stale and fresh prices within a single portfolio view? [Coverage, Spec §US2-AS3]
- [ ] CHK027 - Are requirements documented for concurrent sync runs (e.g., manual snapshot triggered during nightly sync)? [Coverage, Gap]

## Edge Case Coverage

- [ ] CHK028 - Are requirements defined for cards where eBay returns listings but none can be matched to a specific card number? [Edge Case, Gap]
- [ ] CHK029 - Is the behavior specified when a card exists in multiple eBay listing formats (e.g., "025/165" vs "025" vs "25")? [Edge Case, Spec §FR-016]
- [ ] CHK030 - Are requirements defined for handling eBay listings with prices of $0.00 or $0.01 (penny listings)? [Edge Case, Gap]
- [ ] CHK031 - Is the behavior specified when the daily budget resets mid-sync (sync running at midnight UTC)? [Edge Case, Gap]
- [ ] CHK032 - Are requirements defined for cards that exist in the database but have no corresponding eBay category listings (e.g., very old or promo sets)? [Edge Case, Gap]

## Non-Functional Requirements

- [ ] CHK033 - Are performance requirements specified for how long the nightly sync should take to complete? [Non-Functional, Gap]
- [ ] CHK034 - Are observability requirements defined for sync progress, budget consumption, and error rates? [Non-Functional, Gap — deferred from clarify phase]
- [ ] CHK035 - Are security requirements specified for eBay credential storage beyond "environment variables"? [Non-Functional, Gap]
- [ ] CHK036 - Are rollback requirements defined if the schema migration fails partway through? [Non-Functional, Recovery Flow, Gap]

## Dependencies & Assumptions

- [ ] CHK037 - Is the assumption that "5,000 calls/day is sufficient" validated with a calculation against ~170 sets and ~15,000+ cards? [Assumption, Spec §Assumptions]
- [ ] CHK038 - Is the assumption that "eBay category 183454 contains sufficient listings" validated or at least documented with a fallback if coverage is insufficient? [Assumption, Spec §Assumptions]
- [ ] CHK039 - Is the dependency on eBay's `EXTENDED` fieldgroup for `localizedAspects` documented with a fallback if eBay changes this API behavior? [Dependency, Gap]
- [ ] CHK040 - Is the assumption that "Price Alerts has no active users" validated with data or at minimum documented as a risk? [Assumption, Spec §Assumptions]

## Notes

- Check items off as completed: `[x]`
- Items marked `[Gap]` indicate requirements that may need to be added to the spec before release
- Items marked `[Consistency]` or `[Conflict]` should be resolved by updating the relevant spec sections
- This checklist is a release gate — all critical items should be resolved before deployment
- Items are numbered CHK001-CHK040 for cross-referencing in reviews
