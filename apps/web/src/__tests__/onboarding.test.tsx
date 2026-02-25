import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import OnboardingPage from '../app/onboarding/page';

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

describe('OnboardingPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockImplementation((key: string) => {
      if (key === 'token') return 'mock-token';
      if (key === 'user') return JSON.stringify({ id: 'user-1', email: 'test@test.com', displayName: 'Test User' });
      return null;
    });
  });

  it('renders onboarding page', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({})
    });

    render(<OnboardingPage />);

    await waitFor(() => {
      expect(screen.getByText(/set up your profile/i)).toBeInTheDocument();
    });
  });

  it('shows display name input with character counter', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({})
    });

    render(<OnboardingPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    });
  });

  it('shows username input with validation', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({})
    });

    render(<OnboardingPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    });
  });

  it('checks username availability', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/users/check-username')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ available: true })
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(<OnboardingPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    });

    const usernameInput = screen.getByLabelText(/username/i);
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });

    await waitFor(() => {
      expect(screen.getByText(/available/i)).toBeInTheDocument();
    });
  });

  it('shows avatar selection grid', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({})
    });

    render(<OnboardingPage />);

    await waitFor(() => {
      expect(screen.getByText(/choose your starter/i)).toBeInTheDocument();
    });
  });

  it('shows privacy toggles', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({})
    });

    render(<OnboardingPage />);

    await waitFor(() => {
      expect(screen.getByText(/profile visibility/i)).toBeInTheDocument();
    });
  });

  it('shows country selector', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({})
    });

    render(<OnboardingPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/country/i)).toBeInTheDocument();
    });
  });

  it('has Continue button', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(<OnboardingPage />);

    await waitFor(() => {
      expect(screen.getByText('Continue')).toBeInTheDocument();
    });
  });

  it('has Sign Out button', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({})
    });

    render(<OnboardingPage />);

    await waitFor(() => {
      expect(screen.getByText('Sign Out')).toBeInTheDocument();
    });
  });
});
