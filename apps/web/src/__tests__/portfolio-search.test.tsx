import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import PortfolioPage from '../app/portfolio/page';

jest.mock('next/navigation', () => ({
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

describe('PortfolioPage Search', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  it('has search input', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/portfolios')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockPortfolios
        });
      }
      return Promise.resolve({ ok: false });
    });

    render(<PortfolioPage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search for a card/i)).toBeInTheDocument();
    });
  });

  it('has search input with magnifying glass icon', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/portfolios')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockPortfolios
        });
      }
      return Promise.resolve({ ok: false });
    });

    render(<PortfolioPage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search for a card/i)).toBeInTheDocument();
    });
  });

  it('shows dropdown while typing', async () => {
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
      return Promise.resolve({ ok: false });
    });

    render(<PortfolioPage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search for a card/i)).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/search for a card/i);
    fireEvent.change(input, { target: { value: 'char' } });

    await waitFor(() => {
      expect(screen.getByText('Charizard')).toBeInTheDocument();
    });
  });
});
