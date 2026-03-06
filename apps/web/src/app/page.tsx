'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PokeballLoader from '@/components/PokeballLoader';
import CardGrid from '@/components/CardGrid';
import { Library, CreditCard, DollarSign, BookOpen } from 'lucide-react';

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
  setCode: string;
  cardNumber: string;
  rarity: string | null;
  imageUrl: string | null;
  currentPrice: number | null;
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

function AnimatedCounter({ end, suffix = '' }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = end / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [end]);
  
  return <span>{count.toLocaleString()}{suffix}</span>;
}

const FloatingPokeball = ({ delay, left, top }: { delay: number; left: string; top: string }) => (
  <div 
    className="absolute opacity-20 animate-float"
    style={{ 
      left, 
      top, 
      animationDelay: `${delay}s`,
      animationDuration: '10s'
    }}
  >
    <svg width="40" height="40" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="48" fill="#e63946" stroke="#0f1724" strokeWidth="4" />
      <rect x="2" y="46" width="96" height="8" fill="#0f1724" />
      <circle cx="50" cy="50" r="14" fill="#ffffff" stroke="#0f1724" strokeWidth="4" />
      <circle cx="50" cy="50" r="6" fill="#0f1724" />
    </svg>
  </div>
);

const BackgroundPokemon = ({ name, left, top, delay }: { name: string; left: string; top: string; delay: number }) => {
  const images: Record<string, string> = {
    mewtwo: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/150.png',
    gengar: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/94.png',
    pikachu: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png',
  };
  
  return (
    <div 
      className="absolute opacity-10 animate-float-slow"
      style={{ left, top, animationDelay: `${delay}s` }}
    >
      <img src={images[name]} alt={name} className="w-32 h-32 object-contain" />
    </div>
  );
};

