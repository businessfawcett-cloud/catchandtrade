'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

interface WatchlistItem {
  id: string;
  cardId: string;
  addedAt: string;
  card: {
    id: string;
    name: string;
    setName: string;
    setCode: string;
    cardNumber: string;
    imageUrl: string | null;
  };
  currentPrice: number | null;
}

export default function WatchlistPage() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token) {
      window.location.href = '/login';
      return;
    }
    
    if (userData) {
      setUser(JSON.parse(userData));
    }
    
    fetchWatchlist(token);
  }, []);

  const fetchWatchlist = async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/api/watchlist`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch watchlist');
      }
      
      const data = await response.json();
      setItems(data);
    } catch (err) {
      setError('Failed to load watchlist');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (cardId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    setRemoving(cardId);
    
    try {
      const response = await fetch(`${API_URL}/api/watchlist/${cardId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setItems(items.filter(item => item.cardId !== cardId));
      }
    } catch (err) {
      console.error('Failed to remove from watchlist');
    } finally {
      setRemoving(null);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1529 50%, #0f1a2e 100%)',
        padding: '2rem'
      }}>
        <div style={{ color: '#94a3b8', textAlign: 'center' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1529 50%, #0f1a2e 100%)',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <Link href="/marketplace" style={{ color: '#ffd700', textDecoration: 'none', display: 'inline-block', marginBottom: '1rem' }}>
            ← Back to Marketplace
          </Link>
          <h1 style={{ color: 'white', fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
            My Watchlist
          </h1>
          <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>
            {items.length} card{items.length !== 1 ? 's' : ''} being watched
          </p>
        </div>
        
        {error && (
          <div style={{ 
            padding: '1rem', 
            background: 'rgba(239, 68, 68, 0.2)', 
            border: '1px solid rgba(239, 68, 68, 0.5)', 
            borderRadius: '8px',
            color: '#ef4444',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}
        
        {items.length === 0 ? (
          <div style={{ 
            padding: '3rem', 
            background: 'rgba(255,255,255,0.05)', 
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>
              Your watchlist is empty
            </p>
            <Link 
              href="/marketplace" 
              style={{ 
                color: '#e63946', 
                textDecoration: 'none',
                fontWeight: 'bold'
              }}
            >
              Browse marketplace →
            </Link>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
            gap: '1rem' 
          }}>
            {items.map((item) => (
              <div 
                key={item.id}
                style={{ 
                  background: '#111827', 
                  borderRadius: '12px', 
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
              >
                <Link href={`/marketplace/${item.card.id}`}>
                  <div style={{ 
                    aspectRatio: '3/4', 
                    background: 'linear-gradient(135deg, #1a2332, #0a0f1e)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem'
                  }}>
                    {item.card.imageUrl ? (
                      <img 
                        src={item.card.imageUrl} 
                        alt={item.card.name}
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                      />
                    ) : (
                      <span style={{ color: '#94a3b8' }}>No Image</span>
                    )}
                  </div>
                </Link>
                
                <div style={{ padding: '1rem' }}>
                  <h3 style={{ color: 'white', fontSize: '1rem', fontWeight: 'bold', margin: 0, marginBottom: '0.25rem' }}>
                    {item.card.name}
                  </h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>
                    {item.card.setName} #{item.card.cardNumber}
                  </p>
                  {item.currentPrice && (
                    <p style={{ color: '#ffd700', fontWeight: 'bold', marginTop: '0.5rem' }}>
                      ${item.currentPrice.toFixed(2)}
                    </p>
                  )}
                  
                  <button
                    onClick={() => handleRemove(item.cardId)}
                    disabled={removing === item.cardId}
                    style={{
                      width: '100%',
                      marginTop: '0.75rem',
                      padding: '0.5rem',
                      background: 'transparent',
                      border: '1px solid #ef4444',
                      borderRadius: '6px',
                      color: '#ef4444',
                      cursor: removing === item.cardId ? 'not-allowed' : 'pointer',
                      opacity: removing === item.cardId ? 0.5 : 1,
                      transition: 'all 0.2s'
                    }}
                  >
                    {removing === item.cardId ? 'Removing...' : 'Remove'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
