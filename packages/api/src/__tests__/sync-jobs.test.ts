import { prisma } from '@catchandtrade/db';

global.fetch = jest.fn();

describe('Sync Jobs', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    try {
      await prisma.syncLog.deleteMany();
    } catch (e) {
      // SyncLog table may not exist
    }
    await prisma.priceAlert.deleteMany();
    await prisma.cardPrice.deleteMany();
    await prisma.card.deleteMany();
    await prisma.pokemonSet.deleteMany();
  });

  describe('Sync Sets Job', () => {
    it('creates new sets from API response', async () => {
      const mockSets = {
        data: [
          { id: 'base1', name: 'Base Set', images: { logo: 'http://example.com/logo.png' }, printedTotal: 102, releaseDate: '1999-01-01' },
          { id: 'jungle', name: 'Jungle', images: { logo: 'http://example.com/jungle.png' }, printedTotal: 64, releaseDate: '1999-06-01' },
        ]
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockSets
      });

      const { syncSets } = await import('../cron/nightlySync');
      const result = await syncSets();

      expect(result.newSets).toBe(2);
      expect(result.updatedSets).toBe(0);

      const sets = await prisma.pokemonSet.findMany();
      expect(sets).toHaveLength(2);
    });

    it('updates existing sets when totalCards changes', async () => {
      await prisma.pokemonSet.create({
        data: {
          name: 'Base Set',
          code: 'base1',
          totalCards: 100,
          releaseYear: 1999,
        }
      });

      const mockSets = {
        data: [
          { id: 'base1', name: 'Base Set', images: { logo: 'http://example.com/logo.png' }, printedTotal: 102, releaseDate: '1999-01-01' },
        ]
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockSets
      });

      const { syncSets } = await import('../cron/nightlySync');
      const result = await syncSets();

      expect(result.newSets).toBe(0);
      expect(result.updatedSets).toBe(1);

      const set = await prisma.pokemonSet.findUnique({ where: { code: 'base1' } });
      expect(set?.totalCards).toBe(102);
    });

    it('skips gracefully when API is unavailable', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(null);

      const { syncSets } = await import('../cron/nightlySync');
      const result = await syncSets();

      expect(result.newSets).toBe(0);
      expect(result.updatedSets).toBe(0);
    });
  });

  describe('Sync Cards Job', () => {
    it('creates new cards for existing sets', async () => {
      const set = await prisma.pokemonSet.create({
        data: { name: 'Base Set', code: 'base1', totalCards: 102, releaseYear: 1999 }
      });

      const mockCards = {
        data: [
          { id: 'base1-4', name: 'Charizard', number: '4', rarity: 'Rare Holo', images: { small: 'http://example.com/charizard.png' }, set: { id: 'base1', name: 'Base Set' } },
          { id: 'base1-5', name: 'Blastoise', number: '5', rarity: 'Rare Holo', images: { small: 'http://example.com/blastoise.png' }, set: { id: 'base1', name: 'Base Set' } },
        ]
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockCards
      });

      const { syncCards } = await import('../cron/nightlySync');
      const result = await syncCards();

      expect(result.newCards).toBe(2);

      const cards = await prisma.card.findMany({ where: { setId: set.id } });
      expect(cards).toHaveLength(2);
    });

    it('updates existing cards when data changes', async () => {
      const set = await prisma.pokemonSet.create({
        data: { name: 'Base Set', code: 'base1', totalCards: 102, releaseYear: 1999 }
      });

      const card = await prisma.card.create({
        data: {
          name: 'Charizard',
          setName: 'Base Set',
          setCode: 'base1',
          cardNumber: '4',
          rarity: 'Common',
          tcgplayerId: 'base1-4',
          setId: set.id,
        }
      });

      const mockCards = {
        data: [
          { id: 'base1-4', name: 'Charizard', number: '4', rarity: 'Rare Holo', images: { small: 'http://example.com/new-charizard.png' }, set: { id: 'base1', name: 'Base Set' } },
        ]
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockCards
      });

      const { syncCards } = await import('../cron/nightlySync');
      const result = await syncCards();

      expect(result.newCards).toBe(0);
      expect(result.updatedCards).toBe(1);

      const updated = await prisma.card.findUnique({ where: { id: card.id } });
      expect(updated?.rarity).toBe('Rare Holo');
    });
  });

  describe('Sync Prices Job', () => {
    it('creates price snapshots for cards', async () => {
      const set = await prisma.pokemonSet.create({
        data: { name: 'Base Set', code: 'base1', totalCards: 102, releaseYear: 1999 }
      });

      const card = await prisma.card.create({
        data: {
          name: 'Charizard',
          setName: 'Base Set',
          setCode: 'base1',
          cardNumber: '4',
          rarity: 'Rare Holo',
          tcgplayerId: 'base1-4',
          setId: set.id,
        }
      });

      const mockCardDetail = {
        data: [
          { id: 'base1-4', tcgplayer: { prices: { holofoil: { market: 500.00 } } } }
        ]
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockCardDetail
      });

      const { syncPrices } = await import('../cron/nightlySync');
      const result = await syncPrices();

      expect(result.updatedPrices).toBe(1);

      const prices = await prisma.cardPrice.findMany({ where: { cardId: card.id } });
      expect(prices).toHaveLength(1);
      expect(prices[0].tcgplayerMarket).toBe(500.00);
    });

    it('triggers price alerts when threshold met', async () => {
      const user = await prisma.user.create({
        data: { email: 'alert@test.com', displayName: 'Alert User' }
      });

      const set = await prisma.pokemonSet.create({
        data: { name: 'Base Set', code: 'base1', totalCards: 102, releaseYear: 1999 }
      });

      const card = await prisma.card.create({
        data: {
          name: 'Charizard',
          setName: 'Base Set',
          setCode: 'base1',
          cardNumber: '4',
          rarity: 'Rare Holo',
          tcgplayerId: 'base1-4',
          setId: set.id,
        }
      });

      await prisma.cardPrice.create({
        data: {
          cardId: card.id,
          tcgplayerMarket: 100.00,
        }
      });

      await prisma.priceAlert.create({
        data: {
          userId: user.id,
          cardId: card.id,
          alertType: 'PRICE_BELOW',
          targetPrice: 150.00,
          isActive: true,
        }
      });

      const mockCardDetail = {
        data: [
          { id: 'base1-4', tcgplayer: { prices: { holofoil: { market: 100.00 } } } }
        ]
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockCardDetail
      });

      const { syncPrices } = await import('../cron/nightlySync');
      const result = await syncPrices();

      expect(result.triggeredAlerts).toBe(1);

      const alert = await prisma.priceAlert.findFirst({ where: { userId: user.id } });
      expect(alert?.isActive).toBe(false);
      expect(alert?.triggeredAt).not.toBeNull();
    });
  });
});
