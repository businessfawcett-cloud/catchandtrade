import { render, screen, waitFor } from '@testing-library/react';
import MarketplacePage from '../app/marketplace/page';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn()
  })
}));

global.fetch = jest.fn();

describe('MarketplacePage', () => {
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

  it('displays search input', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ results: mockCards })
    });

    render(<MarketplacePage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });
  });

  it('shows loading state', () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(<MarketplacePage />);
    // Check for loading container with Pokeball loader
    expect(document.querySelector('.animate-pokeball-spin')).toBeInTheDocument();
  });

  it('shows error state on failed fetch', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Failed to fetch' })
    });

    render(<MarketplacePage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load cards')).toBeInTheDocument();
    });
  });

  // REGRESSION TEST: Verify cards load on initial page mount without search
  it('fetches cards on initial load without search input', async () => {
    const cardsOnDefaultLoad = [
      { id: 'card-1', name: 'Charizard', setName: 'Base Set', setCode: 'BS', cardNumber: '4', rarity: 'Rare Holo', imageUrl: 'https://example.com/charizard.jpg', currentPrice: 5000 },
      { id: 'card-2', name: 'Blastoise', setName: 'Base Set', setCode: 'BS', cardNumber: '2', rarity: 'Rare Holo', imageUrl: 'https://example.com/blastoise.jpg', currentPrice: 4000 }
    ];

    // Return cards for the default load endpoint
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ cards: cardsOnDefaultLoad })
    });

    render(<MarketplacePage />);

    // Wait for cards to appear (which means fetch was successful)
    await waitFor(() => {
      expect(screen.getByText('Charizard')).toBeInTheDocument();
    });
  });

  // REGRESSION TEST: Verify sort and filter dropdowns render as <select> elements
  it('renders sort and filter dropdowns as select elements', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ results: mockCards })
    });

    render(<MarketplacePage />);

    await waitFor(() => {
      // Check that set filter dropdown exists as a select element
      const setFilter = screen.getByRole('combobox', { name: /set/i });
      expect(setFilter).toBeInTheDocument();
      expect(setFilter.tagName).toBe('SELECT');

      // Check that sort dropdown exists as a select element
      const sortDropdown = screen.getByRole('combobox', { name: /sort/i });
      expect(sortDropdown).toBeInTheDocument();
      expect(sortDropdown.tagName).toBe('SELECT');
    });
  });
});
