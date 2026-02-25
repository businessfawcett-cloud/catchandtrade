'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PokeballLoader from '@/components/PokeballLoader';
import CardGrid from '@/components/CardGrid';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

const AVATARS: Record<string, string> = {
  '1': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png',
  '4': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png',
  '7': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/7.png',
  '25': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png',
  '39': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/39.png',
  '52': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/52.png',
  '54': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/54.png',
  '94': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/94.png',
  '131': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/131.png',
  '133': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/133.png',
  '143': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/143.png',
  '150': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/150.png',
};

const TOTAL_POKEMON = 1025;

interface Card {
  id: string;
  name: string;
  setName: string;
  gameType?: string;
  imageUrl: string | null;
  createdAt?: string;
}

interface PortfolioItem {
  id: string;
  quantity: number;
  condition: string;
  card: Card;
}

interface Portfolio {
  id: string;
  name: string;
  items: PortfolioItem[];
}

interface User {
  id: string;
  username: string | null;
  displayName: string;
  avatarId: string | null;
}

function Dashboard({ user }: { user: User }) {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch(`${API_URL}/api/portfolios`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setPortfolios(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const allItems = (portfolios || []).flatMap(p => p.items || []);
  const recentItems = allItems
    .sort((a, b) => new Date(b.card?.createdAt || 0).getTime() - new Date(a.card?.createdAt || 0).getTime())
    .slice(0, 6);

  const pokemonCards = allItems.filter(i => i.card?.gameType === 'POKEMON');
  const uniquePokemon = new Set(pokemonCards.map(i => i.card.name));
  const totalCards = allItems.reduce((sum, item) => sum + item.quantity, 0);
  const uniqueSets = new Set(allItems.map(i => i.card.setName));

  const handleShare = () => {
    if (user.username) {
      navigator.clipboard.writeText(`${window.location.origin}/u/${user.username}`);
      alert('Link copied to clipboard!');
    }
  };

  const avatarUrl = user.avatarId ? AVATARS[user.avatarId] : null;
  const displayName = user.username || user.displayName || 'User';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <PokeballLoader size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt={displayName} 
              className="w-16 h-16 rounded-full object-contain bg-poke-bg-light border-2 border-poke-red" 
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-poke-red to-poke-gold flex items-center justify-center text-2xl font-bold text-white">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-white">{user.displayName}</h1>
            <span className="text-poke-text-muted">@{displayName}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <Link 
            href="/onboarding" 
            className="px-4 py-2 border border-poke-border text-poke-text-muted hover:text-white hover:border-poke-red rounded-lg transition-all"
          >
            Edit Profile
          </Link>
          <button 
            onClick={handleShare} 
            className="btn-primary"
          >
            Share
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card-dark p-6 text-center">
          <div className="text-3xl font-bold text-poke-gold mb-1">{uniquePokemon.size}</div>
          <div className="text-poke-text-muted text-sm">Pokemon Collected</div>
          <div className="text-xs text-poke-text-muted/60">of {TOTAL_POKEMON}</div>
        </div>
        <div className="card-dark p-6 text-center">
          <div className="text-3xl font-bold text-white mb-1">{totalCards}</div>
          <div className="text-poke-text-muted text-sm">Cards Owned</div>
        </div>
        <div className="card-dark p-6 text-center">
          <div className="text-3xl font-bold text-poke-red mb-1">$0</div>
          <div className="text-poke-text-muted text-sm">Market Value</div>
        </div>
        <div className="card-dark p-6 text-center">
          <div className="text-3xl font-bold text-poke-gold mb-1">{uniqueSets.size}</div>
          <div className="text-poke-text-muted text-sm">Sets Completing</div>
        </div>
      </div>

      {/* Recent Collection */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Recent Collection</h2>
          <Link href="/portfolio" className="text-poke-red hover:text-poke-gold transition-colors text-sm font-medium">
            View Full Portfolio →
          </Link>
        </div>
        {recentItems.length === 0 ? (
          <div className="card-dark p-8 text-center">
            <p className="text-poke-text-muted mb-4">No cards in your portfolio yet. Start adding cards!</p>
            <Link href="/marketplace" className="btn-primary inline-block">
              Browse Marketplace
            </Link>
          </div>
        ) : (
          <CardGrid 
            cards={recentItems.map(item => ({
              ...item.card,
              rarity: null,
              setCode: '',
              cardNumber: '',
              currentPrice: null,
            }))} 
            showPrice={false}
          />
        )}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/scan" className="btn-primary flex items-center gap-2">
            <span>⚡</span> Scan a Card
          </Link>
          <Link href="/marketplace" className="btn-secondary flex items-center gap-2">
            <span>🔍</span> Browse Marketplace
          </Link>
          <Link href="/collection" className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-semibold rounded-lg transition-all flex items-center gap-2">
            <span>📊</span> View Collection Progress
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <PokeballLoader size="lg" />
      </div>
    );
  }

  if (user) {
    return <Dashboard user={user} />;
  }

  return (
    <div className="min-h-screen gradient-overlay">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-24 h-24 mb-6">
            <svg width="96" height="96" viewBox="0 0 100 100" className="animate-pulse-glow">
              <defs>
                <linearGradient id="heroPokeball" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ff6b6b" />
                  <stop offset="50%" stopColor="#e63946" />
                  <stop offset="100%" stopColor="#c1121f" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="48" fill="url(#heroPokeball)" stroke="#0f1724" strokeWidth="4" />
              <rect x="2" y="46" width="96" height="8" fill="#0f1724" />
              <circle cx="50" cy="50" r="14" fill="#ffffff" stroke="#0f1724" strokeWidth="4" />
              <circle cx="50" cy="50" r="6" fill="#0f1724" />
            </svg>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4">
            <span className="bg-gradient-to-r from-white via-poke-gold to-white bg-clip-text text-transparent">
              Catch & Trade
            </span>
          </h1>
          
          <p className="text-xl text-poke-text-muted max-w-2xl mx-auto mb-8">
            Your complete trading card collection platform. Scan, track, and trade your Pokemon cards with ease.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/marketplace" className="btn-primary text-lg px-8 py-4">
              Browse Marketplace
            </Link>
            <Link href="/register" className="btn-secondary text-lg px-8 py-4">
              Get Started Free
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="card-dark p-6 text-center">
            <div className="text-4xl mb-4">📷</div>
            <h3 className="text-lg font-bold text-white mb-2">Scan Cards</h3>
            <p className="text-poke-text-muted text-sm">
              Use your camera to quickly scan and identify Pokemon cards
            </p>
          </div>
          <div className="card-dark p-6 text-center">
            <div className="text-4xl mb-4">📈</div>
            <h3 className="text-lg font-bold text-white mb-2">Track Value</h3>
            <p className="text-poke-text-muted text-sm">
              Monitor your portfolio value with real-time price tracking
            </p>
          </div>
          <div className="card-dark p-6 text-center">
            <div className="text-4xl mb-4">💎</div>
            <h3 className="text-lg font-bold text-white mb-2">Buy & Sell</h3>
            <p className="text-poke-text-muted text-sm">
              Find rare cards and sell duplicates on our marketplace
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="card-dark p-8 text-center">
          <p className="text-poke-text-muted mb-4">
            Looking for specific cards? 
          </p>
          <a 
            href="https://www.tcgplayer.com?affiliate=true" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-poke-red hover:text-poke-gold font-semibold transition-colors"
          >
            Shop on TCGPlayer →
          </a>
          <div className="text-xs text-poke-text-muted/60 mt-2">
            We may earn a small commission
          </div>
        </div>
      </div>
    </div>
  );
}
