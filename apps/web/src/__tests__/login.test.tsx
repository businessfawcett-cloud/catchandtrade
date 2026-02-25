import { render, screen } from '@testing-library/react';
import LoginPage from '../app/(auth)/login/page';

describe('LoginPage', () => {
  it('shows link to register page', () => {
    render(<LoginPage />);
    
    expect(screen.getByRole('link', { name: /create one/i })).toHaveAttribute('href', '/register');
  });

  it('has link to register for new users', () => {
    render(<LoginPage />);
    
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
  });
});
