'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

const containerStyle: React.CSSProperties = {
  background: '#0a0f1e',
  minHeight: '100vh',
  padding: '2rem'
};

const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '16px',
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

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
  gap: '1rem',
  marginTop: '1rem'
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

interface PortfolioItem {
  id: string;
  quantity: number;
  condition: string;
  isGraded: boolean;
  gradeCompany: string | null;
  gradeValue: number | null;
  purchasePrice: number | null;
  card: Card;
}

interface Portfolio {
  id: string;
  name: string;
  items: PortfolioItem[];
}

const PokeballDecorative = () => (
  <svg width="120" height="120" viewBox="0 0 100 100" style={{ opacity: 0.15 }}>
    <circle cx="50" cy="50" r="45" fill="#e63946" stroke="#0a0f1e" strokeWidth="4" />
    <rect x="4" y="46" width="92" height="8" fill="#0a0f1e" />
    <circle cx="50" cy="50" r="14" fill="#ffffff" stroke="#0a0f1e" strokeWidth="4" />
    <circle cx="50" cy="50" r="6" fill="#0a0f1e" />
  </svg>
);

export default function PortfolioPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Card[]>([]);
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

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
      fetchPortfolios();
    }
    setLoading(false);
  }, [fetchPortfolios]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`${API_URL}/api/cards/search?q=${encodeURIComponent(searchQuery)}`);
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data.results || []);
        }
      } catch (err) {
        console.error('Search failed:', err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleAddToPortfolio = async () => {
    if (!selectedCard) return;

    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    const portfolioId = selectedPortfolio || portfolios[0]?.id;
    if (!portfolioId) {
      alert('No portfolio found');
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
        setSuccessMessage('Added to Portfolio!');
        setShowModal(false);
        setSelectedCard(null);
        setSearchQuery('');
        setSearchResults([]);
        setCondition('NEAR_MINT');
        setQuantity(1);
        setPurchasePrice('');
        fetchPortfolios();
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

  const currentPortfolio = portfolios.find(p => p.id === selectedPortfolio);

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={{ ...cardStyle, textAlign: 'center', color: 'white' }}>
          Loading...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={containerStyle}>
        <div style={{ ...cardStyle, textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
          <h1 style={{ color: 'white', fontSize: '1.75rem', marginBottom: '1rem' }}>Portfolio</h1>
          <p style={{ color: '#94a3b8' }}>Please <a href="/login" style={{ color: '#e63946' }}>login</a> to view your portfolio.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ color: 'white', fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
              My Portfolio
            </h1>
            <p style={{ color: '#94a3b8', margin: '0.25rem 0 0' }}>Track and manage your collection</p>
          </div>
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
            {successMessage}
          </div>
        )}

        <div style={{ marginBottom: '2rem' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search for a card..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ ...inputStyle, paddingLeft: '2.5rem' }}
            />
            <svg 
              style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', width: '20px', height: '20px' }}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            
            {searchResults.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: '#1a2332',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                maxHeight: '300px',
                overflowY: 'auto',
                zIndex: 1000,
                marginTop: '0.25rem'
              }}>
                {searchResults.map(card => (
                  <div
                    key={card.id}
                    onClick={() => {
                      setSelectedCard(card);
                      setSearchResults([]);
                      setSearchQuery('');
                      setShowModal(true);
                    }}
                    style={{
                      padding: '0.75rem',
                      borderBottom: '1px solid rgba(255,255,255,0.1)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}
                  >
                    {card.imageUrl && (
                      <img src={card.imageUrl} alt={card.name} style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: '4px' }} />
                    )}
                    <div>
                      <div style={{ color: 'white', fontWeight: 'bold' }}>{card.name}</div>
                      <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                        {card.setName} ({card.setCode} #{card.cardNumber})
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {portfolios.length > 1 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <select
              value={selectedPortfolio}
              onChange={(e) => setSelectedPortfolio(e.target.value)}
              style={{ ...inputStyle, width: 'auto', cursor: 'pointer' }}
            >
              {portfolios.map(p => (
                <option key={p.id} value={p.id} style={{ background: '#1a2332' }}>{p.name}</option>
              ))}
            </select>
          </div>
        )}

        {!currentPortfolio?.items || currentPortfolio.items.length === 0 ? (
          <div style={{ ...cardStyle, textAlign: 'center', padding: '3rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <PokeballDecorative />
            </div>
            <h2 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Your portfolio is empty
            </h2>
            <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
              Start adding cards to track your collection!
            </p>
            <Link href="/marketplace" style={{ ...buttonStyle, display: 'inline-block', textDecoration: 'none' }}>
              Browse Marketplace
            </Link>
          </div>
        ) : (
          <div style={gridStyle}>
            {currentPortfolio.items.map(item => (
              <div 
                key={item.id} 
                style={{ 
                  background: 'rgba(255,255,255,0.05)', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: '12px', 
                  overflow: 'hidden'
                }}
              >
                <div style={{ height: '160px', background: '#1a2332', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {item.card.imageUrl ? (
                    <img src={item.card.imageUrl} alt={item.card.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  ) : (
                    <span style={{ color: '#94a3b8' }}>No Image</span>
                  )}
                </div>
                <div style={{ padding: '0.75rem' }}>
                  <h4 style={{ color: 'white', margin: '0 0 0.25rem', fontSize: '0.95rem' }}>{item.card.name}</h4>
                  <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.75rem' }}>
                    {item.card.setName}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                    <span style={{ 
                      background: 'rgba(230,57,70,0.2)', 
                      color: '#e63946', 
                      padding: '0.125rem 0.5rem', 
                      borderRadius: '4px', 
                      fontSize: '0.7rem',
                      textTransform: 'capitalize'
                    }}>
                      {item.condition.replace('_', ' ')}
                    </span>
                    <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>x{item.quantity}</span>
                  </div>
                  {item.purchasePrice && (
                    <p style={{ color: '#ffd700', margin: '0.5rem 0 0', fontSize: '0.85rem', fontWeight: 'bold' }}>
                      ${item.purchasePrice.toFixed(2)}
                    </p>
                  )}
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
