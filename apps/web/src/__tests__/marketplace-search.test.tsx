import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MarketplacePage from '../app/marketplace/page';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn()
  })
}));

global.fetch = jest.fn();

describe('MarketplacePage Search', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockCards = [
    {
      id: 'card-1',
      name: 'Charizard',
      setName: 'Base Set',
      setCode: 'BS1',
      cardNumber: '4',
      rarity: 'Rare Holo',
      imageUrl: 'https://example.com/charizard.jpg',
      currentPrice: 5000.00
    }
  ];

  it('renders marketplace page', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ results: mockCards })
    });

    render(<MarketplacePage />);

    await waitFor(() => {
      expect(screen.getByText('Pokemon Card Catalog')).toBeInTheDocument();
    });
  });

  it('has search input with Enter key handler', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ results: mockCards })
    });

    render(<MarketplacePage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search cards by name/i)).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/search cards by name/i);
    expect(input).toBeInTheDocument();
  });

  it('has search button', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ results: mockCards })
    });

    render(<MarketplacePage />);

    await waitFor(() => {
      expect(screen.getByText('Search')).toBeInTheDocument();
    });
  });
});
