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

  it('shows download buttons', () => {
    render(<ScanPage />);
    expect(screen.getByText(/download on the app store/i)).toBeInTheDocument();
    expect(screen.getByText(/get it on google play/i)).toBeInTheDocument();
  });

  it('shows bottom CTA', () => {
    render(<ScanPage />);
    expect(screen.getByText(/already have the app/i)).toBeInTheDocument();
  });
});
