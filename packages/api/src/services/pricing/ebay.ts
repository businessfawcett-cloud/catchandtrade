export interface EbayToken {
  accessToken: string;
  expiresAt: number; // Unix timestamp ms
}

export interface CalculatedPrices {
  priceMarket: number | null;
  priceMid: number | null;
  priceLow: number | null;
  priceHigh: number | null;
  ebayBuyNowLow: number | null;
  listingCount: number;
}

export interface MatchedListing {
  cardId: string;
  price: number;
  listingTitle: string;
  cardNumber: string;
}

export class PricingError extends Error {
  constructor(message: string, public statusCode: number = 500) {
    super(message);
    this.name = 'PricingError';
  }
}

// ── Budget Tracker ──────────────────────────────────────────────────────

export class BudgetTracker {
  private dailyCount: number = 0;
  private lastResetDate: string = '';
  private totalBudget: number;
  private reservedBudget: number = 500;

  constructor() {
    this.totalBudget = parseInt(process.env.EBAY_DAILY_BUDGET || '5000', 10);
    this.resetIfNewDay();
  }

  private resetIfNewDay(): void {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD UTC
    if (this.lastResetDate !== today) {
      this.dailyCount = 0;
      this.lastResetDate = today;
    }
  }

  canMakeCall(useReserve: boolean = false): boolean {
    this.resetIfNewDay();
    const limit = useReserve ? this.totalBudget : this.totalBudget - this.reservedBudget;
    return this.dailyCount < limit;
  }

  recordCall(): void {
    this.resetIfNewDay();
    this.dailyCount++;
  }

  getRemainingBudget(): number {
    this.resetIfNewDay();
    return this.totalBudget - this.dailyCount;
  }

  getRemainingForSync(): number {
    this.resetIfNewDay();
    return Math.max(0, this.totalBudget - this.reservedBudget - this.dailyCount);
  }

  getDailyCount(): number {
    return this.dailyCount;
  }
}

// ── eBay Price Fetcher ──────────────────────────────────────────────────

export class EbayPriceFetcher {
  private appId: string;
  private certId: string;
  private token: EbayToken | null = null;
  private baseUrl = 'https://api.ebay.com';
  private isMockMode: boolean;

  constructor() {
    this.appId = process.env.EBAY_APP_ID || '';
    this.certId = process.env.EBAY_CERT_ID || '';
    this.isMockMode = !this.appId || !this.certId;

    if (this.isMockMode) {
      console.log('eBay credentials not configured — running in mock mode');
    }
  }

  // ── OAuth2 ────────────────────────────────────────────────────────────

  async getAccessToken(): Promise<string> {
    if (this.isMockMode) return 'mock-token';

    // Return cached token if still valid (refresh 5 min before expiry)
    if (this.token && this.token.expiresAt > Date.now() + 5 * 60 * 1000) {
      return this.token.accessToken;
    }

    const credentials = Buffer.from(`${this.appId}:${this.certId}`).toString('base64');

    const response = await fetch(`${this.baseUrl}/identity/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope',
    });

    if (!response.ok) {
      throw new PricingError(`eBay OAuth failed: ${response.status}`, response.status);
    }

    const data = await response.json() as { access_token: string; expires_in: number };
    this.token = {
      accessToken: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };

    console.log('eBay token obtained, expires in', data.expires_in, 'seconds');
    return this.token.accessToken;
  }

  // ── Search Methods ────────────────────────────────────────────────────

  async searchBySet(setName: string): Promise<any[]> {
    if (this.isMockMode) return this.mockSearchResults(setName);

    return this.searchWithBackoff({
      q: `${setName} Pokemon Card`,
      category_ids: '183454',
      filter: 'buyingOptions:{FIXED_PRICE},conditions:{NEW|LIKE_NEW|VERY_GOOD}',
      fieldgroups: 'EXTENDED',
      limit: '200',
    });
  }

  async searchByCard(setName: string, cardNumber: string): Promise<any[]> {
    if (this.isMockMode) return this.mockSearchResults(setName, cardNumber);

    return this.searchWithBackoff({
      q: `"${setName}" "${cardNumber}"`,
      category_ids: '183454',
      filter: 'buyingOptions:{FIXED_PRICE},conditions:{NEW|LIKE_NEW|VERY_GOOD}',
      fieldgroups: 'EXTENDED',
      limit: '200',
    });
  }

  private async searchWithBackoff(params: Record<string, string>): Promise<any[]> {
    const maxRetries = 3;
    let delay = 60000; // 60 seconds initial

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const token = await this.getAccessToken();
        const queryString = new URLSearchParams(params).toString();
        const url = `${this.baseUrl}/buy/browse/v1/item_summary/search?${queryString}`;

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
          },
        });

        if (response.status === 429) {
          if (attempt < maxRetries) {
            console.log(`eBay rate limited, retrying in ${delay / 1000}s (attempt ${attempt + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2; // exponential backoff
            continue;
          }
          throw new PricingError('eBay rate limit exceeded after retries', 429);
        }

        if (!response.ok) {
          throw new PricingError(`eBay API error: ${response.status}`, response.status);
        }

        const data = await response.json() as { itemSummaries?: any[] };
        return data.itemSummaries || [];
      } catch (error) {
        if (error instanceof PricingError) throw error;
        if (attempt < maxRetries) {
          console.log(`eBay search error, retrying in ${delay / 1000}s:`, (error as Error).message);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2;
          continue;
        }
        throw error;
      }
    }

