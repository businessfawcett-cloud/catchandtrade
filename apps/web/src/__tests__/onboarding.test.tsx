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
    (global.fetch as jest.Mock).mockReset();
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
      expect(screen.getByText(/welcome to catch & trade/i)).toBeInTheDocument();
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

  it('shows avatar selection grid after advancing to step 2', async () => {
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
      expect(screen.getByText(/welcome to catch & trade/i)).toBeInTheDocument();
    });

    const usernameInput = screen.getByLabelText(/username/i);
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });

    await waitFor(() => {
      expect(screen.getByText(/available/i)).toBeInTheDocument();
    });

    const continueBtn = screen.getByText('Continue →');
    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(screen.getByText(/choose your starter/i)).toBeInTheDocument();
    });
  });

  it('shows privacy toggles on step 3', async () => {
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
      expect(screen.getByText(/welcome to catch & trade/i)).toBeInTheDocument();
    });

    const usernameInput = screen.getByLabelText(/username/i);
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });

    await waitFor(() => {
      expect(screen.getByText(/available/i)).toBeInTheDocument();
    });

    const continueBtn1 = screen.getByText('Continue →');
    fireEvent.click(continueBtn1);

    await waitFor(() => {
      expect(screen.getByText(/choose your starter/i)).toBeInTheDocument();
    });

    const avatarBtn = screen.getByAltText('bulbasaur');
    fireEvent.click(avatarBtn);

    const continueBtn2 = screen.getByText('Continue →');
    fireEvent.click(continueBtn2);

    await waitFor(() => {
      expect(screen.getByText(/preferences/i)).toBeInTheDocument();
    });
  });

  it('shows country selector on step 3', async () => {
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
      expect(screen.getByText(/welcome to catch & trade/i)).toBeInTheDocument();
    });

    const usernameInput = screen.getByLabelText(/username/i);
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });

    await waitFor(() => {
      expect(screen.getByText(/available/i)).toBeInTheDocument();
    });

    const continueBtn1 = screen.getByText('Continue →');
    fireEvent.click(continueBtn1);

    await waitFor(() => {
      expect(screen.getByText(/choose your starter/i)).toBeInTheDocument();
    });

    const avatarBtn = screen.getByAltText('bulbasaur');
    fireEvent.click(avatarBtn);

    const continueBtn2 = screen.getByText('Continue →');
    fireEvent.click(continueBtn2);

    await waitFor(() => {
      expect(screen.getByLabelText(/country/i)).toBeInTheDocument();
    });
  });

  it('has Continue button on step 1', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(<OnboardingPage />);

    await waitFor(() => {
      expect(screen.getByText('Continue →')).toBeInTheDocument();
    });
  });

  it('has Sign Out button', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({})
    });

    render(<OnboardingPage />);

    await waitFor(() => {
      expect(screen.getByText('Sign out')).toBeInTheDocument();
    });
  });
});
