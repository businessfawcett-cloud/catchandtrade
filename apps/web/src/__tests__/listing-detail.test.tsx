import { render, screen, waitFor } from '@testing-library/react';
import ListingDetailPage from '../app/marketplace/[id]/page';

global.fetch = jest.fn();
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
} as any;

describe('CardDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockCard = {
    id: 'card-123',
    name: 'Charizard',
    setName: 'Base Set',
    setCode: 'BS1',
    cardNumber: '4',
    rarity: 'Rare Holo',
    imageUrl: 'https://example.com/charizard.jpg',
    gameType: 'POKEMON',
    language: 'EN',
    prices: [
      {
        id: 'price-1',
        date: '2024-01-01T00:00:00Z',
        tcgplayerLow: 100.00,
        tcgplayerMid: 150.00,
        tcgplayerHigh: 200.00,
        tcgplayerMarket: 150.00
      }
    ]
  };

  it('renders card details', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCard
    });

    render(<ListingDetailPage params={{ id: 'card-123' }} />);

    await waitFor(() => {
      expect(screen.getByText('Charizard')).toBeInTheDocument();
    });
    expect(screen.getByText('Base Set (BS1 #4)')).toBeInTheDocument();
    expect(screen.getByText('Rarity: Rare Holo')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(<ListingDetailPage params={{ id: 'card-123' }} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows error state on failed fetch', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Card not found' })
    });

    render(<ListingDetailPage params={{ id: 'invalid' }} />);

    await waitFor(() => {
      expect(screen.getByText('Card not found')).toBeInTheDocument();
    });
  });

  it('shows affiliate buttons', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCard
    });

    render(<ListingDetailPage params={{ id: 'card-123' }} />);

    await waitFor(() => {
      expect(screen.getByText('TCGPlayer')).toBeInTheDocument();
    });
    expect(screen.getByText('Amazon')).toBeInTheDocument();
    expect(screen.getByText('eBay')).toBeInTheDocument();
  });

  it('shows Add to Portfolio and Watchlist buttons', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCard
    });

    render(<ListingDetailPage params={{ id: 'card-123' }} />);

    await waitFor(() => {
      expect(screen.getByText('Add to Portfolio')).toBeInTheDocument();
    });
    expect(screen.getByText('Add to Watchlist')).toBeInTheDocument();
  });
});
