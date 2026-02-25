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
      animationDuration: `${8 + Math.random() * 4}s`
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
              <AnimatedCounter end={50000} suffix="+" />
            </div>
            <div className="text-poke-text-muted">Active Collectors</div>
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
    const iconicNames = ['Charizard', 'Pikachu', 'Mewtwo', 'Blastoise', 'Venusaur', 'Gengar'];
    const promises = iconicNames.map(name => 
      fetch(`${API_URL}/api/cards/search?q=${encodeURIComponent(name)}&limit=1`)
        .then(res => res.json())
        .then(data => data.results?.[0] || null)
        .catch(() => null)
    );
    
    Promise.all(promises).then(results => {
      setCards(results.filter(Boolean));
      setLoading(false);
    });
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
      icon: '📷',
      title: 'Scan Cards',
      description: 'Use your camera to quickly scan and identify any Pokemon card'
    },
    {
      icon: '📊',
      title: 'Track Portfolio',
      description: 'Monitor your collection value with real-time price tracking'
    },
    {
      icon: '💎',
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
              <div className="text-5xl mb-4">{step.icon}</div>
              <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
              <p className="text-poke-text-muted">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
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
      <div className="flex items-center justify-center min-h-screen">
        <PokeballLoader size="lg" />
      </div>
    );
  }

  if (user) {
    return <Dashboard user={user} />;
  }

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
