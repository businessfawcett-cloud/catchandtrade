'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

interface PokemonData {
  pokemonId: number;
  name: string;
  generation: number;
  generationName: string;
  owned: boolean;
  cardCount: number;
  hasGraded: boolean;
  hasPSA10: boolean;
  marketValue: number;
  imageUrl: string;
}

interface OverviewData {
  totalOwned: number;
  totalPokemon: number;
  totalCards: number;
  totalValue: number;
  mastered: number;
  percentage: number;
}

const containerStyle: React.CSSProperties = {
  background: '#0a0f1e',
  minHeight: '100vh',
  padding: '1rem'
};

export default function PokedexPage() {
  const [pokemonList, setPokemonList] = useState<PokemonData[]>([]);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'owned' | 'not-owned'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGeneration, setSelectedGeneration] = useState<number | null>(null);
  const [generationFilterOpen, setGenerationFilterOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('Pokédex: Token exists:', !!token);
    console.log('Pokédex: Token value:', token ? token.substring(0, 20) + '...' : 'none');
    
    if (!token) {
      console.log('Pokédex: No token, redirecting to login');
      window.location.href = '/login';
      return;
    }

    console.log('Pokédex: Making API call to /api/pokedex/overview');
     fetch(`${API_URL}/api/pokedex`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(res => {
        console.log('Pokédex: API response status:', res.status);
        if (!res.ok) {
          return res.text().then(text => {
            console.log('Pokédex: API error response:', text);
            throw new Error(`API error: ${res.status} - ${text}`);
          });
        }
        return res.json();
      })
      .then(data => {
        console.log('Pokédex: Received data:', data);
        setPokemonList(data.pokemon || []);
        setOverview(data.overview || null);
        setLoading(false);
      })
      .catch(err => {
        console.error('Pokédex: Failed to fetch:', err);
        setLoading(false);
      });
  }, []);

  const filteredPokemon = useMemo(() => {
    let filtered = pokemonList;

    // Filter by generation
    if (selectedGeneration !== null) {
      filtered = filtered.filter(p => p.generation === selectedGeneration);
    }

    // Filter by owned status
    if (filter === 'owned') {
      filtered = filtered.filter(p => p.owned);
    } else if (filter === 'not-owned') {
      filtered = filtered.filter(p => !p.owned);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.pokemonId.toString() === query
      );
    }

    return filtered;
  }, [pokemonList, filter, searchQuery, selectedGeneration]);

  const generations = useMemo(() => {
    const gens = new Map<number, { name: string; owned: number; total: number }>();
    for (const p of pokemonList) {
      if (!gens.has(p.generation)) {
        gens.set(p.generation, { name: p.generationName, owned: 0, total: 0 });
      }
      const gen = gens.get(p.generation)!;
      gen.total++;
      if (p.owned) gen.owned++;
    }
    return Array.from(gens.entries()).sort((a, b) => a[0] - b[0]);
  }, [pokemonList]);

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
          Loading Pokédex...
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '1rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '2rem' }}>⚡</span>
          <h1 style={{ color: 'white', margin: 0, fontSize: '1.5rem' }}>Pokédex</h1>
        </div>
        
        {/* Search */}
        <input
          type="text"
          placeholder="Search by name or #..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.2)',
            background: 'rgba(255,255,255,0.1)',
            color: 'white',
            width: '200px'
          }}
        />
      </div>

      {/* Stats Bar */}
      {overview && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
            padding: '1rem',
            textAlign: 'center'
          }}>
            <div style={{ color: '#ffd700', fontSize: '1.5rem', fontWeight: 'bold' }}>
              {overview.totalOwned} / {overview.totalPokemon}
            </div>
            <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Pokémon Collected</div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
            padding: '1rem',
            textAlign: 'center'
          }}>
            <div style={{ color: '#10b981', fontSize: '1.5rem', fontWeight: 'bold' }}>
              {overview.percentage}%
            </div>
            <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Complete</div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
            padding: '1rem',
            textAlign: 'center'
          }}>
            <div style={{ color: '#e63946', fontSize: '1.5rem', fontWeight: 'bold' }}>
              {overview.mastered}
            </div>
            <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Mastered (PSA 10)</div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
            padding: '1rem',
            textAlign: 'center'
          }}>
            <div style={{ color: '#6890f0', fontSize: '1.5rem', fontWeight: 'bold' }}>
              ${overview.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Collection Value</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1rem',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setFilter('all')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            border: 'none',
            background: filter === 'all' ? '#e63946' : 'rgba(255,255,255,0.1)',
            color: 'white',
            cursor: 'pointer',
            fontWeight: filter === 'all' ? 'bold' : 'normal'
          }}
        >
          All
        </button>
        <button
          onClick={() => setFilter('owned')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            border: 'none',
            background: filter === 'owned' ? '#e63946' : 'rgba(255,255,255,0.1)',
            color: 'white',
            cursor: 'pointer',
            fontWeight: filter === 'owned' ? 'bold' : 'normal'
          }}
        >
          Owned
        </button>
        <button
          onClick={() => setFilter('not-owned')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            border: 'none',
            background: filter === 'not-owned' ? '#e63946' : 'rgba(255,255,255,0.1)',
            color: 'white',
            cursor: 'pointer',
            fontWeight: filter === 'not-owned' ? 'bold' : 'normal'
          }}
        >
          Not Owned
        </button>

        {/* Generation Filter Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setGenerationFilterOpen(!generationFilterOpen)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: selectedGeneration !== null ? '1px solid #e63946' : '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.1)',
              color: 'white',
              cursor: 'pointer',
              marginLeft: '0.5rem'
            }}
          >
            {selectedGeneration !== null 
              ? `Gen ${selectedGeneration}` 
              : 'All Generations'}
          </button>
          
          {generationFilterOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: '0.5rem',
              marginTop: '0.25rem',
              background: '#1a2332',
              borderRadius: '8px',
              padding: '0.5rem',
              zIndex: 100,
              minWidth: '200px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}>
              <button
                onClick={() => { setSelectedGeneration(null); setGenerationFilterOpen(false); }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '0.5rem',
                  border: 'none',
                  background: selectedGeneration === null ? 'rgba(230,57,70,0.2)' : 'transparent',
                  color: 'white',
                  cursor: 'pointer',
                  textAlign: 'left',
                  borderRadius: '4px'
                }}
              >
                All Generations
              </button>
              {generations.map(([gen, data]) => (
                <button
                  key={gen}
                  onClick={() => { setSelectedGeneration(gen); setGenerationFilterOpen(false); }}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '0.5rem',
                    border: 'none',
                    background: selectedGeneration === gen ? 'rgba(230,57,70,0.2)' : 'transparent',
                    color: 'white',
                    cursor: 'pointer',
                    textAlign: 'left',
                    borderRadius: '4px'
                  }}
                >
                  Gen {gen}: {data.owned}/{data.total}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pokemon Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
        gap: '0.75rem'
      }}>
        {filteredPokemon.map(pokemon => (
          <Link
            key={pokemon.pokemonId}
            href={`/collection/pokedex/${pokemon.pokemonId}`}
            style={{
              display: 'block',
              textDecoration: 'none'
            }}
          >
            <div style={{
              background: pokemon.owned 
                ? 'rgba(255,255,255,0.1)' 
                : 'rgba(255,255,255,0.02)',
              border: pokemon.owned 
                ? '2px solid #e63946' 
                : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '0.5rem',
              textAlign: 'center',
              transition: 'all 0.2s',
              opacity: pokemon.owned ? 1 : 0.4,
              cursor: 'pointer'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                margin: '0 auto 0.5rem',
                background: pokemon.owned 
                  ? 'transparent' 
                  : 'rgba(255,255,255,0.05)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}>
                <img
                  src={pokemon.imageUrl}
                  alt={pokemon.name}
                  style={{
                    width: '50px',
                    height: '50px',
                    objectFit: 'contain',
                    filter: pokemon.owned ? 'none' : 'grayscale(100%) brightness(50%)'
                  }}
                />
              </div>
              <div style={{
                color: '#94a3b8',
                fontSize: '0.7rem'
              }}>
                #{pokemon.pokemonId.toString().padStart(3, '0')}
              </div>
              <div style={{
                color: 'white',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {pokemon.name}
              </div>
              {pokemon.owned && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '0.25rem',
                  marginTop: '0.25rem'
                }}>
                  {pokemon.hasPSA10 && (
                    <span style={{ color: '#ffd700', fontSize: '0.7rem' }}>⭐</span>
                  )}
                  {pokemon.hasGraded && !pokemon.hasPSA10 && (
                    <span style={{ color: '#6890f0', fontSize: '0.7rem' }}>💎</span>
                  )}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {filteredPokemon.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#94a3b8'
        }}>
          {overview && overview.totalOwned === 0 
            ? "You haven't added any cards to your portfolio yet. Add cards from the Marketplace to see them here!" 
            : "No Pokémon found matching your filters."}
        </div>
      )}
    </div>
  );
}
