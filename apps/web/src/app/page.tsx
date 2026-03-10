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
  const [user, setUser] = useState<User>(initialUser);

  // Fallback recent sets in case API fails (2025-2026 sets)
  const fallbackSets = [
    { id: 'me2pt5', name: 'Ascended Heroes', total: 295, releaseDate: '2026-01-30', images: { logo: 'https://images.scrydex.com/pokemon/me2pt5-logo/logo', symbol: 'https://images.scrydex.com/pokemon/me2pt5-symbol/symbol' }},
    { id: 'me2', name: 'Phantasmal Flames', total: 130, releaseDate: '2025-11-14', images: { logo: 'https://images.pokemontcg.io/me2/logo.png', symbol: 'https://images.pokemontcg.io/me2/symbol.png' }},
    { id: 'me1', name: 'Mega Evolution', total: 188, releaseDate: '2025-09-26', images: { logo: 'https://images.pokemontcg.io/me1/logo.png', symbol: 'https://images.pokemontcg.io/me1/symbol.png' }},
    { id: 'zsv10pt5', name: 'Black Bolt', total: 172, releaseDate: '2025-07-18', images: { logo: 'https://images.pokemontcg.io/zsv10pt5/logo.png', symbol: 'https://images.pokemontcg.io/zsv10pt5/symbol.png' }},
    { id: 'rsv10pt5', name: 'White Flare', total: 173, releaseDate: '2025-07-18', images: { logo: 'https://images.pokemontcg.io/rsv10pt5/logo.png', symbol: 'https://images.pokemontcg.io/rsv10pt5/symbol.png' }},
    { id: 'sv10', name: 'Destined Rivals', total: 244, releaseDate: '2025-05-30', images: { logo: 'https://images.pokemontcg.io/sv10/logo.png', symbol: 'https://images.pokemontcg.io/sv10/symbol.png' }},
  ];

  const [recentSets, setRecentSets] = useState<any[]>(fallbackSets);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    try {
      if (userData) {
        const parsed = JSON.parse(userData);
        if (parsed && parsed.username && parsed.username !== 'User') {
          setUser(parsed);
        }
      }
    } catch (e) {
      // use initialUser as fallback
    }
  }, [initialUser]);

  useEffect(() => {
    // Fetch total cards in database
    fetch(`${API_URL}/api/cards?limit=1`)
      .then(res => res.json())
      .then(data => {
        setTotalCardsCount(data.total || 0);
      })
      .catch(() => {});

    // Fetch recent TCG sets from Pokemon TCG API
    fetch('https://api.pokemontcg.io/v2/sets?orderBy=-releaseDate&pageSize=6')
      .then(res => res.json())
      .then(data => {
        if (data?.data && data.data.length > 0) {
          setRecentSets(data.data.slice(0, 6));
        } else {
          // Use fallback data if API returns empty
          setRecentSets(fallbackSets);
        }
      })
      .catch(() => {
        // Use fallback data if API fails
        setRecentSets(fallbackSets);
      });
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
  const displayName = user.displayName || user.username || 'Trainer';

  // Stat card icons - larger 24px
  const StackedCardsIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
      <rect x="2" y="4" width="20" height="14" rx="2" />
      <rect x="4" y="2" width="20" height="14" rx="2" opacity="0.5" />
    </svg>
  );

  const StarIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
    </svg>
  );

  const DollarCircleIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f0c040" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v12M9 9h4.5a1.5 1.5 0 0 1 0 3H9M9 15h4.5a1.5 1.5 0 0 0 0-3H9" />
    </svg>
  );

  const GridIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );

  // Action tile icons - 28px
  const SearchIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );

  const ChartIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
      <path d="M3 3v18h18" />
      <path d="M7 16l4-8 4 6 5-10" />
    </svg>
  );

  const CameraIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );

  const TrendIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f0c040" strokeWidth="2">
      <path d="M3 3v18h18" />
      <path d="M7 16l4-8 4 6 5-10" />
    </svg>
  );

  const EmptyPokeballIcon = () => (
    <svg width="48" height="48" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
      <line x1="5" y1="50" x2="95" y2="50" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
      <circle cx="50" cy="50" r="12" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
    </svg>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#07070f' }}>
        <PokeballLoader size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#07070f', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 36px' }}>
        
        {/* SECTION 1 - Profile Hero - Full width gradient banner */}
        <div style={{
          background: 'linear-gradient(135deg, #0d0d18 0%, #1a1035 50%, #0d0d18 100%)',
          borderRadius: '20px',
          padding: '32px 36px',
          marginBottom: '32px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Top row: avatar + name + buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
            {/* Avatar + Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
              {/* Avatar - 64px with purple glow */}
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                border: '3px solid #8b5cf6',
                boxShadow: '0 0 20px rgba(139,92,246,0.4)',
                overflow: 'hidden'
              }}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: '#1a1035', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>{displayName.charAt(0).toUpperCase()}</span>
                  </div>
                )}
              </div>

              {/* Name - Bebas Neue */}
              <div>
                <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '36px', color: 'white', letterSpacing: '1px', lineHeight: 1 }}>{displayName}</h2>
                {user.username && (
                  <span style={{ color: '#6b7280', fontSize: '14px' }}>@{user.username}</span>
                )}
              </div>
            </div>

            {/* Buttons - refined */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link 
                href="/onboarding"
                style={{
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'transparent',
                  color: '#9ca3af',
                  fontSize: '11px',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#8b5cf6';
                  e.currentTarget.style.color = '#8b5cf6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.color = '#9ca3af';
                }}
              >
                Edit Profile
              </Link>
              <button 
                onClick={handleShare}
                style={{
                  border: 'none',
                  background: 'rgba(239,68,68,0.15)',
                  color: '#ef4444',
                  fontSize: '11px',
                  fontWeight: '600',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#ef4444'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
                onMouseOver={(e) => e.currentTarget.style.color = 'white'}
                onMouseOut={(e) => e.currentTarget.style.color = '#ef4444'}
              >
                Share
              </button>
            </div>
          </div>

          {/* Stats row - borderless with dividers */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
            {/* Stat 1 - Total Cards */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 20px' }}>
              <StackedCardsIcon />
              <div style={{ color: 'white', fontSize: '40px', fontWeight: '800', lineHeight: 1.1, marginTop: '8px' }}>
                {totalCardsCount.toLocaleString()}
              </div>
              <div style={{ color: '#6b7280', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: '4px' }}>Total Cards</div>
            </div>

            {/* Divider */}
            <div style={{ width: '1px', height: '60px', background: 'rgba(255,255,255,0.08)' }} />

            {/* Stat 2 - Cards Owned */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 20px' }}>
              <StarIcon />
              <div style={{ color: 'white', fontSize: '40px', fontWeight: '800', lineHeight: 1.1, marginTop: '8px' }}>{totalCards}</div>
              <div style={{ color: '#6b7280', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: '4px' }}>Owned</div>
            </div>

            {/* Divider */}
            <div style={{ width: '1px', height: '60px', background: 'rgba(255,255,255,0.08)' }} />

            {/* Stat 3 - Market Value */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 20px' }}>
              <DollarCircleIcon />
              <div style={{ color: '#f0c040', fontSize: '40px', fontWeight: '800', lineHeight: 1.1, marginTop: '8px' }}>
                ${portfolioValue ? portfolioValue.totalValue.toFixed(2) : '0.00'}
              </div>
              <div style={{ color: '#6b7280', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: '4px' }}>Value</div>
            </div>

            {/* Divider */}
            <div style={{ width: '1px', height: '60px', background: 'rgba(255,255,255,0.08)' }} />

            {/* Stat 4 - Sets */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 20px' }}>
              <GridIcon />
              <div style={{ color: 'white', fontSize: '40px', fontWeight: '800', lineHeight: 1.1, marginTop: '8px' }}>{uniqueSets.size}</div>
              <div style={{ color: '#6b7280', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: '4px' }}>Sets</div>
            </div>
          </div>
        </div>

        {/* SECTION 2 - Recent Collection */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '20px', letterSpacing: '3px', color: '#f0c040' }}>Recent Collection</h2>
            <Link href="/portfolio" style={{ color: '#f0c040', fontSize: '13px', textDecoration: 'none' }}>
              View Full Portfolio →
            </Link>
          </div>

          {recentItems.length === 0 ? (
            /* Compact empty state */
            <div style={{
              background: '#11111e',
              border: '1px solid rgba(255,255,255,0.055)',
              borderRadius: '12px',
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              <EmptyPokeballIcon />
              <div style={{ flex: 1 }}>
                <h3 style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>Your collection is empty</h3>
                <p style={{ color: '#6b7280', fontSize: '12px' }}>Start adding cards to your portfolio!</p>
              </div>
              <Link 
                href="/marketplace"
                style={{
                  background: '#ef4444',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '12px',
                  padding: '8px 18px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap'
                }}
              >
                Browse Marketplace
              </Link>
            </div>
          ) : (
            /* Cards with purple glow on hover */
            <div style={{ display: 'flex', gap: '14px', overflowX: 'auto', paddingBottom: '8px' }}>
              {recentItems.map((item) => (
                <Link 
                  key={item.id}
                  href={`/marketplace/${item.card.id}`}
                  style={{ flexShrink: 0 }}
                >
                  <div style={{
                    background: '#11111e',
                    border: '1px solid rgba(255,255,255,0.055)',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    width: '140px',
                    transition: 'all 0.25s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)';
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(139,92,246,0.35)';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.055)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                  >
                    <div style={{ aspectRatio: '3/4', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px' }}>
                      {item.card.imageUrl ? (
                        <img src={item.card.imageUrl} alt={item.card.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                      ) : (
                        <span style={{ color: '#6b7280', fontSize: '11px' }}>No Image</span>
                      )}
                    </div>
                    <div style={{ padding: '10px' }}>
                      <h4 style={{ color: 'white', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.card.name}</h4>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 3 - Quick Actions - 4 column row */}
        <div>
          <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '20px', letterSpacing: '3px', color: '#f0c040', marginBottom: '16px' }}>Quick Actions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {/* Action 1 - Search Cards */}
            <Link href="/marketplace" style={{ textDecoration: 'none' }}>
              <div style={{
                background: '#11111e',
                border: '1px solid rgba(139,92,246,0.1)',
                borderRadius: '12px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)';
                e.currentTarget.style.background = 'rgba(139,92,246,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(139,92,246,0.1)';
                e.currentTarget.style.background = '#11111e';
              }}
              >
                <SearchIcon />
                <div>
                  <h4 style={{ color: 'white', fontSize: '12px', fontWeight: '600', marginBottom: '1px' }}>Search Cards</h4>
                  <p style={{ color: '#6b7280', fontSize: '10px' }}>Find any of 20,000+ cards</p>
                </div>
              </div>
            </Link>

            {/* Action 2 - View Collection */}
            <Link href="/collection" style={{ textDecoration: 'none' }}>
              <div style={{
                background: '#11111e',
                border: '1px solid rgba(139,92,246,0.1)',
                borderRadius: '12px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)';
                e.currentTarget.style.background = 'rgba(139,92,246,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(139,92,246,0.1)';
                e.currentTarget.style.background = '#11111e';
              }}
              >
                <ChartIcon />
                <div>
                  <h4 style={{ color: 'white', fontSize: '12px', fontWeight: '600', marginBottom: '1px' }}>Collection</h4>
                  <p style={{ color: '#6b7280', fontSize: '10px' }}>Track your progress</p>
                </div>
              </div>
            </Link>

            {/* Action 3 - Scan a Card */}
            <Link href="/scan" style={{ textDecoration: 'none' }}>
              <div style={{
                background: '#11111e',
                border: '1px solid rgba(139,92,246,0.1)',
                borderRadius: '12px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)';
                e.currentTarget.style.background = 'rgba(139,92,246,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(139,92,246,0.1)';
                e.currentTarget.style.background = '#11111e';
              }}
              >
                <CameraIcon />
                <div>
                  <h4 style={{ color: 'white', fontSize: '12px', fontWeight: '600', marginBottom: '1px' }}>Scan Card</h4>
                  <p style={{ color: '#6b7280', fontSize: '10px' }}>Identify instantly</p>
                </div>
              </div>
            </Link>

            {/* Action 4 - Grading ROI */}
            <Link href="/grading" style={{ textDecoration: 'none' }}>
              <div style={{
                background: '#11111e',
                border: '1px solid rgba(139,92,246,0.1)',
                borderRadius: '12px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)';
                e.currentTarget.style.background = 'rgba(139,92,246,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(139,92,246,0.1)';
                e.currentTarget.style.background = '#11111e';
              }}
              >
                <TrendIcon />
                <div>
                  <h4 style={{ color: 'white', fontSize: '12px', fontWeight: '600', marginBottom: '1px' }}>Grading ROI</h4>
                  <p style={{ color: '#6b7280', fontSize: '10px' }}>Is it worth grading?</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* SECTION 4 - Recent Drops - New TCG Sets */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '20px', letterSpacing: '3px', color: '#f0c040', marginBottom: '16px' }}>Recent Drops</h2>
          
          {recentSets.length === 0 ? (
            <div style={{
              background: '#11111e',
              border: '1px solid rgba(255,255,255,0.055)',
              borderRadius: '12px',
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              <EmptyPokeballIcon />
              <div style={{ flex: 1 }}>
                <h3 style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>Loading new sets...</h3>
                <p style={{ color: '#6b7280', fontSize: '12px' }}>Fetching latest TCG releases</p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '14px', overflowX: 'auto', paddingBottom: '8px' }}>
              {recentSets.map((set) => (
                <Link 
                  key={set.id}
                  href={`/collection/${set.id}`}
                  style={{ textDecoration: 'none', flexShrink: 0 }}
                >
                  <div 
                    style={{
                      background: '#11111e',
                      border: '1px solid rgba(255,255,255,0.055)',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      width: '160px',
                      transition: 'all 0.25s',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)';
                      e.currentTarget.style.boxShadow = '0 0 20px rgba(139,92,246,0.35)';
                      e.currentTarget.style.transform = 'translateY(-4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.055)';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {/* Set logo image */}
                    <div style={{ 
                      aspectRatio: '1/1', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      padding: '12px',
                      background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(30,16,64,0.3))'
                    }}>
                      {set.images?.logo ? (
                        <img 
                          src={set.images.logo} 
                          alt={set.name} 
                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                        />
                      ) : set.images?.symbol ? (
                        <img 
                          src={set.images.symbol} 
                          alt={set.name} 
                          style={{ maxWidth: '60%', maxHeight: '60%', objectFit: 'contain' }} 
                        />
                      ) : (
                        <div style={{ color: '#6b7280', fontSize: '11px' }}>No Image</div>
                      )}
                    </div>
                    
                    {/* Set info */}
                    <div style={{ padding: '12px' }}>
                      <h4 style={{ color: 'white', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '4px' }}>
                        {set.name}
                      </h4>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#6b7280', fontSize: '10px' }}>{set.total} cards</span>
                        {set.releaseDate && (
                          <span style={{ color: '#f0c040', fontSize: '9px', background: 'rgba(240,192,64,0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                            {new Date(set.releaseDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
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

  console.log('HomePage: rendering page');
  console.log('HomePage: has token:', hasToken);

  return (
    <div className="min-h-screen">
      {hasToken ? (
        <Dashboard user={user || {
          id: 'logged-in',
          username: null,
          displayName: 'Trainer',
          avatarId: null
        }} />
      ) : (
        <>
          <HeroSection />
          <StatsBar />
          <FeaturedCards />
          <HowItWorks />
        </>
      )}
      
      {/* CTA Section - only show when not logged in */}
      {!hasToken && (
        <>
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

      <footer className="py-8 border-t border-poke-border">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-poke-text-muted text-sm">
            © {new Date().getFullYear()} Catch & Trade. All rights reserved.
          </p>
          <div className="flex justify-center gap-6 mt-4">
            <Link href="/legal/terms" className="text-poke-text-muted hover:text-poke-gold text-sm transition-colors">
              Terms of Service
            </Link>
            <Link href="/legal/privacy" className="text-poke-text-muted hover:text-poke-gold text-sm transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
        </>
      )}
    </div>
  );
}