function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <FloatingPokeball delay={0} left="5%" top="10%" />
        <FloatingPokeball delay={2} left="15%" top="60%" />
        <FloatingPokeball delay={4} left="80%" top="20%" />
        <FloatingPokeball delay={1} left="90%" top="70%" />
        <FloatingPokeball delay={3} left="60%" top="85%" />
        <FloatingPokeball delay={5} left="30%" top="90%" />
        
        <BackgroundPokemon name="mewtwo" left="5%" top="20%" delay={0} />
        <BackgroundPokemon name="gengar" left="85%" top="30%" delay={3} />
        <BackgroundPokemon name="pikachu" left="75%" top="75%" delay={6} />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Text */}
          <div>
            <h1 className="text-6xl md:text-8xl font-extrabold leading-tight mb-4">
              <span className="block text-white">Catch.</span>
              <span className="block text-poke-red">Trade.</span>
              <span className="block text-poke-gold">Collect.</span>
            </h1>
            
            <p className="text-xl text-poke-text-muted mb-8 max-w-lg">
              Your complete trading card collection platform. Scan, track, and trade your Pokemon cards with a community of collectors.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Link 
                href="/register" 
                className="px-8 py-4 bg-gradient-to-r from-poke-red to-red-700 hover:from-red-600 hover:to-red-800 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-poke-red/30"
              >
                Start Collecting
              </Link>
              <Link 
                href="/marketplace" 
                className="px-8 py-4 border-2 border-poke-gold text-poke-gold hover:bg-poke-gold hover:text-poke-bg font-bold rounded-xl transition-all"
              >
                Browse Marketplace
              </Link>
            </div>
          </div>
          
          {/* Right Side - Charizard */}
          <div className="relative flex justify-center">
            {/* Glowing Aura */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-80 h-80 bg-gradient-to-r from-orange-500/30 via-red-500/30 to-yellow-500/30 rounded-full blur-3xl animate-pulse" />
            </div>
            
            {/* Floating Charizard */}
            <div className="relative z-10 animate-float">
              <img 
                src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png" 
                alt="Charizard"
                className="w-80 h-80 md:w-96 md:h-96 object-contain drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatsBar() {
  const [cardsCount, setCardsCount] = useState(0);
  const [setsCount, setSetsCount] = useState(0);
  
  useEffect(() => {
    fetch(`${API_URL}/api/cards?limit=1`)
      .then(res => res.json())
      .then(data => {
        const total = data.total || 20078;
        setCardsCount(total);
      })
      .catch(() => setCardsCount(20078));
    
    fetch(`${API_URL}/api/sets`)
      .then(res => res.json())
      .then(data => {
        setSetsCount(data.sets?.length || 173);
      })
      .catch(() => setSetsCount(173));
  }, []);
  
  return (
    <section className="py-12 bg-poke-bg-light/50 border-y border-poke-border">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-4xl md:text-5xl font-bold text-poke-red mb-2">
              <AnimatedCounter end={cardsCount} />
            </div>
            <div className="text-poke-text-muted">Cards in Database</div>
          </div>
          <div>
            <div className="text-4xl md:text-5xl font-bold text-poke-gold mb-2">
              <AnimatedCounter end={setsCount} />
            </div>
            <div className="text-poke-text-muted">Pokemon Sets</div>
          </div>
          <div>
            <div className="text-4xl md:text-5xl font-bold text-white mb-2">
              Est. 2025
            </div>
            <div className="text-poke-text-muted">Join Free</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturedCards() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch(`${API_URL}/api/cards?setCode=base1&limit=20`)
      .then(res => res.json())
      .then(data => {
        const iconicCards = ['Charizard', 'Pikachu', 'Mewtwo', 'Blastoise', 'Venusaur'];
        const filtered = data.cards?.filter((c: Card) => iconicCards.includes(c.name)) || [];
        setCards(filtered.slice(0, 5));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);
  
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 text-center">
          Featured Cards
        </h2>
        <p className="text-poke-text-muted text-center mb-12">
          Iconic Pokemon cards from the collection
        </p>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <PokeballLoader size="lg" />
          </div>
        ) : (
          <div className="flex gap-6 overflow-x-auto pb-4 snap-x scrollbar-hide">
            {cards.map((card) => (
              <Link 
                key={card.id}
                href={`/marketplace/${card.id}`}
                className="flex-shrink-0 snap-center"
              >
                <div className="w-64 card-dark card-hover holo-effect">
                  <div className="aspect-[3/4] bg-gradient-to-br from-poke-bg-light to-poke-bg flex items-center justify-center p-4">
                    {card.imageUrl ? (
                      <img
                        src={card.imageUrl}
                        alt={card.name}
                        className="max-w-full max-h-full object-contain drop-shadow-lg"
                      />
                    ) : (
                      <img
                        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${card.name.toLowerCase().includes('charizard') ? '6' : card.name.toLowerCase().includes('pikachu') ? '25' : '1'}.png`}
                        alt={card.name}
                        className="w-32 h-32 object-contain"
                      />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-white">{card.name}</h3>
                    <p className="text-sm text-poke-text-muted">{card.setName}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="currentColor" className="text-poke-red" />
          <circle cx="12" cy="13" r="4" stroke="currentColor" className="text-poke-gold" />
        </svg>
      ),
      title: 'Search Cards',
      description: 'Find any Pokemon card in our database of 20,000+ cards'
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3v18h18" stroke="currentColor" className="text-poke-red" />
          <path d="M7 16l4-8 4 6 5-10" stroke="currentColor" className="text-poke-gold" />
        </svg>
      ),
      title: 'Track Portfolio',
      description: 'Monitor your collection value with real-time price tracking'
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 3h12l4 6-10 13L2 9l4-6z" stroke="currentColor" className="text-poke-gold" />
          <path d="M11 3 8 9l4 13 4-13-3-6" stroke="currentColor" className="text-poke-red" />
          <path d="M2 9h20" stroke="currentColor" className="text-poke-text-muted" />
        </svg>
      ),
      title: 'Trade & Sell',
      description: 'Connect with other collectors to trade or sell your cards'
    }
  ];
  
  return (
    <section className="py-20 bg-poke-bg-light/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-12 text-center">
          How It Works
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div 
              key={index}
              className="card-dark p-8 text-center hover:border-poke-red transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div className="flex justify-center mb-4">{step.icon}</div>
              <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
              <p className="text-poke-text-muted">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Dashboard({ user: initialUser }: { user: User }) {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [portfolioValue, setPortfolioValue] = useState<{ totalValue: number; cardCount: number; uniqueCards: number } | null>(null);
  const [totalCardsCount, setTotalCardsCount] = useState<number>(0);

  // Always read fresh user from localStorage - this is the source of truth
  const userData = localStorage.getItem('user');
  let user = initialUser;
  try {
    if (userData) {
      const parsed = JSON.parse(userData);
      if (parsed && parsed.username) {
        user = parsed;
      }
    }
  } catch (e) {
    // use initialUser as fallback
  }

  useEffect(() => {
    // Fetch total cards in database
    fetch(`${API_URL}/api/cards?limit=1`)
      .then(res => res.json())
      .then(data => {
        setTotalCardsCount(data.total || 0);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch(`${API_URL}/api/portfolios`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setPortfolios(Array.isArray(data) ? data : []);
        if (data.length > 0) {
          return fetch(`${API_URL}/api/portfolios/${data[0].id}/value`, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
        return null;
      })
      .then(res => res?.ok ? res.json() : null)
      .then(data => {
        if (data) setPortfolioValue(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const allItems = (portfolios || []).flatMap(p => p.items || []);
  const recentItems = allItems
    .sort((a, b) => new Date(b.card?.createdAt || 0).getTime() - new Date(a.card?.createdAt || 0).getTime())
    .slice(0, 6);

  const uniquePokemon = new Set(allItems.map(i => i.card.name));
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

  const StatIcon = ({ type }: { type: 'pokemon' | 'cards' | 'value' | 'sets' }) => {
    const icons: Record<string, React.ReactNode> = {
      pokemon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="#e63946" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 2a7 7 0 0 1 7 7c0 5-7 11-7 11S5 14 5 9a7 7 0 0 1 7-7z"/>
        </svg>
      ),
      cards: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="#6890f0" strokeWidth="2">
          <rect x="2" y="4" width="20" height="16" rx="2"/>
          <path d="M12 8v8M8 12h8"/>
        </svg>
      ),
      value: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="#ffd700" strokeWidth="2">
          <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      ),
      sets: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
      )
    };
    return icons[type];
  };

  const ActionCard = ({ icon, title, subtitle, href }: { icon: React.ReactNode; title: string; subtitle: string; href: string }) => (
    <Link 
      href={href}
      className="flex-1 min-w-[200px] p-6 rounded-xl transition-all hover:scale-105"
      style={{ 
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}
    >
      <div className="text-poke-red mb-3">{icon}</div>
      <h3 className="font-rajdhani font-bold text-lg text-white mb-1">{title}</h3>
      <p className="text-sm text-poke-text-muted">{subtitle}</p>
    </Link>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1529 50%, #0f1a2e 100%)' }}>
        <PokeballLoader size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative" style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1529 50%, #0f1a2e 100%)' }}>
      {/* Floating Pokeballs Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute opacity-10 animate-float" style={{ left: '5%', top: '10%' }}>
          <svg width="40" height="40" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="#e63946" stroke="#0a0f1e" strokeWidth="4" />
            <rect x="2" y="46" width="96" height="8" fill="#0a0f1e" />
            <circle cx="50" cy="50" r="14" fill="#ffffff" stroke="#0a0f1e" strokeWidth="4" />
            <circle cx="50" cy="50" r="6" fill="#0a0f1e" />
          </svg>
        </div>
        <div className="absolute opacity-10 animate-float" style={{ left: '85%', top: '60%', animationDelay: '2s' }}>
          <svg width="50" height="50" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="#e63946" stroke="#0a0f1e" strokeWidth="4" />
            <rect x="2" y="46" width="96" height="8" fill="#0a0f1e" />
            <circle cx="50" cy="50" r="14" fill="#ffffff" stroke="#0a0f1e" strokeWidth="4" />
            <circle cx="50" cy="50" r="6" fill="#0a0f1e" />
          </svg>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Trainer Card */}
        <div 
          className="rounded-2xl p-6 md:p-8 mb-8"
          style={{ 
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Left: Avatar & Name */}
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
                <h1 className="font-rajdhani text-3xl font-bold text-white">{user.displayName}</h1>
                <p className="text-poke-gold">@{displayName}</p>
              </div>
            </div>

            {/* Right: Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1 lg:ml-12">
              <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(230,57,70,0.1)', border: '1px solid rgba(230,57,70,0.2)' }}>
                <div className="flex justify-center mb-2"><StatIcon type="pokemon" /></div>
                <div className="font-rajdhani text-2xl font-bold text-poke-red">{uniquePokemon.size}</div>
                <div className="text-xs text-poke-text-muted">{totalCardsCount.toLocaleString()} cards available</div>
              </div>
              <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(104,144,240,0.1)', border: '1px solid rgba(104,144,240,0.2)' }}>
                <div className="flex justify-center mb-2"><StatIcon type="cards" /></div>
                <div className="font-rajdhani text-2xl font-bold text-blue-400">{totalCards}</div>
                <div className="text-xs text-poke-text-muted">Cards Owned</div>
              </div>
              <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.2)' }}>
                <div className="flex justify-center mb-2"><StatIcon type="value" /></div>
                <div className="font-rajdhani text-2xl font-bold text-poke-gold">${portfolioValue ? portfolioValue.totalValue.toFixed(2) : '0.00'}</div>
                <div className="text-xs text-poke-text-muted">Market Value</div>
              </div>
              <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)' }}>
                <div className="flex justify-center mb-2"><StatIcon type="sets" /></div>
                <div className="font-rajdhani text-2xl font-bold text-purple-400">{uniqueSets.size}</div>
                <div className="text-xs text-poke-text-muted">Sets</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 lg:ml-6">
              <Link 
                href="/onboarding" 
                className="px-4 py-2 rounded-lg font-medium transition-all"
                style={{ 
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#94a3b8'
                }}
              >
                Edit Profile
              </Link>
              <button 
                onClick={handleShare} 
                className="px-4 py-2 rounded-lg font-medium transition-all hover:scale-105"
                style={{ 
                  background: 'linear-gradient(to right, #e63946, #c1121f)',
                  boxShadow: '0 4px 15px rgba(230,57,70,0.3)'
                }}
              >
                Share
              </button>
            </div>
          </div>
        </div>

        {/* Recent Collection */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-rajdhani text-2xl font-bold text-white">Recent Collection</h2>
            <Link href="/portfolio" className="text-poke-gold hover:text-white transition-colors text-sm font-medium">
              View Full Portfolio →
            </Link>
          </div>
          
          {recentItems.length === 0 ? (
            <div 
              className="p-12 rounded-xl text-center"
              style={{ 
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <div className="flex justify-center mb-6">
                <svg width="80" height="80" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="#e63946" stroke="#0a0f1e" strokeWidth="4" />
                  <rect x="2" y="46" width="96" height="8" fill="#0a0f1e" />
                  <circle cx="50" cy="50" r="14" fill="#ffffff" stroke="#0a0f1e" strokeWidth="4" />
                  <circle cx="50" cy="50" r="6" fill="#0a0f1e" />
                </svg>
              </div>
              <h3 className="font-rajdhani text-xl font-bold text-white mb-2">Your collection is empty</h3>
              <p className="text-poke-text-muted mb-6">Start adding cards to your portfolio!</p>
              <Link 
                href="/marketplace" 
                className="inline-block px-8 py-3 rounded-full font-bold text-white transition-all hover:scale-105"
                style={{ 
                  background: 'linear-gradient(to right, #e63946, #c1121f)',
                  boxShadow: '0 4px 15px rgba(230,57,70,0.3)'
                }}
              >
                Browse Marketplace
              </Link>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x scrollbar-hide">
              {recentItems.map((item) => (
                <Link 
                  key={item.id}
                  href={`/marketplace/${item.card.id}`}
                  className="flex-shrink-0 snap-center"
                >
                  <div className="w-48 bg-[#111827] rounded-xl overflow-hidden border border-gray-700 hover:border-poke-red transition-all hover:scale-105 holo-effect">
                    <div className="aspect-[3/4] flex items-center justify-center p-2">
                      {item.card.imageUrl ? (
                        <img src={item.card.imageUrl} alt={item.card.name} className="max-w-full max-h-full object-contain" />
                      ) : (
                        <span className="text-poke-text-muted">No Image</span>
                      )}
                    </div>
                    <div className="p-3">
                      <h4 className="font-rajdhani font-bold text-white text-sm truncate">{item.card.name}</h4>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="font-rajdhani text-2xl font-bold text-white mb-6">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <ActionCard 
              href="/marketplace"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              }
              title="Search Cards"
              subtitle="Find cards in our 20,000+ database"
            />
            <ActionCard 
              href="/collection"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 3v18h18" />
                  <path d="M7 16l4-8 4 6 5-10" />
                </svg>
              }
              title="View Collection"
              subtitle="Track your progress"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    setHasToken(!!token);
    
    console.log('HomePage: token exists:', !!token);
    console.log('HomePage: userData exists:', !!userData);
    
    const fetchUser = async () => {
      if (token) {
        // Try to fetch fresh user data from API
        try {
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.catchandtrade.com';
          const res = await fetch(`${API_URL}/api/users/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const freshUser = await res.json();
            console.log('HomePage: fetched fresh user:', freshUser);
            localStorage.setItem('user', JSON.stringify(freshUser));
            setUser(freshUser);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error('HomePage: failed to fetch user:', e);
        }
        
        // Fallback to localStorage
        if (userData) {
          try {
            const parsed = JSON.parse(userData);
            console.log('HomePage: parsed user from localStorage:', parsed);
            setUser(parsed);
          } catch (e) {
            console.error('HomePage: failed to parse userData:', e);
          }
        }
      }
      setLoading(false);
    };
    
    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1529 50%, #0f1a2e 100%)' }}>
        <PokeballLoader size="lg" />
      </div>
    );
  }

  // Simple check: if there's a token, show dashboard
  if (hasToken) {
    console.log('HomePage: has token, showing dashboard');
    // Create a placeholder user - we'll fetch real data later
    const placeholderUser: User = {
      id: 'logged-in',
      username: 'User',
      displayName: 'User',
      avatarId: null
    };
    // Save to localStorage so onboarding page works
    localStorage.setItem('user', JSON.stringify(placeholderUser));
    return <Dashboard user={placeholderUser} />;
  }

  console.log('HomePage: rendering unauthenticated page');

  return (
    <div className="min-h-screen">
      <HeroSection />
      <StatsBar />
      <FeaturedCards />
      <HowItWorks />
      
      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="card-dark p-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Start Your Collection?
            </h2>
            <p className="text-poke-text-muted mb-8">
              Join thousands of collectors tracking their Pokemon cards today.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/register" className="btn-primary text-lg px-8">
                Get Started Free
              </Link>
              <Link href="/login" className="px-8 py-3 text-poke-text-muted hover:text-white font-medium transition-colors">
                Log in
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
