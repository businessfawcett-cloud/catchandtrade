import { render, screen } from '@testing-library/react';
import ScanPage from '../app/scan/page';

describe('ScanPage', () => {
  it('renders scan page with hero heading', () => {
    render(<ScanPage />);
    expect(screen.getByText(/scan cards with your phone/i)).toBeInTheDocument();
  });

  it('shows feature list', () => {
    render(<ScanPage />);
    expect(screen.getByText(/instant recognition/i)).toBeInTheDocument();
    expect(screen.getByText(/real-time prices/i)).toBeInTheDocument();
    expect(screen.getByText(/one-tap portfolio/i)).toBeInTheDocument();
  });

  it('shows coming soon message', () => {
    render(<ScanPage />);
    expect(screen.getByText(/mobile app coming soon/i)).toBeInTheDocument();
  });

  it('shows register CTA', () => {
    render(<ScanPage />);
    expect(screen.getByText(/get started free/i)).toBeInTheDocument();
  });
});
