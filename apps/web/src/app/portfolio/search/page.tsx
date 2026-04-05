'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

const containerStyle: React.CSSProperties = {
  background: '#0a0f1e',
  minHeight: '100vh',
  padding: '2rem'
};

const inputStyle: React.CSSProperties = {
  background: '#1a2332',
  border: '1px solid rgba(255,255,255,0.1)',
  color: 'white',
  padding: '0.75rem',
  borderRadius: '8px',
  width: '100%',
  fontSize: '1rem',
  boxSizing: 'border-box'
};

const buttonStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #e63946, #c1121f)',
  color: 'white',
  border: 'none',
  padding: '0.75rem 1.5rem',
  borderRadius: '8px',
  fontSize: '0.9rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'opacity 0.2s'
};

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

interface Portfolio {
  id: string;
  name: string;
}

function PortfolioSearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams?.get('q') || '';
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<Card[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [condition, setCondition] = useState('NEAR_MINT');
  const [quantity, setQuantity] = useState(1);
  const [purchasePrice, setPurchasePrice] = useState('');
  const [adding, setAdding] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const fetchPortfolios = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/portfolios`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPortfolios(data);
        if (data.length > 0 && !selectedPortfolio) {
          setSelectedPortfolio(data[0].id);
        }
      } else if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    } catch (err) {
      console.error('Failed to fetch portfolios:', err);
    }
  }, [selectedPortfolio]);

  const fetchCards = useCallback(async () => {
    setLoading(true);
    try {
       const response = await fetch(`${API_URL}/api/cards?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setCards(data.results || []);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    console.log('Portfolio search auth check:', { token: !!token, userData: !!userData });
    
    if (token && userData) {
      try {
        const parsed = JSON.parse(userData);
        setUser(parsed);
        console.log('User set:', parsed);
        fetchPortfolios();
      } catch (e) {
        console.error('Failed to parse user data:', e);
      }
    }
    fetchCards();
  }, [fetchPortfolios, fetchCards]);

  const handleAddToPortfolio = async () => {
    if (!selectedCard) return;

    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    const portfolioId = selectedPortfolio || portfolios[0]?.id;
    if (!portfolioId) {
      alert('No portfolio found. Please create a portfolio first.');
      return;
    }

    setAdding(true);
    try {
      const response = await fetch(`${API_URL}/api/portfolios/${portfolioId}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          cardId: selectedCard.id,
          condition,
          quantity: quantity,
          purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined
        })
      });

      if (response.ok) {
        const priceMsg = selectedCard.currentPrice ? ` +$${selectedCard.currentPrice.toFixed(2)}` : '';
        setSuccessMessage(`✓ Added to Portfolio${priceMsg}`);
        setShowModal(false);
        setSelectedCard(null);
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

  if (!user) {
    return (
      <div style={containerStyle}>
        <div style={{ 
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          padding: '2rem',
          textAlign: 'center',
          maxWidth: '500px',
          margin: '0 auto'
        }}>
          <h1 style={{ color: 'white', fontSize: '1.75rem', marginBottom: '1rem' }}>Search Cards</h1>
          <p style={{ color: '#94a3b8' }}>Please <a href="/login" style={{ color: '#e63946' }}>login</a> to add cards to your portfolio.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <Link href="/portfolio" style={{ color: '#e63946', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            ← Back to Portfolio
          </Link>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ color: 'white', fontSize: '1.75rem', fontWeight: 'bold', margin: 0 }}>
            Search Results{query ? ` for "${query}"` : ''}
          </h1>
        </div>

        {successMessage && (
          <div style={{ 
            backgroundColor: 'rgba(34, 197, 94, 0.1)', 
            color: '#22c55e', 
            padding: '1rem', 
            borderRadius: '8px',
            marginBottom: '1rem',
            border: '1px solid rgba(34, 197, 94, 0.3)'
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

        {loading ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>Loading...</div>
        ) : cards.length === 0 ? (
          <div style={{ 
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            padding: '3rem',
            textAlign: 'center'
          }}>
            <p style={{ color: '#94a3b8' }}>No results for &quot;{query}&quot;</p>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '1.5rem',
            marginTop: '1rem'
          }}>
            {cards.map((card) => (
              <div 
                key={card.id} 
                style={{ 
                  background: 'rgba(255,255,255,0.05)', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: '12px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div style={{ 
                  height: '180px', 
                  background: '#1a2332',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {card.imageUrl ? (
                    <img 
                      src={card.imageUrl} 
                      alt={card.name}
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <span style={{ color: '#94a3b8' }}>Card Image</span>
                  )}
                </div>
                <div style={{ padding: '0.75rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ color: 'white', margin: '0 0 0.25rem', fontSize: '1rem' }}>{card.name}</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                    {card.setName} ({card.setCode} #{card.cardNumber})
                  </p>
                  {card.rarity && (
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#a855f7' }}>
                      {card.rarity}
                    </p>
                  )}
                  {card.currentPrice && (
                    <p style={{ margin: '0.5rem 0', fontWeight: 'bold', fontSize: '1.1rem', color: '#ffd700' }}>
                      ${card.currentPrice.toFixed(2)}
                    </p>
                  )}
                  <button
                    onClick={() => {
                      setSelectedCard(card);
                      setShowModal(true);
                    }}
                    style={{
                      marginTop: 'auto',
                      padding: '0.5rem',
                      background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '0.85rem'
                    }}
                  >
                    Add to Portfolio
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && selectedCard && (
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
            zIndex: 9999
          }}>
            <div style={{
              background: '#1a2332',
              padding: '2rem',
              borderRadius: '16px',
              maxWidth: '400px',
              width: '90%',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <h3 style={{ color: 'white', margin: '0 0 0.5rem' }}>Add {selectedCard.name} to Portfolio</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '0 0 1.5rem' }}>
                {selectedCard.setName} ({selectedCard.setCode} #{selectedCard.cardNumber})
              </p>

              {portfolios.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', color: 'white', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Portfolio</label>
                  <select
                    value={selectedPortfolio}
                    onChange={(e) => setSelectedPortfolio(e.target.value)}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    {portfolios.map(p => (
                      <option key={p.id} value={p.id} style={{ background: '#1a2332' }}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', color: 'white', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Condition</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <option value="MINT" style={{ background: '#1a2332' }}>Mint</option>
                  <option value="NEAR_MINT" style={{ background: '#1a2332' }}>Near Mint</option>
                  <option value="LIGHTLY_PLAYED" style={{ background: '#1a2332' }}>Lightly Played</option>
                  <option value="MODERATELY_PLAYED" style={{ background: '#1a2332' }}>Moderately Played</option>
                  <option value="HEAVILY_PLAYED" style={{ background: '#1a2332' }}>Heavily Played</option>
                  <option value="DAMAGED" style={{ background: '#1a2332' }}>Damaged</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', color: 'white', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Quantity</label>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', color: 'white', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Purchase Price (optional)</label>
                <input
                  type="number"
                  step="0.01"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  placeholder="0.00"
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddToPortfolio}
                  disabled={adding}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: adding ? '#666' : 'linear-gradient(135deg, #22c55e, #16a34a)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: adding ? 'not-allowed' : 'pointer',
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
    </div>
  );
}

function LoadingFallback() {
  return (
    <div style={{
      background: '#0a0f1e',
      minHeight: '100vh',
      padding: '2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{ color: '#94a3b8' }}>Loading...</div>
    </div>
  );
}

export default function PortfolioSearchPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PortfolioSearchContent />
    </Suspense>
  );
}
