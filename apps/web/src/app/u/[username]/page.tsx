'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Library, CreditCard, DollarSign, BookOpen, Twitter, Instagram, Music, ArrowLeft } from 'lucide-react';
import PokeballLoader from '@/components/PokeballLoader';

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

interface Card {
  id: string;
  name: string;
  setName: string;
  setCode: string;
  cardNumber: string;
  rarity: string | null;
  imageUrl: string | null;
  currentPrice: number | null;
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
  isPublic: boolean;
  items: PortfolioItem[];
}

interface User {
  id: string;
  username: string | null;
  displayName: string;
  avatarId: string | null;
  isPublic: boolean;
  hideCollectionValue: boolean;
  twitterHandle: string | null;
  instagramHandle: string | null;
  tiktokHandle: string | null;
}

const FloatingPokeball = ({ delay, left, top }: { delay: number; left: string; top: string }) => (
  <div 
    className="absolute opacity-10 animate-float"
    style={{ left, top, animationDelay: `${delay}s` }}
  >
    <svg width="60" height="60" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="48" fill="#e63946" stroke="#0a0f1e" strokeWidth="4" />
      <rect x="2" y="46" width="96" height="8" fill="#0a0f1e" />
      <circle cx="50" cy="50" r="14" fill="#ffffff" stroke="#0a0f1e" strokeWidth="4" />
      <circle cx="50" cy="50" r="6" fill="#0a0f1e" />
    </svg>
  </div>
);

