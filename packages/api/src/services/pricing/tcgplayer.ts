export interface TCGPlayerPrice {
  productId: string;
  low: number | null;
  mid: number | null;
  high: number | null;
  market: number | null;
}

export class PricingError extends Error {
  constructor(message: string, public statusCode: number = 500) {
    super(message);
    this.name = 'PricingError';
  }
}

export class TCGPlayerFetcher {
  private apiKey: string;
  private secretKey: string;
  private baseUrl = 'https://api.tcgplayer.com';

  constructor() {
    this.apiKey = process.env.TCGPLAYER_PUBLIC_KEY || '';
    this.secretKey = process.env.TCGPLAYER_PRIVATE_KEY || '';
  }

  async fetch(productId: string): Promise<TCGPlayerPrice> {
    if (!this.apiKey || !this.secretKey) {
      return this.mockFetch(productId);
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/pricing/product/${productId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.getAccessToken()}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status === 404) {
        throw new PricingError(`Product not found: ${productId}`, 404);
      }

      if (response.status === 429) {
        throw new PricingError('Rate limited', 429);
      }

      if (!response.ok) {
        throw new PricingError(`TCGPlayer API error: ${response.status}`, response.status);
      }

      const data = await response.json();
      return this.parseResponse(data, productId);
    } catch (error) {
      if (error instanceof PricingError) throw error;
      console.error('TCGPlayer fetch error:', error);
      return this.mockFetch(productId);
    }
  }

  private async getAccessToken(): Promise<string> {
    const response = await fetch(`${this.baseUrl}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `grant_type=client_credentials&client_id=${this.apiKey}&client_secret=${this.secretKey}`
    });

    const data = await response.json() as { access_token: string };
    return data.access_token;
  }

  private parseResponse(data: any, productId: string): TCGPlayerPrice {
    const firstResult = data.results?.[0];
    if (!firstResult) {
      return {
        productId,
        low: null,
        mid: null,
        high: null,
        market: null
      };
    }

    return {
      productId,
      low: firstResult.lowPrice || null,
      mid: firstResult.midPrice || null,
      high: firstResult.highPrice || null,
      market: firstResult.marketPrice || null
    };
  }

  private mockFetch(productId: string): TCGPlayerPrice {
    const basePrice = Math.random() * 500 + 10;
    return {
      productId,
      low: Math.round(basePrice * 0.8 * 100) / 100,
      mid: Math.round(basePrice * 100) / 100,
      high: Math.round(basePrice * 1.2 * 100) / 100,
      market: Math.round(basePrice * 0.95 * 100) / 100
    };
  }
}

export default TCGPlayerFetcher;
