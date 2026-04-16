'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

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

interface Set {
  id: string;
  name: string;
  code: string;
  cardCount?: number;
}

type SortOption = 'newest' | 'oldest' | 'name' | 'price-desc' | 'price-asc';

const TOTAL_CARDS = 20078;
const TOTAL_SETS = 173;

const MagnifyingGlassIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#40404e" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const PokeballIcon = () => (
  <svg width="14" height="14" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="45" fill="#e63946" stroke="#0a0f1e" strokeWidth="4" />
    <rect x="2" y="46" width="96" height="8" fill="#0a0f1e" />
    <circle cx="50" cy="50" r="14" fill="#ffffff" stroke="#0a0f1e" strokeWidth="4" />
    <circle cx="50" cy="50" r="6" fill="#0a0f1e" />
  </svg>
);

const RarityDot = ({ color }: { color: string }) => (
  <span style={{ 
    width: '5px', 
    height: '5px', 
    borderRadius: '50%', 
    backgroundColor: color,
    display: 'inline-block'
  }} />
);

function SkeletonCard() {
  return (
    <div style={{
      background: '#11111e',
      borderRadius: '16px',
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.08)'
    }}>
      <div style={{ aspectRatio: '3/4', background: '#1a2332' }} />
      <div style={{ background: '#13131f', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '10px 12px 13px' }}>
        <div style={{ height: '14px', background: '#1a2332', borderRadius: '4px', marginBottom: '4px', width: '70%' }} />
        <div style={{ height: '11px', background: '#1a2332', borderRadius: '4px', marginBottom: '8px', width: '50%' }} />
        <div style={{ height: '14px', background: '#1a2332', borderRadius: '4px', width: '30%' }} />
      </div>
    </div>
  );
}

function normalizeRarity(rarity: string | null): string {
  if (!rarity) return '';
  if (rarity.toUpperCase().includes('MEGA') && rarity.toUpperCase().includes('RARE')) {
    return 'Mega Rare';
  }
  return rarity;
}

