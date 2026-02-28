# Feature Specification: eBay Pricing Integration

**Feature Branch**: `001-ebay-pricing`
**Created**: 2026-02-28
**Status**: Draft
**Input**: User description: "Replace all TCGPlayer pricing dependencies with the eBay Browse API for reliable, API-based card pricing"

## Clarifications

### Session 2026-02-28

- Q: What is the minimum number of eBay listings required before calculating a market price for a card? → A: Minimum 3 listings for market price (raw average); trimmed mean applies at 5+ listings
- Q: What is the default staleness threshold for marking a card's price as outdated? → A: 48 hours default, configurable via environment variable in hours

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Current Card Prices (Priority: P1)

A user browsing cards on catchandtrade.com wants to see accurate, up-to-date pricing for any Pokemon card. The card detail page displays two key data points: the **market price** (what the card is generally worth based on active listings) and the **lowest Buy It Now price** (the cheapest price a user could purchase the card for right now). Pricing data is sourced from eBay active listings.

**Why this priority**: Card pricing is the core value proposition — users visit the site primarily to check what cards are worth. Without reliable pricing, the entire application loses its purpose.

**Independent Test**: Can be fully tested by navigating to any card detail page and verifying that market price and Buy It Now price are displayed with data sourced from eBay listings.

**Acceptance Scenarios**:

1. **Given** a card with eBay listing data, **When** a user views the card detail page, **Then** they see the market price (average of active listings after removing outliers), the lowest Buy It Now price, and a price range (low to high)
2. **Given** a card with no eBay listing data available, **When** a user views the card detail page, **Then** the last known price is displayed
3. **Given** a card that has never had any pricing data, **When** a user views the card detail page, **Then** the system displays "No market data available" instead of a price

---

### User Story 2 - Accurate Portfolio Valuation (Priority: P2)

A portfolio owner wants their collection's total value calculated from current eBay market prices so they have an accurate picture of what their cards are worth. Each card in their portfolio shows its current market price and quantity, with a total portfolio value summed from all holdings.

**Why this priority**: Portfolio valuation is the second most-used feature after individual card lookup. Users rely on accurate aggregate values for insurance, trading, and collection management decisions.

**Independent Test**: Can be fully tested by creating a portfolio with several cards, verifying that each card shows its eBay-sourced market price, and confirming the total value calculation is correct.

**Acceptance Scenarios**:

1. **Given** a user with cards in their portfolio, **When** they view the portfolio page, **Then** each card displays its current market price sourced from eBay and the total portfolio value is the sum of (market price x quantity) for all cards
2. **Given** a user views their portfolio, **When** they sort by price, **Then** cards are ordered correctly using eBay-sourced market prices
3. **Given** a card in the portfolio has stale pricing data, **When** the user views the portfolio, **Then** the stale card's price is still included in the total value with no special indicator (staleness is internal only)

---

### User Story 3 - Continuous Price History (Priority: P3)

A user viewing a card's price history chart expects to see an unbroken trend line across the pricing source transition. Historical prices from the previous source are preserved alongside new eBay-sourced prices, so users can track long-term value trends without gaps or discontinuities.

**Why this priority**: Price history provides critical context for buying/selling decisions. A gap in the chart during the transition would undermine user trust in the platform's data reliability.

**Independent Test**: Can be fully tested by viewing the price history chart for a card that has both legacy and new pricing data, and verifying the chart displays a continuous line across all time periods (7D, 30D, 90D, 1Y).

**Acceptance Scenarios**:

1. **Given** a card with historical pricing from the previous source and new eBay pricing, **When** a user views the price history chart, **Then** the chart displays a continuous trend line including both legacy and current data points
2. **Given** a card with only legacy pricing and no eBay data yet, **When** a user views the price history chart, **Then** the existing historical data is still displayed

---

### User Story 4 - Removal of Unused Features and Dead Code (Priority: P4)

The system removes all dependencies on the previous pricing source (TCGPlayer) and the unshipped Price Alerts feature. This ensures the codebase is clean, maintainable, and free of broken or unused functionality. All database field names are updated to be source-agnostic.

**Why this priority**: While not user-facing, removing dead code and broken integrations prevents confusion for developers and eliminates potential security/maintenance liabilities. This is essential cleanup that accompanies the pricing source swap.

**Independent Test**: Can be tested by verifying that no references to the previous pricing source remain in the codebase, no alert-related code or database models exist, and all renamed fields work correctly throughout the application.

**Acceptance Scenarios**:

1. **Given** the migration is complete, **When** a developer searches the codebase, **Then** zero references to "tcgplayer" exist in active code (excluding historical price records tagged with their original source)
2. **Given** the Price Alerts feature code has been removed, **When** a user attempts to access alert-related endpoints, **Then** they receive appropriate "not found" responses
3. **Given** database fields have been renamed to source-agnostic names, **When** any part of the application reads or writes pricing data, **Then** it uses the new field names and all existing data is preserved

---

### Edge Cases