export default function PublicProfilePage({ params }: { params: { username: string } }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`${API_URL}/api/users/${params.username.toLowerCase()}`);
        
        if (!response.ok) {
          const data = await response.json();
          setError(data.error || 'Profile not found');
          setLoading(false);
          return;
        }
        
        const data = await response.json();
        
        if (!data.isPublic) {
          setError('This profile is private');
          setLoading(false);
          return;
        }
        
        setUser(data);
        
        const portfoliosRes = await fetch(`${API_URL}/api/portfolios/user/${data.id}`);
        if (portfoliosRes.ok) {
          const portfoliosData = await portfoliosRes.json();
          const publicPortfolios = portfoliosData.filter((p: Portfolio) => p.isPublic);
          setPortfolios(publicPortfolios);
        }
      } catch (err) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [params.username]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1529 50%, #0f1a2e 100%)' }}>
        <PokeballLoader size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1529 50%, #0f1a2e 100%)' }}>
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 opacity-50">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <circle cx="50" cy="50" r="45" fill="#e63946" stroke="#0f1724" strokeWidth="4" />
              <rect x="4" y="46" width="92" height="8" fill="#0f1724" />
              <circle cx="50" cy="50" r="14" fill="#ffffff" stroke="#0f1724" strokeWidth="4" />
              <circle cx="50" cy="50" r="6" fill="#0f1724" />
            </svg>
          </div>
          <h1 className="font-rajdhani text-3xl font-bold text-white mb-2">{error}</h1>
          <p className="text-poke-text-muted mb-6">This profile may be private or doesn't exist</p>
          <Link href="/" className="text-poke-gold hover:text-white transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const avatarUrl = user?.avatarId ? AVATARS[user.avatarId] : null;
  const displayName = user?.displayName || user?.username || 'Trainer';

  const allItems = portfolios.flatMap(p => p.items);
  const uniquePokemon = new Set(allItems.map(i => i.card.name));
  const uniqueSets = new Set(allItems.map(i => i.card.setName));
  const totalCards = allItems.reduce((sum, i) => sum + i.quantity, 0);
  const totalValue = allItems.reduce((sum, i) => sum + ((i.card.currentPrice || 0) * i.quantity), 0);

  return (
    <div className="min-h-screen relative" style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1529 50%, #0f1a2e 100%)' }}>
      <div className="fixed inset-0 pointer-events-none">
        <FloatingPokeball delay={0} left="5%" top="10%" />
        <FloatingPokeball delay={2} left="85%" top="60%" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/" className="inline-flex items-center text-poke-text-muted hover:text-white transition-colors mb-8">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Home
        </Link>

        <div 
          className="rounded-2xl p-6 md:p-8 mb-8"
          style={{ 
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt={displayName} 
                    className="w-20 h-20 rounded-full object-contain bg-poke-bg-light border-4 border-poke-red"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-poke-red to-poke-gold flex items-center justify-center text-3xl font-bold text-white border-4 border-poke-red">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <h1 className="font-rajdhani text-3xl font-bold text-white">{displayName}</h1>
                <p className="text-poke-gold">@{user?.username}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1 lg:ml-12">
              <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(230,57,70,0.1)', border: '1px solid rgba(230,57,70,0.2)' }}>
                <div className="flex justify-center mb-2"><Library className="w-8 h-8" style={{ color: '#e63946' }} /></div>
                <div className="font-rajdhani text-2xl font-bold text-poke-red">{uniquePokemon.size}</div>
                <div className="text-xs text-poke-text-muted">Unique Pokemon</div>
              </div>
              <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(104,144,240,0.1)', border: '1px solid rgba(104,144,240,0.2)' }}>
                <div className="flex justify-center mb-2"><CreditCard className="w-8 h-8" style={{ color: '#6890f0' }} /></div>
                <div className="font-rajdhani text-2xl font-bold text-blue-400">{totalCards}</div>
                <div className="text-xs text-poke-text-muted">Cards</div>
              </div>
              <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.2)' }}>
                <div className="flex justify-center mb-2"><DollarSign className="w-8 h-8" style={{ color: '#ffd700' }} /></div>
                <div className="font-rajdhani text-2xl font-bold text-poke-gold">
                  {user?.hideCollectionValue ? '***' : `$${totalValue.toFixed(2)}`}
                </div>
                <div className="text-xs text-poke-text-muted">Value</div>
              </div>
              <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)' }}>
                <div className="flex justify-center mb-2"><BookOpen className="w-8 h-8" style={{ color: '#a855f7' }} /></div>
                <div className="font-rajdhani text-2xl font-bold text-purple-400">{uniqueSets.size}</div>
                <div className="text-xs text-poke-text-muted">Sets</div>
              </div>
            </div>

            {(user?.twitterHandle || user?.instagramHandle || user?.tiktokHandle) && (
              <div className="flex gap-3 lg:ml-6">
                {user?.twitterHandle && (
                  <a 
                    href={`https://twitter.com/${user.twitterHandle.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-[#1a2332] hover:bg-[#243044] transition-colors"
                  >
                    <Twitter className="w-5 h-5 text-white" />
                  </a>
                )}
                {user?.instagramHandle && (
                  <a 
                    href={`https://instagram.com/${user.instagramHandle.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-[#1a2332] hover:bg-[#243044] transition-colors"
                  >
                    <Instagram className="w-5 h-5 text-white" />
                  </a>
                )}
                {user?.tiktokHandle && (
                  <a 
                    href={`https://tiktok.com/@${user.tiktokHandle.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-[#1a2332] hover:bg-[#243044] transition-colors"
                  >
                    <Music className="w-5 h-5 text-white" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {portfolios.length > 0 ? (
          portfolios.map(portfolio => (
            <div key={portfolio.id} className="mb-8">
              <h2 className="font-rajdhani text-2xl font-bold text-white mb-6">{portfolio.name}</h2>
              <div className="flex gap-4 overflow-x-auto pb-4 snap-x scrollbar-hide">
                {portfolio.items.slice(0, 20).map((item) => (
                  <div 
                    key={item.id}
                    className="flex-shrink-0 w-48 bg-[#111827] rounded-xl overflow-hidden border border-gray-700 hover:border-poke-red transition-all hover:scale-105"
                  >
                    <div className="aspect-[3/4] flex items-center justify-center p-2">
                      {item.card.imageUrl ? (
                        <img src={item.card.imageUrl} alt={item.card.name} className="max-w-full max-h-full object-contain" />
                      ) : (
                        <div className="text-4xl">🎴</div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-white text-sm truncate">{item.card.name}</h3>
                      <p className="text-xs text-poke-text-muted truncate">{item.card.setName}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-poke-gold">x{item.quantity}</span>
                        {item.card.currentPrice && (
                          <span className="text-xs text-green-400">${item.card.currentPrice.toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div 
            className="p-12 rounded-xl text-center"
            style={{ 
              background: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <h3 className="font-rajdhani text-xl font-bold text-white mb-2">No public collections</h3>
            <p className="text-poke-text-muted">This trainer hasn&apos;t made any collections public yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
