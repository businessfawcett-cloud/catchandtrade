'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const PokeballLogo = () => (
  <svg width="36" height="36" viewBox="0 0 100 100" className="animate-pulse-glow">
    <defs>
      <linearGradient id="pokeballGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ff6b6b" />
        <stop offset="50%" stopColor="#e63946" />
        <stop offset="100%" stopColor="#c1121f" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="48" fill="url(#pokeballGrad)" />
    <rect x="2" y="46" width="96" height="8" fill="#1a2332" />
    <circle cx="50" cy="50" r="14" fill="#ffffff" />
    <circle cx="50" cy="50" r="6" fill="#1a2332" />
  </svg>
);

const navLinks = [
  { href: '/marketplace', label: 'Marketplace' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/collection', label: 'Collection' },
  { href: '/watchlist', label: 'Watchlist', authRequired: true },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    router.push('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-poke-bg/95 backdrop-blur-md border-b border-poke-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group focus:outline-none ring-0">
            <img src="/Logo.png" alt="Catch & Trade" className="h-24 w-auto" />
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-1">
            {navLinks.map((link) => {
              if (link.authRequired && !isLoggedIn) return null;
              const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-poke-red/20 text-poke-red'
                      : 'text-poke-text-muted hover:text-white hover:bg-poke-bg-light'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="text-poke-text-muted hover:text-white text-sm font-medium transition-colors"
              >
                Log out
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-poke-text-muted hover:text-white text-sm font-medium transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="bg-poke-red hover:bg-poke-red-dark text-white text-sm font-semibold py-2 px-4 rounded-lg transition-all duration-200 hover:scale-105"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
