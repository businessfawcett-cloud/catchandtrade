import { affiliateService } from '../affiliate';

describe('AffiliateService', () => {
  beforeEach(() => {
    delete process.env.TCGPLAYER_AFFILIATE_ID;
    delete process.env.AMAZON_ASSOCIATE_TAG;
  });

  it('generates TCGPlayer affiliate URL with affiliate ID', () => {
    process.env.TCGPLAYER_AFFILIATE_ID = 'test-affiliate-123';
    const url = affiliateService.tcgplayer({ productId: '12345', cardName: 'Charizard' });
    expect(url).toContain('tcgplayer.com');
    expect(url).toContain('test-affiliate-123');
  });

  it('generates Amazon search URL with associate tag', () => {
    process.env.AMAZON_ASSOCIATE_TAG = 'testassoc-20';
    const url = affiliateService.amazon({ query: 'Charizard Base Set PSA 10' });
    expect(url).toContain('amazon.com');
    expect(url).toContain('tag=testassoc-20');
  });

  it('generates eBay search URL for sold listings', () => {
    const url = affiliateService.ebay({ query: 'Charizard Base Set', soldOnly: true });
    expect(url).toContain('ebay.com');
    expect(url).toContain('LH_Sold=1');
  });

  it('returns null gracefully when affiliate ID not configured', () => {
    const url = affiliateService.tcgplayer({ productId: '12345', cardName: 'Charizard' });
    expect(url).toBeNull();
  });

  it('returns null for Amazon when associate tag not configured', () => {
    const url = affiliateService.amazon({ query: 'Charizard Base Set' });
    expect(url).toBeNull();
  });

  describe('ebayUrl', () => {
    beforeEach(() => {
      delete process.env.EBAY_CAMPAIGN_ID;
    });

    it('generates eBay URL with campaign ID', () => {
      process.env.EBAY_CAMPAIGN_ID = '5339143267';
      const url = affiliateService.ebayUrl('Charizard Pokemon Card');
      expect(url).toContain('ebay.com');
      expect(url).toContain('_nkw=Charizard%20Pokemon%20Card');
      expect(url).toContain('campid=5339143267');
      expect(url).toContain('mkcid=1');
      expect(url).toContain('toolid=10001');
    });

    it('returns null when campaign ID not configured', () => {
      const url = affiliateService.ebayUrl('Charizard Pokemon Card');
      expect(url).toBeNull();
    });

    it('encodes special characters in card name', () => {
      process.env.EBAY_CAMPAIGN_ID = '5339143267';
      const url = affiliateService.ebayUrl('Charizard EX Pokemon Card');
      expect(url).toContain('_nkw=Charizard%20EX%20Pokemon%20Card');
    });
  });
});
