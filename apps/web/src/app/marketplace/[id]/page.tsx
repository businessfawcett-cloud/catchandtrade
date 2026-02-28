'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import PriceHistoryChart from '@/components/PriceHistoryChart';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

interface CardPrice {
  id: string;
  date: string;
  priceLow: number | null;
  priceMid: number | null;
  priceHigh: number | null;
  priceMarket: number | null;
  ebayBuyNowLow: number | null;
  lastUpdated: string | null;
  listingCount: number;
}

interface Card {
  id: string;
  name: string;
  supertype: string | null;
  setName: string;
  setCode: string;
  cardNumber: string;
  rarity: string | null;
  imageUrl: string | null;
  gameType: string;
  language: string;
  prices: CardPrice[];
}

export default function CardDetailPage({ params }: { params: { id: string } }) {
  const cardId = params.id;
  
  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<'30d' | '90d' | '1y'>('30d');
  const [showModal, setShowModal] = useState(false);
  const [portfolios, setPortfolios] = useState<{id: string, name: string}[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState('');
  const [condition, setCondition] = useState('NEAR_MINT');
  const [quantity, setQuantity] = useState(1);
  const [purchasePrice, setPurchasePrice] = useState('');
  const [adding, setAdding] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    const fetchCard = async () => {
      try {
        const response = await fetch(`${API_URL}/api/cards/${cardId}`);
        if (!response.ok) {
          const data = await response.json();
          setError(data.error || 'Failed to load card');
          return;
        }
        const data = await response.json();
        setCard(data);
      } catch (err) {
        setError('Failed to load card');
      } finally {
        setLoading(false);
      }
    };

    fetchCard();
  }, [cardId]);

  const getAffiliateLinks = () => {
    if (!card) return { amazon: '#', ebay: '#' };
    const searchTerm = `${card.name} ${card.setName} ${card.cardNumber} Pokemon Card`;
    const searchTermEncoded = encodeURIComponent(searchTerm);
    const amazonTag = process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG || 'catchandtrade-20';
    return {
      amazon: `https://www.amazon.com/s?k=${searchTermEncoded}&tag=${amazonTag}`,
      ebay: `https://www.ebay.com/sch/i.html?_nkw=${searchTermEncoded}&mkcid=1&mkrid=711-53200-19255-0&siteid=0&campid=5339143267&customid=&toolid=10001&mkevt=1`
    };
  };

  const handleAddToPortfolioClick = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/portfolios`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPortfolios(data);
        if (data.length > 0) {
          setSelectedPortfolio(data[0].id);
        }
        setShowModal(true);
      } else if (response.status === 401) {
        window.location.href = '/login';
      }
    } catch (err) {
      console.error('Failed to fetch portfolios:', err);
    }
  };

  const handleAddToPortfolio = async () => {
    if (!selectedPortfolio || !card) return;

    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    setAdding(true);
    try {
      const response = await fetch(`${API_URL}/api/portfolios/${selectedPortfolio}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          cardId: card.id,
          condition,
          quantity,
          purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined
        })
      });

      if (response.ok) {
        const priceMsg = latestPrice?.priceMarket ? ` +$${latestPrice.priceMarket.toFixed(2)}` : '';
        setSuccessMessage(`✓ Added to Portfolio${priceMsg}`);
        setShowModal(false);
        setCondition('NEAR_MINT');
        setQuantity(1);
        setPurchasePrice('');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        alert('Failed to add card');
      }
    } catch (err) {
      console.error('Add failed:', err);
      alert('Failed to add card');
    } finally {
      setAdding(false);
    }
  };

  const handleAddToWatchlist = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/watchlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ cardId: card?.id })
      });
      
      if (response.ok) {
        setToast({ message: 'Added to watchlist!', type: 'success' });
      } else {
        const data = await response.json();
        setToast({ message: data.error || 'Failed to add to watchlist', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Failed to add to watchlist', type: 'error' });
    }
  };

  const getPriceHistory = () => {
    if (!card?.prices) return [];
    const now = new Date();
    let cutoffDate: Date;
    
    switch (priceRange) {
      case '30d':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
    }
    
    return card.prices
      .filter(p => new Date(p.date) >= cutoffDate)
      .reverse();
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#0a0f1e', 
        padding: '2rem',
        color: 'white'
      }}>
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#0a0f1e', 
        padding: '2rem',
        color: 'white'
      }}>
        <h1>Error</h1>
        <p>{error}</p>
        <a href="/marketplace" style={{ color: '#e63946' }}>Back to Marketplace</a>
      </div>
    );
  }

  if (!card) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#0a0f1e', 
        padding: '2rem',
        color: 'white'
      }}>
        <h1>Card Not Found</h1>
        <a href="/marketplace" style={{ color: '#e63946' }}>Back to Marketplace</a>
      </div>
    );
  }

  const links = getAffiliateLinks();
  const latestPrice = card.prices?.[0];
  const priceHistory = getPriceHistory();
  const maxPrice = Math.max(...priceHistory.map(p => p.priceMarket ?? 0), 1);
  const minPrice = Math.min(...priceHistory.map(p => p.priceMarket ?? 0), 0);

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem', background: '#0a0f1e', minHeight: '100vh' }}>
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          padding: '1rem 1.5rem',
          borderRadius: '8px',
          background: toast.type === 'success' ? '#10b981' : '#ef4444',
          color: 'white',
          fontWeight: 'bold',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 1000,
          animation: 'fadeIn 0.3s ease'
        }}>
          {toast.message}
        </div>
      )}
      
      <a href="/marketplace" style={{ display: 'block', marginBottom: '1rem', color: '#e63946', textDecoration: 'none' }}>
        ← Back to Marketplace
      </a>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: '2.5rem', alignItems: 'start' }}>
        {/* Left Column - Image & Actions */}
        <div>
          {card.imageUrl ? (
            <img
              src={card.imageUrl}
              alt={card.name}
              style={{ width: '100%', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
            />
          ) : (
            <div style={{ 
              width: '100%', 
              height: '350px', 
              backgroundColor: '#1a2332',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '12px',
              fontSize: '1.2rem',
              color: '#94a3b8'
            }}>
              Card Image
            </div>
          )}

          {/* Buy Buttons Row */}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <a
              href={links.amazon}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1,
                padding: '0.6rem',
                backgroundColor: '#ff9900',
                color: 'white',
                textAlign: 'center',
                borderRadius: '4px',
                textDecoration: 'none',
                fontSize: '0.85rem'
              }}
            >
              Amazon
            </a>
            <a
              href={links.ebay}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1,
                padding: '0.6rem',
                backgroundColor: '#0064d2',
                color: 'white',
                textAlign: 'center',
                borderRadius: '4px',
                textDecoration: 'none',
                fontSize: '0.85rem'
              }}
            >
              eBay
            </a>
          </div>

          {/* Add to Portfolio Button - Red */}
          <button
            onClick={handleAddToPortfolioClick}
            style={{
              width: '100%',
              padding: '0.875rem',
              backgroundColor: '#e63946',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: 'bold',
              marginTop: '0.75rem'
            }}
          >
            Add to Portfolio
          </button>

          {/* Add to Watchlist Button - Gold Outlined */}
          <button
            onClick={handleAddToWatchlist}
            style={{
              width: '100%',
              padding: '0.875rem',
              backgroundColor: 'transparent',
              color: '#ffd700',
              border: '2px solid #ffd700',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: 'bold',
              marginTop: '0.5rem'
            }}
          >
            Add to Watchlist
          </button>
        </div>

        {/* Right Column - Info & Price */}
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', color: 'white', fontWeight: 'bold' }}>{card.name}</h1>
          <p style={{ color: '#94a3b8', marginBottom: '0.5rem' }}>
            {card.setName} ({card.setCode} #{card.cardNumber})
          </p>
          
          {card.rarity && (
            <p style={{ marginBottom: '0.5rem', color: '#a855f7', fontWeight: '600' }}>Rarity: {card.rarity}</p>
          )}
          
          <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: '#94a3b8' }}>
            {(() => {
              const supertype = card.supertype || (card.name.toLowerCase().includes('trainer') ? 'Trainer' : card.name.toLowerCase().includes('energy') ? 'Energy' : 'Pokémon');
              if (supertype === 'Pokémon') return 'POKÉMON';
              if (supertype === 'Trainer') return 'TRAINER CARD';
              if (supertype === 'Energy') return 'ENERGY CARD';
              return `${supertype.toUpperCase()} • ${card.language}`;
            })()}
          </p>

          {latestPrice && latestPrice.priceMarket != null ? (
            <div style={{ marginTop: '1.5rem' }}>
              <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Current Market Price</p>
              <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0, color: '#ffd700' }}>
                ${latestPrice.priceMarket.toFixed(2)}
              </p>
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem', fontSize: '0.9rem', color: '#94a3b8' }}>
                {latestPrice.priceLow != null && <span>Low: ${latestPrice.priceLow.toFixed(2)}</span>}
                {latestPrice.priceMid != null && <span>Mid: ${latestPrice.priceMid.toFixed(2)}</span>}
                {latestPrice.priceHigh != null && <span>High: ${latestPrice.priceHigh.toFixed(2)}</span>}
              </div>
              {latestPrice.ebayBuyNowLow != null && (
                <p style={{ marginTop: '0.75rem', fontSize: '1rem', color: '#10b981', fontWeight: '600' }}>
                  Buy Now From: ${latestPrice.ebayBuyNowLow.toFixed(2)}
                </p>
              )}
            </div>
          ) : (
            <div style={{ marginTop: '1.5rem' }}>
              <p style={{ fontSize: '1rem', color: '#94a3b8' }}>No market data available</p>
            </div>
          )}

          {latestPrice && latestPrice.priceMarket != null && (
            <div style={{ marginTop: '1.5rem' }}>
              <PriceHistoryChart cardId={card.id} currentPrice={latestPrice.priceMarket} />
            </div>
          )}
        </div>
      </div>

      {successMessage && (
        <div style={{ 
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          color: '#22c55e',
          padding: '1rem',
          borderRadius: '8px',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          zIndex: 100
        }}>
          {successMessage.includes('+') ? (
            <>
              ✓ Added to Portfolio <span style={{ color: '#10b981' }}>{successMessage.split('✓ Added to Portfolio')[1]}</span>
            </>
          ) : (
            successMessage
          )}
        </div>
      )}

      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div style={{
            backgroundColor: '#1a2332',
            padding: '1.5rem',
            borderRadius: '12px',
            maxWidth: '450px',
            width: '90%',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            {card?.imageUrl && (
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <img 
                  src={card.imageUrl} 
                  alt={card.name} 
                  style={{ maxHeight: '120px', objectFit: 'contain', borderRadius: '8px' }}
                />
              </div>
            )}
            
            <h3 style={{ color: 'white', marginTop: 0, marginBottom: '0.5rem', textAlign: 'center' }}>Add to Portfolio</h3>
            <p style={{ color: '#94a3b8', textAlign: 'center', marginBottom: '1.5rem' }}>{card?.name}</p>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: 'white', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Portfolio</label>
              <select
                value={selectedPortfolio}
                onChange={(e) => setSelectedPortfolio(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  background: '#0a0f1e', 
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                {portfolios.map(p => (
                  <option key={p.id} value={p.id} style={{ background: '#0a0f1e' }}>{p.name}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: 'white', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Condition</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {['MINT', 'NEAR_MINT', 'LIGHTLY_PLAYED', 'MODERATELY_PLAYED', 'HEAVILY_PLAYED', 'DAMAGED'].map((cond) => (
                  <button
                    key={cond}
                    onClick={() => setCondition(cond)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      background: condition === cond ? '#e63946' : 'rgba(255,255,255,0.05)',
                      color: condition === cond ? 'white' : '#94a3b8',
                      border: condition === cond ? '1px solid #e63946' : '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      transition: 'all 0.2s'
                    }}
                  >
                    {cond.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', color: 'white', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Quantity</label>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    background: '#0a0f1e', 
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: 'white', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Price (opt)</label>
                <input
                  type="number"
                  step="0.01"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  placeholder="0.00"
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    background: '#0a0f1e', 
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddToPortfolio}
                disabled={adding || !selectedPortfolio}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: adding || !selectedPortfolio ? '#666' : 'linear-gradient(135deg, #e63946, #c1121f)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: adding || !selectedPortfolio ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {adding ? 'Adding...' : 'Add to Portfolio'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
