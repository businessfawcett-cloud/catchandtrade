import type { Metadata } from 'next';
import './globals.css';
import Navbar from './navbar';
import TokenRefreshProvider from './TokenRefreshProvider';

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
      <head>
        <meta name="impact-site-verification" content="86a5257f-8aeb-4fa0-8fbc-5e2f74346f24" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Rajdhani:wght@500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#0a0f1e] text-white min-h-screen marketplace-bg">
        <TokenRefreshProvider />
        <Navbar />
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