export default function MarketplacePage() {
  const router = useRouter();
  const [cards, setCards] = useState<Card[]>([]);
  const [sets, setSets] = useState<Set[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [selectedSet, setSelectedSet] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCards, setTotalCards] = useState(TOTAL_CARDS);
  const cardsPerPage = 50;

  useEffect(() => {
    const fetchSets = async () => {
      try {
        const res = await fetch(`${API_URL}/api/sets`);
        const data = await res.json();
        setSets(data.sets || []);
      } catch (err) {
        console.error('Failed to fetch sets:', err);
      }
    };
    fetchSets();
  }, []);

  const fetchCards = useCallback(async (query: string = '', sort: string = 'newest', setFilter: string = '', page: number = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('limit', String(cardsPerPage));
      params.set('page', String(page));
      
      if (setFilter) params.set('setCode', setFilter);
      if (sort) params.set('sort', sort);
      
      let url: string;
      if (query.trim()) {
        url = `${API_URL}/api/cards/search?q=${encodeURIComponent(query)}&${params.toString()}`;
      } else {
        url = `${API_URL}/api/cards?${params.toString()}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch cards');
      
      const data = await response.json();
      const fetchedCards = data.results || data.cards || [];
      
      setCards(fetchedCards);
      setTotalCards(data.total || fetchedCards.length);
    } catch (err) {
      setError('Failed to load cards');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCards(searchQuery, sortBy, selectedSet, currentPage);
  }, [fetchCards, searchQuery, sortBy, selectedSet, currentPage]);

  useEffect(() => {
    if (!searchQuery.trim()) return;
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchCards(searchQuery, sortBy, selectedSet, 1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, sortBy, selectedSet, fetchCards]);

  const startNum = (currentPage - 1) * cardsPerPage + 1;
  const endNum = Math.min(currentPage * cardsPerPage, totalCards);

  const getRarityColor = (rarity: string | null) => {
    if (!rarity) return '#6b7280';
    const r = rarity.toUpperCase();
    if (r.includes('ILLUSTRATION RARE') && r.includes('SPECIAL')) return '#f0c040';
    if (r.includes('ILLUSTRATION RARE')) return '#ec4899';
    if (r.includes('ULTRA RARE') || r.includes('HYPER RARE') || r.includes('SECRET')) return '#f59e0b';
    if (r.includes('RARE')) return '#3b82f6';
    if (r.includes('UNCOMMON')) return '#22c55e';
    if (r.includes('COMMON')) return '#6b7280';
    return '#6b7280';
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a14' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ 
          maxWidth: '1400px', 
          margin: '0 auto', 
          padding: '24px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}>
          <div>
            <h1 style={{ 
              fontFamily: 'Bebas Neue, sans-serif', 
              fontSize: '52px', 
              letterSpacing: '2px', 
              color: 'white',
              lineHeight: 1.2,
              marginBottom: '20px'
            }}>
              Marketplace
            </h1>
            <p style={{ 
              fontSize: '13px', 
              color: '#9090a8',
              margin: 0
            }}>
              {totalCards.toLocaleString()} cards across {TOTAL_SETS} sets
            </p>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '99px',
            padding: '5px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <PokeballIcon />
            <span style={{ color: 'white', fontSize: '13px', fontWeight: '500' }}>
              {totalCards.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Search Row */}
      <div style={{ 
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '12px 32px',
        position: 'sticky',
        top: '0',
        zIndex: 40,
        background: '#0a0a14',
        marginBottom: '24px'
      }}>
        <div style={{ 
          maxWidth: '1400px', 
          margin: '0 auto',
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
          background: '#11111e',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '14px',
          padding: '10px 16px'
        }}>
          <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', left: '12px', zIndex: 1 }}>
              <MagnifyingGlassIcon />
            </span>
            <input
              type="text"
              placeholder="Search cards by name or number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  setCurrentPage(1);
                  fetchCards(searchQuery, sortBy, selectedSet, 1);
                }
              }}
              style={{
                width: '100%',
                flex: 1,
                padding: '10px 12px 10px 36px',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'white',
                fontSize: '14px'
              }}
            />
          </div>

          <select 
            value={selectedSet} 
            onChange={(e) => { setSelectedSet(e.target.value); setCurrentPage(1); }}
            style={{
              background: '#181828',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              padding: '8px 14px',
              color: '#9090a8',
              fontSize: '13px',
              minWidth: '140px',
              cursor: 'pointer'
            }}
          >
            <option value="">All Sets</option>
            {sets.map(set => (
              <option key={set.code} value={set.code}>{set.name}</option>
            ))}
          </select>

          <select 
            value={sortBy} 
            onChange={(e) => { setSortBy(e.target.value as SortOption); setCurrentPage(1); }}
            style={{
              background: '#181828',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              padding: '8px 14px',
              color: '#9090a8',
              fontSize: '13px',
              minWidth: '140px',
              cursor: 'pointer'
            }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Name A→Z</option>
            <option value="price-desc">Price High→Low</option>
            <option value="price-asc">Price Low→High</option>
          </select>

          <button
            onClick={() => { setCurrentPage(1); fetchCards(searchQuery, sortBy, selectedSet, 1); }}
            style={{
              background: '#ef4444',
              color: 'white',
              fontWeight: '700',
              borderRadius: '10px',
              padding: '8px 20px',
              border: 'none',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#dc2626'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#ef4444'}
          >
            Search
          </button>
        </div>
      </div>

      {/* Results */}
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto', 
        padding: '24px 32px'
      }}>
        {loading ? (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(5, 1fr)', 
            gap: '16px' 
          }}>
            {[...Array(10)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <div style={{ 
            background: '#11111e', 
            padding: '32px', 
            textAlign: 'center', 
            color: '#ef4444',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.06)'
          }}>
            {error}
          </div>
        ) : cards.length === 0 ? (
          <div style={{ 
            background: '#11111e', 
            padding: '32px', 
            textAlign: 'center', 
            color: '#9090a8',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.06)'
          }}>
            No results found.
          </div>
        ) : (
          <>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(5, 1fr)', 
              gap: '16px' 
            }}>
              {cards.map((card) => {
                const normalizedRarity = normalizeRarity(card.rarity);
                const rarityColor = getRarityColor(normalizedRarity);
                return (
                  <Link 
                    key={card.id}
                    href={`/marketplace/${card.id}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <div
                      style={{
                        background: '#11111e',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        transition: 'transform 0.22s cubic-bezier(.22,1,.36,1), box-shadow 0.22s, border-color 0.22s'
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-6px)';
                        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 20px 48px rgba(139,92,246,0.15), 0 8px 16px rgba(0,0,0,0.5)';
                        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(139,92,246,0.5)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.transform = '';
                        (e.currentTarget as HTMLDivElement).style.boxShadow = '';
                        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.08)';
                      }}
                    >
                      <div style={{
                        width: '100%',
                        aspectRatio: '3/4',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#1a2332'
                      }}>
                        {card.imageUrl ? (
                          <img
                            src={card.imageUrl}
                            alt={card.name}
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              objectFit: 'cover',
                              transition: 'transform 0.3s'
                            }}
                          />
                        ) : (
                          <span style={{ color: '#40404e', fontSize: '12px' }}>No Image</span>
                        )}
                      </div>
                      <div style={{ background: '#13131f', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '10px 12px 13px' }}>
                        <h3 style={{ 
                          fontSize: '13px', 
                          fontWeight: '700', 
                          color: 'white',
                          marginBottom: '3px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          margin: 0
                        }}>
                          {card.name}
                        </h3>
                        <p style={{ 
                          fontSize: '11px', 
                          color: '#40404e',
                          marginBottom: '8px',
                          margin: 0
                        }}>
                          {card.setName}
                        </p>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          marginTop: '8px'
                        }}>
                          <span style={{ 
                            fontSize: '9px', 
                            fontWeight: '700', 
                            letterSpacing: '0.8px',
                            textTransform: 'uppercase',
                            color: rarityColor,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <RarityDot color={rarityColor} />
                            {normalizedRarity || 'Unknown'}
                          </span>
                          {card.currentPrice && (
                            <span style={{ 
                              fontSize: '14px', 
                              fontWeight: '800', 
                              color: '#f0c040'
                            }}>
                              ${card.currentPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            <div style={{ 
              marginTop: '48px', 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px'
            }}>
              <p style={{ color: '#9090a8', fontSize: '14px', margin: 0 }}>
                Showing {startNum.toLocaleString()}–{endNum.toLocaleString()} of {totalCards.toLocaleString()} cards
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    color: '#9090a8',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    opacity: currentPage === 1 ? 0.5 : 1
                  }}
                >
                  ← Previous
                </button>
                <span style={{ 
                  background: '#e63946', 
                  color: 'white', 
                  fontWeight: '700',
                  padding: '8px 16px',
                  borderRadius: '8px'
                }}>
                  {currentPage}
                </span>
                <button 
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={endNum >= totalCards}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    color: '#9090a8',
                    cursor: endNum >= totalCards ? 'not-allowed' : 'pointer',
                    opacity: endNum >= totalCards ? 0.5 : 1
                  }}
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
