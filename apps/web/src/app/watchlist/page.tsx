'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';

interface Card {
  id: string;
  name: string;
  setName: string;
  setCode: string;
  cardNumber: string;
  rarity: string | null;
  imageUrl: string | null;
  currentPrice?: number | null;
}

interface WishlistItem {
  id: string;
  cardId: string;
  addedAt: string;
  card: Card;
}

const API_URL = typeof window !== 'undefined' ? localStorage.getItem('apiUrl') || 'https://catchandtrade.com/api' : 'https://catchandtrade.com/api';

function getRarityColor(rarity: string | null): string {
  if (!rarity) return '#6b7280';
  const r = rarity.toUpperCase();
  if (r.includes('ILLUSTRATION RARE')) return '#ec4899';
  if (r.includes('ULTRA RARE')) return '#f59e0b';
  if (r.includes('HYPER RARE') || r.includes('SPECIAL ILLUSTRATION')) return '#f0c040';
  if (r === 'RARE') return '#3b82f6';
  if (r === 'UNCOMMON') return '#22c55e';
  if (r === 'COMMON') return '#6b7280';
  return '#6b7280';
}

function getRarityLabel(rarity: string | null): string {
  if (!rarity) return 'Common';
  return rarity;
}

export default function WatchlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Card[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    fetchWatchlist(token);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchWatchlist = async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/watchlist`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch watchlist');
      const data = await response.json();
      setItems(data);
    } catch (err) {
      setError('Failed to load watchlist');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = useCallback((query: string) => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    if (query.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setSearchLoading(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/cards?q=${encodeURIComponent(query)}&limit=5`);
        const data = await res.json();
        setSearchResults(data.cards || []);
        setShowDropdown(true);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  }, []);

  const handleAddCard = async (card: Card) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/wishlist`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ cardId: card.id })
      });
      
      if (res.ok) {
        setItems([{
          id: 'wi-' + Date.now(),
          cardId: card.id,
          addedAt: new Date().toISOString(),
          card: card
        }, ...items]);
        setSearchQuery('');
        setShowDropdown(false);
        setSearchResults([]);
      } else {
        const data = await res.json();
        if (data.error === 'Card already in wishlist') {
          alert('This card is already in your wishlist');
        }
      }
    } catch (err) {
      console.error('Add error:', err);
    }
  };

  const handleRemove = async (cardId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const token = localStorage.getItem('token');
    if (!token) return;

    setRemoving(cardId);
    try {
      const res = await fetch(`${API_URL}/wishlist?cardId=${cardId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setItems(items.filter(item => item.cardId !== cardId));
      }
    } catch (err) {
      console.error('Failed to remove:', err);
    } finally {
      setRemoving(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const totalValue = items.reduce((sum, item) => sum + (item.card.currentPrice || 0), 0);
  const mostExpensive = items.reduce((max, item) => 
    (!max || (item.card.currentPrice || 0) > (max.card.currentPrice || 0) ? item : max), null as WishlistItem | null);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#07070f', padding: '40px 24px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '52px', color: 'white', letterSpacing: '2px', marginBottom: '8px' }}>
            WATCHLIST
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginTop: '40px' }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{ background: '#11111e', borderRadius: '16px', height: '280px', animation: 'pulse 1.5s infinite' }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#07070f', padding: '40px 24px' }}>
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @font-face { font-family: 'Bebas Neue'; src: url('https://fonts.gstatic.com/s/bebasneue/v14/JTUSjIg69CK48gW7PXoo9WlhyyTh89Y.woff2') format('woff2'); }
      `}</style>
      
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* HEADER */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '52px', color: 'white', letterSpacing: '2px', margin: 0 }}>
            WATCHLIST
          </h1>
          <p style={{ fontSize: '13px', color: '#9090a8', marginTop: '4px' }}>Cards you want to track and acquire</p>
        </div>

        {/* SEARCH */}
        <div ref={dropdownRef} style={{ marginBottom: '28px', position: 'relative' }}>
          <div style={{ 
            background: '#11111e', 
            border: '1px solid rgba(255,255,255,0.07)', 
            borderRadius: '14px', 
            padding: '10px 16px', 
            display: 'flex', 
            gap: '10px',
            alignItems: 'center'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#40404e" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); handleSearch(e.target.value); }}
              onKeyDown={handleKeyDown}
              placeholder="Search for a card to add to your watchlist..."
              style={{ 
                flex: 1, 
                background: 'transparent', 
                border: 'none', 
                color: 'white', 
                fontSize: '14px',
                outline: 'none',
                fontFamily: 'DM Sans, sans-serif'
              }}
            />
          </div>

          {/* DROPDOWN */}
          {showDropdown && (
            <div style={{ 
              position: 'absolute', 
              top: '100%', 
              left: 0, 
              right: 0, 
              marginTop: '8px',
              background: '#11111e', 
              border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: '10px',
              overflow: 'hidden',
              zIndex: 100,
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
            }}>
              {searchLoading ? (
                <div style={{ padding: '16px', textAlign: 'center', color: '#40404e', fontSize: '13px' }}>Searching...</div>
              ) : searchResults.length > 0 ? (
                searchResults.map(card => (
                  <div
                    key={card.id}
                    onClick={() => handleAddCard(card)}
                    style={{ 
                      padding: '12px 16px', 
                      display: 'flex', 
                      gap: '12px', 
                      alignItems: 'center',
                      cursor: 'pointer',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {card.imageUrl && (
                      <img src={card.imageUrl} alt="" style={{ width: '32px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ color: 'white', fontSize: '13px', fontWeight: 600 }}>{card.name}</div>
                      <div style={{ color: '#40404e', fontSize: '11px' }}>{card.setName} #{card.cardNumber}</div>
                    </div>
                    {card.currentPrice && (
                      <div style={{ color: '#f0c040', fontSize: '13px', fontWeight: 600 }}>${card.currentPrice.toFixed(2)}</div>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ padding: '16px', textAlign: 'center', color: '#40404e', fontSize: '13px' }}>No cards found</div>
              )}
            </div>
          )}
        </div>

        {/* STATS ROW */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '32px' }}>
          <div style={{ 
            background: 'rgba(255,255,255,0.03)', 
            border: '1px solid rgba(255,255,255,0.055)', 
            borderRadius: '12px', 
            padding: '14px 16px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: '#8b5cf6' }} />
            <div style={{ color: '#8b5cf6', fontSize: '11px', fontWeight: 600, letterSpacing: '1px', marginBottom: '4px' }}>WATCHING</div>
            <div style={{ color: 'white', fontSize: '24px', fontWeight: 700 }}>{items.length}</div>
          </div>
          
          <div style={{ 
            background: 'rgba(255,255,255,0.03)', 
            border: '1px solid rgba(255,255,255,0.055)', 
            borderRadius: '12px', 
            padding: '14px 16px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: '#f0c040' }} />
            <div style={{ color: '#f0c040', fontSize: '11px', fontWeight: 600, letterSpacing: '1px', marginBottom: '4px' }}>TOTAL VALUE</div>
            <div style={{ color: '#f0c040', fontSize: '24px', fontWeight: 700 }}>${totalValue.toFixed(2)}</div>
          </div>
          
          <div style={{ 
            background: 'rgba(255,255,255,0.03)', 
            border: '1px solid rgba(255,255,255,0.055)', 
            borderRadius: '12px', 
            padding: '14px 16px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: '#ef4444' }} />
            <div style={{ color: '#ef4444', fontSize: '11px', fontWeight: 600, letterSpacing: '1px', marginBottom: '4px' }}>MOST EXPENSIVE</div>
            <div style={{ color: 'white', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {mostExpensive ? mostExpensive.card.name : '-'}
            </div>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.5)', borderRadius: '8px', color: '#ef4444', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {/* EMPTY STATE */}
        {items.length === 0 ? (
          <div style={{ padding: '80px', textAlign: 'center' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.5" style={{ opacity: 0.3 }}>
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'white', marginTop: '20px' }}>Your watchlist is empty</div>
            <div style={{ fontSize: '13px', color: '#40404e', marginTop: '8px' }}>Search for cards above to start tracking their prices</div>
          </div>
        ) : (
          /* CARD GRID */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
            {items.map(item => (
              <Link 
                key={item.id} 
                href={`/marketplace/${item.card.id}`}
                style={{ 
                  textDecoration: 'none',
                  position: 'relative'
                }}
              >
                <div style={{ 
                  background: '#11111e', 
                  border: '1px solid rgba(255,255,255,0.06)', 
                  borderRadius: '16px', 
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'transform 0.22s, box-shadow 0.22s, border-color 0.22s'
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 16px 40px rgba(139,92,246,0.15)';
                    e.currentTarget.style.borderColor = 'rgba(139,92,246,0.28)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                  }}
                >
                  {/* REMOVE BUTTON */}
                  <button
                    onClick={(e) => handleRemove(item.cardId, e)}
                    disabled={removing === item.cardId}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: 'rgba(0,0,0,0.65)',
                      backdropFilter: 'blur(4px)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: removing === item.cardId ? 'not-allowed' : 'pointer',
                      zIndex: 10,
                      opacity: removing === item.cardId ? 0.5 : 1,
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={(e) => {
                      if (removing !== item.cardId) e.currentTarget.style.background = 'rgba(239,68,68,0.25)';
                    }}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.65)'}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>

                  {/* IMAGE */}
                  <div style={{ width: '100%', aspectRatio: '3/4', overflow: 'hidden', background: '#0d0d18' }}>
                    {item.card.imageUrl ? (
                      <img 
                        src={item.card.imageUrl} 
                        alt={item.card.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.04)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#40404e' }}>
                        No Image
                      </div>
                    )}
                  </div>

                  {/* CARD BODY */}
                  <div style={{ background: '#13131f', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '10px 12px 13px' }}>
                    <div style={{ color: 'white', fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.card.name}
                    </div>
                    <div style={{ color: '#40404e', fontSize: '11px', marginBottom: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.card.setName}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: getRarityColor(item.card.rarity) }} />
                        <span style={{ color: getRarityColor(item.card.rarity), fontSize: '10px', textTransform: 'uppercase' }}>
                          {getRarityLabel(item.card.rarity)}
                        </span>
                      </div>
                      <span style={{ color: '#f0c040', fontSize: '13px', fontWeight: 700 }}>
                        ${(item.card.currentPrice || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}