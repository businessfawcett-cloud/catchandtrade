import { searchCards, scanCard } from '../lib/api';

jest.mock('../lib/api', () => ({
  searchCards: jest.fn(),
  scanCard: jest.fn(),
}));

const mockedApi = require('../lib/api');

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchCards', () => {
    it('returns search results', async () => {
      (mockedApi.searchCards as jest.Mock).mockResolvedValueOnce([
        { id: '1', name: 'Charizard', setName: 'Base Set', cardNumber: '4' },
      ]);

      const result = await searchCards('charizard');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Charizard');
    });

    it('returns empty array when no results', async () => {
      (mockedApi.searchCards as jest.Mock).mockResolvedValueOnce([]);

      const result = await searchCards('nonexistent');
      expect(result).toHaveLength(0);
    });
  });

  describe('scanCard', () => {
    it('returns scanned card result', async () => {
      (mockedApi.scanCard as jest.Mock).mockResolvedValueOnce({
        card: { id: '1', name: 'Charizard', setName: 'Base Set', cardNumber: '4', setCode: 'base1', rarity: 'Rare Holo', imageUrl: null, currentPrice: 100 },
      });

      const result = await scanCard('base64image');
      expect(result.card.name).toBe('Charizard');
    });

    it('returns null when scan fails', async () => {
      (mockedApi.scanCard as jest.Mock).mockResolvedValueOnce(null);

      const result = await scanCard('invalid');
      expect(result).toBeNull();
    });
  });
});
