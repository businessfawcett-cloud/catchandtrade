import type { Metadata } from 'next';
import './globals.css';
import Navbar from './navbar';

export const metadata: Metadata = {
  title: 'Catch and Trade - Trading Card Portfolio & Marketplace',
  description: 'Scan, track, and trade your Pokemon cards and more',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-poke-bg text-white min-h-screen pokeball-pattern">
        <Navbar />
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
