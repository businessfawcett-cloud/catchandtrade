'use client';

import { useState, useEffect, useRef } from 'react';
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

const PokeballIcon = () => (
  <svg width="18" height="18" viewBox="0 0 100 100">
    <defs>
      <linearGradient id="pokeballIconGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ff6b6b" />
        <stop offset="50%" stopColor="#e63946" />
        <stop offset="100%" stopColor="#c1121f" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="45" fill="url(#pokeballIconGrad)" />
    <rect x="2" y="46" width="96" height="8" fill="#1a2332" />
    <circle cx="50" cy="50" r="14" fill="#ffffff" />
    <circle cx="50" cy="50" r="6" fill="#1a2332" />
  </svg>
);

const BookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const StarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

interface NavItem {
  href?: string;
  label: string;
  icon?: React.ReactNode;
  authRequired?: boolean;
  children?: { href: string; label: string; icon: React.ReactNode }[];
}

const navLinks: NavItem[] = [
  { href: '/marketplace', label: 'Marketplace' },
  { href: '/portfolio', label: 'Portfolio' },
  { 
    label: 'Collection', 
    icon: <BookIcon />,
    children: [
      { href: '/collection', label: 'Sets', icon: <BookIcon /> },
      { href: '/collection/pokedex', label: 'Pokédex', icon: <PokeballIcon /> }
    ]
  },
  { href: '/watchlist', label: 'Watchlist', authRequired: true },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadUser = () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      setIsLoggedIn(!!token);
      if (userData) {
        try {
          const user = JSON.parse(userData);
          setUsername(user.username || user.displayName || null);
        } catch (e) {
          // ignore parse errors
        }
      }
    };
    
    loadUser();
    
    // Listen for storage changes (when user logs in from another tab)
    window.addEventListener('storage', loadUser);
    return () => window.removeEventListener('storage', loadUser);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setCollectionOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    router.push('/');
  };

  const isCollectionActive = pathname?.startsWith('/collection');

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
              
              // Handle dropdown items (like Collection)
              if (link.children) {
                const isActive = pathname?.startsWith('/collection');
                return (
                  <div key={link.label} ref={dropdownRef} style={{ position: 'relative' }}>
                    <button
                      onClick={() => setCollectionOpen(!collectionOpen)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-poke-red/20 text-poke-red'
                          : 'text-poke-text-muted hover:text-white hover:bg-poke-bg-light'
                      }`}
                    >
                      {link.icon}
                      {link.label}
                      <svg 
                        width="12" 
                        height="12" 
                        viewBox="0 0 12 12" 
                        fill="currentColor"
                        style={{ transform: collectionOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}
                      >
                        <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="2" fill="none" />
                      </svg>
                    </button>
                    
                    {collectionOpen && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        marginTop: '0.5rem',
                        background: '#1a2332',
                        borderRadius: '8px',
                        padding: '0.5rem',
                        minWidth: '160px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        zIndex: 100
                      }}>
                        {link.children.map((child) => {
                          const childActive = pathname === child.href;
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={() => setCollectionOpen(false)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 0.75rem',
                                borderRadius: '6px',
                                textDecoration: 'none',
                                background: childActive ? 'rgba(230,57,70,0.2)' : 'transparent',
                                color: childActive ? '#e63946' : 'white',
                                fontSize: '0.875rem'
                              }}
                            >
                              {child.icon}
                              {child.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }
              
              // Regular nav items
              if (!link.href) return null;
              const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-poke-red/20 text-poke-red'
                      : 'text-poke-text-muted hover:text-white hover:bg-poke-bg-light'
                  }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <>
                {username && (
                  <Link href="/" className="text-poke-gold text-sm font-medium">
                    @{username}
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="text-poke-text-muted hover:text-white text-sm font-medium transition-colors"
                >
                  Log out
                </button>
              </>
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
