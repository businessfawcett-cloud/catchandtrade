'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

interface CardVariant {
  id: string;
  name: string;
  setName: string;
  setCode: string;
  cardNumber: string;
  rarity: string | null;
  imageUrl: string | null;
  owned: boolean;
  ownedQuantity: number;
  isGraded: boolean;
  gradeCompany: string | null;
  gradeValue: number | null;
  valuationOverride: number | null;
  marketPrice: number | null;
}

interface PokemonDetail {
  pokemon: {
    pokemonId: number;
    name: string;
    generation: number;
    generationName: string;
    spriteUrl: string;
  };
  stats: {
    totalVariants: number;
    ownedVariants: number;
    totalMarketValue: number;
    ownedMarketValue: number;
    mostExpensive: {
      name: string;
      setName: string;
      price: number;
    } | null;
    mostRecentlyOwned: {
      name: string;
      setName: string;
    } | null;
  };
  energyDistribution: Record<string, number>;
  rarityDistribution: Record<string, number>;
  cards: CardVariant[];
}

const containerStyle: React.CSSProperties = {
  background: '#0a0f1e',
  minHeight: '100vh',
  padding: '1rem'
};

export default function PokemonDetailPage() {
  const params = useParams();
  const pokemonId = params.id as string;
  const [data, setData] = useState<PokemonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pokedex' | 'expansions' | 'folders' | 'search'>('pokedex');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token) {
      window.location.href = '/login';
      return;
    }

    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {}
    }

    fetch(`${API_URL}/api/pokedex/${pokemonId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch pokemon:', err);
        setLoading(false);
      });
  }, [pokemonId]);

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          color: 'white'
        }}>
          Loading...
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={containerStyle}>
        <div style={{ color: 'white', textAlign: 'center', padding: '2rem' }}>
          <h1>Pokemon not found</h1>
          <Link href="/collection/pokedex" style={{ color: '#e63946' }}>Back to Pokédex</Link>
        </div>
      </div>
    );
  }

  const { pokemon, stats, energyDistribution, rarityDistribution, cards } = data;
  const ownedCards = cards.filter(c => c.owned);

  return (
    <div style={containerStyle}>
      {/* Header with Tabs */}
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '12px',
        padding: '1rem',
        marginBottom: '1rem'
      }}>
        {/* User Info */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          paddingBottom: '0.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {(['pokedex', 'expansions', 'folders', 'search'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeTab === tab ? '#e63946' : 'transparent',
                  color: activeTab === tab ? 'white' : '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  textTransform: 'capitalize'
                }}
              >
                {tab === 'pokedex' ? 'Pokédex' : tab}
              </button>
            ))}
          </div>
          <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
            {user?.displayName || user?.username || 'Trainer'}
            {user?.username && <span style={{ color: '#ffd700' }}> @{user.username}</span>}
          </div>
        </div>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Link href="/collection/pokedex" style={{ color: '#e63946', textDecoration: 'none', fontSize: '0.9rem' }}>
            ⚡ Pokédex
          </Link>
          <span style={{ color: '#94a3b8' }}>&gt;</span>
          <span style={{ color: 'white', fontSize: '1.2rem', fontWeight: 'bold' }}>
            {pokemon.name} Cards
          </span>
        </div>

        {/* Tab Content */}
        {activeTab === 'pokedex' && (
          <div>
            {/* Pokemon Info */}
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {/* Pokemon Sprite */}
              <div style={{
                width: '120px',
                height: '120px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <img 
                  src={pokemon.spriteUrl} 
                  alt={pokemon.name}
                  style={{ width: '100px', height: '100px', objectFit: 'contain' }}
                />
              </div>

              {/* Stats */}
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '1rem'
                }}>
                  <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '8px',
                    padding: '1rem'
                  }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                      {pokemon.name} Cards
                    </div>
                    <div style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold' }}>
                      {stats.ownedVariants} of {stats.totalVariants}
                    </div>
                  </div>
                  <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '8px',
                    padding: '1rem'
                  }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                      Most Recently Seen In
                    </div>
                    <div style={{ color: 'white', fontSize: '1rem' }}>
                      {stats.mostRecentlyOwned?.setName || '-'}
                    </div>
                  </div>
                  <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '8px',
                    padding: '1rem'
                  }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                      Market Value
                    </div>
                    <div style={{ color: '#ffd700', fontSize: '1.5rem', fontWeight: 'bold' }}>
                      ${stats.totalMarketValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '8px',
                    padding: '1rem'
                  }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                      Owned Market Value
                    </div>
                    <div style={{ color: '#10b981', fontSize: '1.5rem', fontWeight: 'bold' }}>
                      ${stats.ownedMarketValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Most Expensive Cards */}
            {stats.mostExpensive && (
              <div style={{ marginTop: '1.5rem' }}>
                <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  Most Expensive
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '8px',
                  padding: '1rem'
                }}>
                  <div style={{ color: 'white' }}>
                    {stats.mostExpensive.name} from {stats.mostExpensive.setName}
                  </div>
                  <div style={{ color: '#ffd700', fontSize: '1.2rem', fontWeight: 'bold' }}>
                    ${stats.mostExpensive.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            )}

            {/* Distribution Charts */}
            <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <div>
                <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                  Distribution by Energy Type
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {Object.entries(energyDistribution).map(([type, count]) => (
                    <div key={type} style={{
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: '4px',
                      padding: '0.25rem 0.5rem',
                      color: 'white',
                      fontSize: '0.8rem'
                    }}>
                      {count}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                  Distribution by Rarity
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {Object.entries(rarityDistribution).map(([type, count]) => (
                    <div key={type} style={{
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: '4px',
                      padding: '0.25rem 0.5rem',
                      color: 'white',
                      fontSize: '0.8rem',
                      textTransform: 'capitalize'
                    }}>
                      {type}: {count}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'expansions' && (
          <div>
            <div style={{ color: '#94a3b8', marginBottom: '1rem' }}>
              All {pokemon.name} card variants ({cards.length})
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: '1rem'
            }}>
              {cards.map(card => (
                <div
                  key={card.id}
                  style={{
                    background: card.owned ? 'rgba(230,57,70,0.1)' : 'rgba(255,255,255,0.05)',
                    border: card.owned ? '1px solid #e63946' : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    opacity: card.owned ? 1 : 0.6
                  }}
                >
                  {card.imageUrl && (
                    <img 
                      src={card.imageUrl} 
                      alt={card.name}
                      style={{ 
                        width: '100%', 
                        aspectRatio: '3/4', 
                        objectFit: 'contain',
                        marginBottom: '0.5rem'
                      }}
                    />
                  )}
                  <div style={{ color: 'white', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    {card.setName}
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                    #{card.cardNumber} {card.rarity && `• ${card.rarity}`}
                  </div>
                  {card.owned && (
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      marginTop: '0.5rem',
                      paddingTop: '0.5rem',
                      borderTop: '1px solid rgba(255,255,255,0.1)'
                    }}>
                      <span style={{ color: '#10b981', fontSize: '0.8rem' }}>Owned: {card.ownedQuantity}</span>
                      {card.isGraded && (
                        <span style={{ color: '#ffd700', fontSize: '0.8rem' }}>
                          {card.gradeCompany} {card.gradeValue}
                        </span>
                      )}
                    </div>
                  )}
                  {!card.owned && card.marketPrice && (
                    <div style={{ color: '#ffd700', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                      ${card.marketPrice.toFixed(2)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'folders' && (
          <div style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>
            Folders feature coming soon...
          </div>
        )}

        {activeTab === 'search' && (
          <div style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>
            Search feature coming soon...
          </div>
        )}
      </div>
    </div>
  );
}
