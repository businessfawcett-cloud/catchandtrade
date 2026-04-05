'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import PriceHistoryChart from '@/components/PriceHistoryChart';
import GradingCalculator from '@/components/GradingCalculator';
import { GRADE_MULTIPLIERS } from '@/lib/constants';
import type { Grade, GradingService } from '@/lib/constants';

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
  const [cardFormat, setCardFormat] = useState<'RAW' | 'GRADED'>('RAW');
  const [gradingService, setGradingService] = useState<GradingService>('PSA');
  const [gradeValue, setGradeValue] = useState<Grade>(10);
  const [adding, setAdding] = useState(false);
  const [inPortfolioItem, setInPortfolioItem] = useState<{portfolioId: string, itemId: string} | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showRemoveModal, setShowRemoveModal] = useState(false);
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

  useEffect(() => {
    if (!card) return;
    
    const checkPortfolio = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await fetch(`${API_URL}/api/portfolios`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          const portfolios = Array.isArray(data) ? data : [];
          
          for (const portfolio of portfolios) {
            // Check if portfolio has items, otherwise skip
            if (!portfolio.items) continue;
            const existingItem = portfolio.items.find((item: any) => item.cardId === cardId);
            if (existingItem) {
              setInPortfolioItem({ portfolioId: portfolio.id, itemId: existingItem.id });
              return;
            }
          }
        }
      } catch (err) {
        console.error('Failed to check portfolio:', err);
      }
    };

    checkPortfolio();
  }, [card]);

  const getAffiliateLinks = () => {
    if (!card) return { amazon: '#', ebay: '#' };
    const searchTerm = `${card.name} ${(card as any).setname} ${(card as any).cardnumber} Pokemon Card`;
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
      sessionStorage.setItem('returnUrl', window.location.pathname);
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
        sessionStorage.setItem('returnUrl', window.location.pathname);
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
      sessionStorage.setItem('returnUrl', window.location.pathname);
      window.location.href = '/login';
      return;
    }

    setAdding(true);
    try {
      const isGraded = cardFormat === 'GRADED';
      const liveValuationOverride = isGraded
        ? gradedValuePreview != null
          ? Math.round(gradedValuePreview * 100) / 100
          : undefined
        : undefined;

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
          purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
          isGraded,
          gradingService: isGraded ? gradingService : undefined,
          gradeValue: isGraded ? gradeValue : undefined,
          valuationOverride: liveValuationOverride
        })
      });

      if (response.ok) {
        const effectivePrice = liveValuationOverride ?? latestPrice?.priceMarket;
        const priceMsg = effectivePrice ? ` +$${effectivePrice.toFixed(2)}` : '';
        setSuccessMessage(`✓ Added to Portfolio${priceMsg}`);
        setShowModal(false);
        setCondition('NEAR_MINT');
        setQuantity(1);
        setPurchasePrice('');
        setCardFormat('RAW');
        setGradingService('PSA');
        setGradeValue(10);
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

  const handleRemoveFromPortfolio = async () => {
    if (!inPortfolioItem) return;
    setShowRemoveModal(true);
  };

  const confirmRemoveFromPortfolio = async () => {
    if (!inPortfolioItem) return;
    setShowRemoveModal(false);

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(
        `${API_URL}/api/portfolios/${inPortfolioItem.portfolioId}/items/${inPortfolioItem.itemId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.ok) {
        setInPortfolioItem(null);
        setSuccessMessage('✓ Removed from Portfolio');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        alert('Failed to remove card');
      }
    } catch (err) {
      console.error('Remove failed:', err);
      alert('Failed to remove card');
    }
  };

  const handleAddToWatchlist = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      sessionStorage.setItem('returnUrl', window.location.pathname);
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

  // All hooks MUST be called before any conditional returns (React rules of hooks)
  const links = getAffiliateLinks();
  const latestPrice = card?.prices?.[0] ?? null;
  const priceHistory = getPriceHistory();
  const rawMarketPrice = latestPrice?.priceMarket ?? null;
  const gradedValuePreview = useMemo(() => {
    if (cardFormat !== 'GRADED' || rawMarketPrice == null) {
      return null;
    }
    return rawMarketPrice * GRADE_MULTIPLIERS[gradingService][gradeValue];
  }, [cardFormat, rawMarketPrice, gradingService, gradeValue]);
  const unitValuePreview = cardFormat === 'GRADED' && gradedValuePreview != null ? gradedValuePreview : rawMarketPrice;
  const totalValuePreview = unitValuePreview != null ? unitValuePreview * quantity : null;

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
        {(card as any).imageurl ? (
          <img
            src={(card as any).imageurl}
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

          {/* Buttons - Show Add buttons when NOT in portfolio, Remove when in portfolio */}
          {!inPortfolioItem ? (
            <>
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
            </>
          ) : (
            /* Remove from Portfolio Button */
            <button
              onClick={handleRemoveFromPortfolio}
              style={{
                width: '100%',
                padding: '0.875rem',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: 'bold',
                marginTop: '0.75rem'
              }}
            >
              Remove from Portfolio
            </button>
          )}
        </div>

        {/* Right Column - Info & Price */}
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', color: 'white', fontWeight: 'bold' }}>{card.name}</h1>
          <p style={{ color: '#94a3b8', marginBottom: '0.5rem' }}>
            {(card as any).setname} ({(card as any).setcode} #{(card as any).cardnumber})
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

          <GradingCalculator cardId={card.id} cardName={card.name} currentPrice={latestPrice?.priceMarket} />
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
            {card && (card as any).imageurl && (
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <img 
                  src={(card as any).imageurl} 
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
              <label style={{ display: 'block', color: 'white', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Card Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <button
                  onClick={() => setCardFormat('RAW')}
                  style={{
                    padding: '0.6rem',
                    background: cardFormat === 'RAW' ? '#e63946' : 'rgba(255,255,255,0.05)',
                    color: cardFormat === 'RAW' ? 'white' : '#94a3b8',
                    border: cardFormat === 'RAW' ? '1px solid #e63946' : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 700
                  }}
                >
                  Raw
                </button>
                <button
                  onClick={() => setCardFormat('GRADED')}
                  style={{
                    padding: '0.6rem',
                    background: cardFormat === 'GRADED' ? '#e63946' : 'rgba(255,255,255,0.05)',
                    color: cardFormat === 'GRADED' ? 'white' : '#94a3b8',
                    border: cardFormat === 'GRADED' ? '1px solid #e63946' : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 700
                  }}
                >
                  Graded
                </button>
              </div>
            </div>

            {cardFormat === 'GRADED' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', color: 'white', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Service</label>
                  <select
                    value={gradingService}
                    onChange={(e) => setGradingService(e.target.value as GradingService)}
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
                    {Object.keys(GRADE_MULTIPLIERS).map((service) => (
                      <option key={service} value={service} style={{ background: '#0a0f1e' }}>
                        {service}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', color: 'white', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Grade</label>
                  <select
                    value={gradeValue}
                    onChange={(e) => setGradeValue(Number(e.target.value) as Grade)}
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
                    {[10, 9, 8, 7, 6].map((grade) => (
                      <option key={grade} value={grade} style={{ background: '#0a0f1e' }}>
                        {grade}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {cardFormat === 'RAW' && (
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
            )}

            <div
              style={{
                marginBottom: '1rem',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid rgba(255,215,0,0.3)',
                background: 'linear-gradient(135deg, rgba(255,215,0,0.1), rgba(245,158,11,0.08))'
              }}
            >
              <div style={{ color: '#fcd34d', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                Live Value Preview
              </div>
              <div style={{ color: 'white', fontSize: '0.9rem' }}>
                {unitValuePreview == null ? (
                  'No market price available yet'
                ) : (
                  <>
                    ${unitValuePreview.toFixed(2)} each
                    {totalValuePreview != null && quantity > 1 ? ` • $${totalValuePreview.toFixed(2)} total` : ''}
                    {cardFormat === 'GRADED' ? ` (${gradingService} ${gradeValue})` : ''}
                  </>
                )}
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

      {/* Remove from Portfolio Confirmation Modal */}
      {showRemoveModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#1a2332',
            padding: '2rem',
            borderRadius: '16px',
            maxWidth: '400px',
            width: '90%',
            border: '1px solid rgba(230, 57, 70, 0.3)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: 'rgba(230, 57, 70, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#e63946" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
            </div>
            
            <h3 style={{ color: 'white', marginTop: 0, marginBottom: '0.5rem', fontSize: '1.25rem' }}>
              Remove from Portfolio?
            </h3>
            <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
              Are you sure you want to remove <strong style={{ color: 'white' }}>{card?.name}</strong> from your portfolio?
            </p>
            
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setShowRemoveModal(false)}
                style={{
                  flex: 1,
                  padding: '0.875rem',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmRemoveFromPortfolio}
                style={{
                  flex: 1,
                  padding: '0.875rem',
                  background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
