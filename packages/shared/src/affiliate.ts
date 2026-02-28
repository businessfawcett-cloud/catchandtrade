export interface AffiliateOptions {
  productId?: string;
  cardName?: string;
  query?: string;
  soldOnly?: boolean;
}

export const affiliateService = {
  amazon(options: AffiliateOptions): string | null {
    const associateTag = process.env.AMAZON_ASSOCIATE_TAG;
    if (!associateTag) return null;

    const { query } = options;
    if (!query) return null;

    const encoded = encodeURIComponent(query);
    return `https://www.amazon.com/s?k=${encoded}&tag=${associateTag}`;
  },

  ebay(options: AffiliateOptions): string | null {
    const { query, soldOnly } = options;
    if (!query) return null;

    const encoded = encodeURIComponent(query);
    const campaignId = process.env.EBAY_CAMPAIGN_ID;
    let url = `https://www.ebay.com/sch/i.html?_nkw=${encoded}`;

    if (soldOnly) {
      url += '&LH_Sold=1';
    }

    if (campaignId) {
      url += `&campid=${campaignId}&toolid=10001`;
    }

    return url;
  },

  ebayUrl(cardName: string, setName?: string, cardNumber?: string): string | null {
    const campaignId = process.env.EBAY_CAMPAIGN_ID;
    if (!campaignId) return null;

    let query: string;
    if (cardNumber && setName) {
      query = `${cardName} ${setName} ${cardNumber} Pokemon Card`;
    } else {
      query = `${cardName} Pokemon Card`;
    }
    
    const encoded = encodeURIComponent(query);
    return `https://www.ebay.com/sch/i.html?_nkw=${encoded}&mkcid=1&mkrid=711-53200-19255-0&siteid=0&campid=${campaignId}&customid=&toolid=10001&mkevt=1`;
  },

  amazonUrl(cardName: string, setName?: string, cardNumber?: string): string | null {
    const associateTag = process.env.AMAZON_ASSOCIATE_TAG;
    if (!associateTag) return null;

    let searchQuery: string;
    if (cardNumber && setName) {
      searchQuery = `${cardName} ${setName} ${cardNumber} Pokemon Card`;
    } else {
      searchQuery = `${cardName} Pokemon Card`;
    }
    
    const encoded = encodeURIComponent(searchQuery);
    return `https://www.amazon.com/s?k=${encoded}&tag=${associateTag}`;
  }
};

export default affiliateService;
