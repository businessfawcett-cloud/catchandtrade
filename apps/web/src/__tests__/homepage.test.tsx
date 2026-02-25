import { render, screen, waitFor } from '@testing-library/react';
import HomePage from '../app/page';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() })
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

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows landing page when logged out', async () => {
    mockLocalStorage.getItem.mockImplementation((key: string) => {
      if (key === 'token') return null;
      return null;
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({})
    });

    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText(/Catch\./)).toBeInTheDocument();
    });
  });

  it('shows dashboard when logged in', async () => {
    mockLocalStorage.getItem.mockImplementation((key: string) => {
      if (key === 'token') return 'mock-token';
      if (key === 'user') return JSON.stringify({ id: 'user-1', username: 'testuser', displayName: 'Test User', avatarId: '25' });
      return null;
    });

    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/portfolios')) {
        return Promise.resolve({
          ok: true,
          json: async () => [{
            id: 'portfolio-1',
            name: 'My Portfolio',
            items: [
              { id: 'item-1', quantity: 1, condition: 'NEAR_MINT', card: { name: 'Charizard', imageUrl: 'https://example.com/charizard.png', setName: 'Base Set', createdAt: '2024-01-01' } },
              { id: 'item-2', quantity: 2, condition: 'MINT', card: { name: 'Pikachu', imageUrl: 'https://example.com/pikachu.png', setName: 'Jungle', createdAt: '2024-01-02' } }
            ]
          }]
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText(/@testuser/i)).toBeInTheDocument();
    });
  });

  it('shows stats when logged in', async () => {
    mockLocalStorage.getItem.mockImplementation((key: string) => {
      if (key === 'token') return 'mock-token';
      if (key === 'user') return JSON.stringify({ id: 'user-1', username: 'testuser', displayName: 'Test User', avatarId: '25' });
      return null;
    });

    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/portfolios')) {
        return Promise.resolve({
          ok: true,
          json: async () => [{
            id: 'portfolio-1',
            name: 'My Portfolio',
            items: [
              { id: 'item-1', quantity: 3, condition: 'NEAR_MINT', card: { name: 'Charizard', imageUrl: 'https://example.com/charizard.png', setName: 'Base Set', createdAt: '2024-01-01' } }
            ]
          }]
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText(/pokemon collected/i)).toBeInTheDocument();
      expect(screen.getByText(/cards owned/i)).toBeInTheDocument();
    });
  });
});
