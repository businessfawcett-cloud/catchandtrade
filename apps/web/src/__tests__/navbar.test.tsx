import { render, screen, waitFor } from '@testing-library/react';
import LoginStatus from '../app/login-status';

const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: jest.fn((key: string) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: jest.fn((i: number) => Object.keys(store)[i] || null)
  };
})();

Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

describe('LoginStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.clear();
  });

  it('shows Login and Register links when logged out', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    
    render(<LoginStatus />);
    
    expect(screen.getByRole('link', { name: /login/i })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: /register/i })).toHaveAttribute('href', '/register');
  });

  it('shows Logout when logged in', async () => {
    const mockUser = { displayName: 'John Doe' };
    mockLocalStorage.getItem.mockImplementation((key: string) => {
      if (key === 'token') return 'some-token';
      if (key === 'user') return JSON.stringify(mockUser);
      return null;
    });
    
    render(<LoginStatus />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
    });
  });
});