    return [];
  }

  // ── Card Matching ─────────────────────────────────────────────────────

  matchListingsToCards(
    listings: any[],
    dbCards: Array<{ id: string; cardNumber: string }>,
  ): Map<string, MatchedListing[]> {
    const cardMap = new Map<string, { id: string; cardNumber: string }>();
    for (const card of dbCards) {
      // Normalize card number: strip leading zeros for matching
      const normalized = card.cardNumber.replace(/^0+/, '');
      cardMap.set(normalized, card);
    }

    const matched = new Map<string, MatchedListing[]>();

    for (const listing of listings) {
      const extractedNumber = this.extractCardNumber(listing);
      if (!extractedNumber) continue;

      const normalized = extractedNumber.replace(/^0+/, '');
      const card = cardMap.get(normalized);
      if (!card) continue;

      const price = this.extractPrice(listing);
      if (price === null || price <= 0) continue;

      if (!matched.has(card.id)) {
        matched.set(card.id, []);
      }

      matched.get(card.id)!.push({
        cardId: card.id,
        price,
        listingTitle: listing.title || '',
        cardNumber: extractedNumber,
      });
    }

    return matched;
  }

  private extractCardNumber(listing: any): string | null {
    // Primary: check localizedAspects for structured "Card Number"
    if (listing.localizedAspects) {
      for (const aspect of listing.localizedAspects) {
        if (
          aspect.name &&
          aspect.name.toLowerCase().includes('card number') &&
          aspect.value
        ) {
          // Value might be "025/165" or just "025"
          const match = aspect.value.match(/(\d+)/);
          if (match) return match[1];
        }
      }
    }

    // Fallback: regex on title
    const title = listing.title || '';

    // Match "025/165" format
    const slashMatch = title.match(/(\d{1,3})\s*\/\s*\d{1,3}/);
    if (slashMatch) return slashMatch[1];

    // Match "#025" or "No. 025" format
    const hashMatch = title.match(/(?:#|No\.?)\s*(\d{1,3})/i);
    if (hashMatch) return hashMatch[1];

    return null;
  }

  private extractPrice(listing: any): number | null {
    const priceObj = listing.price;
    if (!priceObj || !priceObj.value) return null;
    const value = parseFloat(priceObj.value);
    return isNaN(value) ? null : value;
  }

  // ── Price Calculation ─────────────────────────────────────────────────

  calculatePrices(listings: MatchedListing[]): CalculatedPrices {
    if (listings.length === 0) {
      return {
        priceMarket: null,
        priceMid: null,
        priceLow: null,
        priceHigh: null,
        ebayBuyNowLow: null,
        listingCount: 0,
      };
    }

    const prices = listings.map(l => l.price).sort((a, b) => a - b);
    const count = prices.length;

    // Absolute minimum (no trimming) for Buy It Now low
    const ebayBuyNowLow = round2(prices[0]);

    let trimmedPrices: number[];

    if (count < 3) {
      // < 3 listings: raw average, no trimming
      trimmedPrices = prices;
    } else if (count < 5) {
      // 3-4 listings: untrimmed average
      trimmedPrices = prices;
    } else {
      // >= 5 listings: trim top/bottom 10%
      const trimCount = Math.floor(count * 0.1);
      trimmedPrices = prices.slice(trimCount, count - trimCount);
    }

    const priceMarket = round2(avg(trimmedPrices));
    const priceMid = round2(median(prices)); // median of full (untrimmed) list
    const priceLow = round2(trimmedPrices[0]);
    const priceHigh = round2(trimmedPrices[trimmedPrices.length - 1]);

    return {
      priceMarket,
      priceMid,
      priceLow,
      priceHigh,
      ebayBuyNowLow,
      listingCount: count,
    };
  }

  // ── Mock Mode ─────────────────────────────────────────────────────────

  private mockSearchResults(setName: string, cardNumber?: string): any[] {
    const count = cardNumber ? Math.floor(Math.random() * 8) + 1 : Math.floor(Math.random() * 50) + 10;
    const results: any[] = [];

    for (let i = 0; i < count; i++) {
      const num = cardNumber || String(Math.floor(Math.random() * 200) + 1);
      const basePrice = Math.random() * 100 + 1;
      results.push({
        title: `${setName} Pokemon Card ${num}/200`,
        price: { value: basePrice.toFixed(2), currency: 'USD' },
        localizedAspects: [
          { name: 'Card Number', value: `${num}/200` },
        ],
        condition: 'New',
        buyingOptions: ['FIXED_PRICE'],
      });
    }

    return results;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((sum, n) => sum + n, 0) / nums.length;
}

function median(sorted: number[]): number {
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export default EbayPriceFetcher;
