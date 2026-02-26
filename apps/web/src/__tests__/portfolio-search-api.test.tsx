import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import PortfolioSearchPage from '../app/portfolio/search/page';

jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams({ q: 'charizard' }),
  useRouter: () => ({
    push: jest.fn()
  })
}));

global.fetch = jest.fn();

const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

describe('PortfolioSearchPage API Calls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    (global.fetch as jest.Mock).mockReset();
    mockLocalStorage.getItem.mockImplementation((key: string) => {
      if (key === 'token') return 'mock-token';
      if (key === 'user') return JSON.stringify({ id: 'user-1', displayName: 'Test User' });
      return null;
    });
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

  const mockPortfolios = [
    { id: 'portfolio-1', name: 'My Portfolio', items: [] }
  ];

  it('fetches portfolios with Authorization header', async () => {
    (global.fetch as jest.Mock).mockReset();
    (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
      if (url.includes('/value')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ totalValue: 0, cardCount: 0, uniqueCards: 0 })
        });
      }
      if (url.includes('/api/portfolios')) {
        expect(options?.headers?.Authorization).toBe('Bearer mock-token');
        return Promise.resolve({
          ok: true,
          json: async () => mockPortfolios
        });
      }
      if (url.includes('/api/cards/search')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ results: mockCards })
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(<PortfolioSearchPage />);

    await waitFor(() => {
      expect(screen.getByText('Charizard')).toBeInTheDocument();
    });
  });

  it('shows modal when Add to Portfolio button is clicked', async () => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockImplementation((key: string) => {
      if (key === 'token') return 'mock-token';
      if (key === 'user') return JSON.stringify({ id: 'user-1', displayName: 'Test User' });
      return null;
    });
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/value')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ totalValue: 0, cardCount: 0, uniqueCards: 0 })
        });
      }
      if (url.includes('/api/portfolios')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockPortfolios
        });
      }
      if (url.includes('/api/cards/search')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ results: mockCards })
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(<PortfolioSearchPage />);

    await waitFor(() => {
      expect(screen.getByText('Charizard')).toBeInTheDocument();
    });

    const addButton = screen.getByText('Add to Portfolio');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText(/add charizard to portfolio/i)).toBeInTheDocument();
    });
  });
});