- What happens when eBay returns zero results for a card search? The system retains the last known price and marks the card as stale.
- What happens when the daily API call budget is exhausted? The system stops making new API calls for the day; existing cached prices remain available, and the next sync cycle resumes the following day.
- What happens when a card listing on eBay is misidentified (wrong card matched)? The outlier trimming algorithm (removing top/bottom 10% of prices) mitigates the impact of incorrect matches on the calculated market price.
- What happens during the migration with existing price data? All existing prices are preserved — column renames do not delete data. Historical records retain their original source tag.
- What happens when a card is in a user's portfolio but has never been priced? The card appears in the portfolio with "No market data available" and is excluded from the total value calculation until pricing data becomes available.
- What happens when fewer than 3 listings exist for a card? The system uses the raw average of available listings (1-2) without outlier trimming. With 3-4 listings, an untrimmed average is used. Trimmed mean only applies at 5+ listings.
- What happens if the pricing service credentials are not configured? The system operates in a development/fallback mode with placeholder prices, allowing the application to function without live data.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display two pricing data points for each card: a market price (calculated average from active listings after outlier removal) and the lowest available Buy It Now price
- **FR-002**: System MUST display a price range (low to high) for each card derived from active listings after outlier removal
- **FR-003**: System MUST source all new pricing data from eBay active listings for the US marketplace, restricted to Pokemon Trading Card Game category items in new, like-new, or very good condition
- **FR-004**: System MUST calculate market price using a trimmed mean algorithm that removes the top and bottom 10% of listing prices before averaging. Minimum 3 listings required to calculate a market price; below 3, use the raw average of available listings. Trimmed mean only applies when 5 or more listings exist; with 3-4 listings, use untrimmed average
- **FR-005**: System MUST calculate and store median price, low price (after outlier removal), and high price (after outlier removal) alongside the market price
- **FR-006**: System MUST use a two-tiered sync strategy: a bulk pass that searches by set name to efficiently price many cards per API call, followed by a precision pass that targets individual high-priority stale cards
- **FR-007**: System MUST prioritize pricing updates for cards in user portfolios and watchlists, followed by highest-value cards, followed by cards with the oldest pricing data
- **FR-008**: System MUST enforce a daily API call budget (5,000 calls) with a reserved portion (500 calls) for user-triggered on-demand price refreshes, and never exceed the total daily quota
- **FR-009**: System MUST mark cards as stale when pricing data has not been successfully refreshed within a configurable time window (default: 48 hours, configurable via environment variable in hours). Staleness is tracked internally for sync prioritization and admin visibility; no user-facing staleness indicator is displayed
- **FR-010**: System MUST handle pricing service errors gracefully: retain last known prices on failure (per-card try/catch so one failure doesn't abort the batch), automatically refresh expired authentication, and use exponential backoff when rate-limited
- **FR-011**: System MUST preserve all existing historical price data during the migration, including records tagged with their original source
- **FR-012**: System MUST rename all pricing-source-specific database field names to source-agnostic names while preserving existing data through column renames (not drop-and-recreate)
- **FR-013**: System MUST remove all code related to the previous pricing source (TCGPlayer), including scraping scripts, API clients, and hardcoded credentials
- **FR-014**: System MUST remove the unshipped Price Alerts feature, including its data model, API endpoints, background processing logic, and any frontend components
- **FR-015**: System MUST calculate portfolio total value as the sum of (market price × quantity) for all cards in the portfolio that have pricing data, skipping cards with no market price (null values are excluded from the sum, not treated as zero)
- **FR-016**: System MUST match eBay listings to cards in the database using set code and card number extracted from listing titles or structured listing attributes

### Key Entities

- **Card**: A Pokemon trading card identified by set and card number. Key pricing attributes: a reference ID for the Pokemon TCG data API (renamed from the previous source-specific field name), and a relationship to its price records.
- **CardPrice**: The current pricing snapshot for a card, including market price, median price, low/high range, lowest Buy It Now price, last update timestamp, and staleness flag. One active price record per card.
- **PriceHistory**: A time-series record of a card's price over time, tagged with the data source (legacy or current). Enables price trend charts across source transitions.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All cards in user portfolios have current pricing data sourced from eBay within 7 days of launch
- **SC-002**: Zero references to the previous pricing source (TCGPlayer) remain in the active codebase after migration
- **SC-003**: Price history charts display continuous data with no gaps across the pricing source transition for all cards that had prior price records
- **SC-004**: The daily pricing sync completes within its API call budget every day without exceeding rate limits
- **SC-005**: Card detail pages display both market price and Buy It Now price for all cards that have eBay listing data
- **SC-006**: The bulk sync pass prices at least 20 cards per API call on average, demonstrating efficient batch coverage
- **SC-007**: Cards with pricing data older than the configured freshness window are correctly flagged as stale in the database for sync prioritization
- **SC-008**: Portfolio total value calculations match the sum of individual card market prices multiplied by their quantities, with less than $0.01 rounding variance

## Assumptions

- The eBay basic API tier provides 5,000 calls per day, which is sufficient for the current card catalog size when combined with the two-tiered sync strategy
- The eBay Pokemon Trading Card Game category contains sufficient active listings for the majority of cards in the database
- USD is the only currency needed for V1; multi-currency support is out of scope
- The trimmed mean (removing top/bottom 10%) is an adequate outlier filtering strategy for listing prices
- PriceCharting integration fields can be preserved in the schema but are not active for V1
- The Price Alerts feature has no active users and can be removed without notification
- Graded card pricing is out of scope for V1 — only ungraded/raw card listings are considered
- Existing scraping-based and third-party API pricing scripts can be deleted entirely, not archived

## Scope Boundaries

**In scope:**
- eBay Browse API integration for active listing prices (Buy It Now only)
- Two-tiered sync engine (bulk + precision) with daily budget enforcement
- Schema migration: rename source-specific fields, add new columns
- Removal of all TCGPlayer code and dependencies
- Removal of Price Alerts feature
- Staleness tracking and user-facing indicators
- Frontend updates to display new pricing fields

**Out of scope:**
- Sold/completed listing data (requires separate eBay Marketplace Insights approval)
- Graded card pricing
- Multi-currency support
- PriceCharting integration activation
- New features beyond the pricing source swap and cleanup
- eBay affiliate link integration
