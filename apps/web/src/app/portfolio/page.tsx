'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

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
          console.log('Search results:', data.results);
          setSearchResults(data.results || []);
        }
      } catch (err) {
        console.error('Search failed:', err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleAddToPortfolio = async () => {
    if (!selectedCard) {
      alert('No card selected');
      return;
    }

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
    return <div>Loading...</div>;
  }

  if (!user) {
    return (
      <div>
        <h1>Portfolio</h1>
        <p>Please <a href="/login">login</a> to view your portfolio.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <h1>Welcome, {user.displayName}!</h1>
      
      {successMessage && (
        <div style={{ 
          backgroundColor: '#d4edda', 
          color: '#155724', 
          padding: '1rem', 
          borderRadius: '4px',
          marginBottom: '1rem' 
        }}>
          {successMessage}
        </div>
      )}

      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '0.5rem' }}>Add a card to your portfolio</h3>
        <div style={{ position: 'relative', display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            placeholder="Search for a card..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                router.push(`/portfolio/search?q=${encodeURIComponent(searchQuery)}`);
              }
            }}
            style={{
              flex: 1,
              padding: '0.75rem',
              fontSize: '1rem',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
          <button
            onClick={() => {
              if (searchQuery.trim()) {
                router.push(`/portfolio/search?q=${encodeURIComponent(searchQuery)}`);
              }
            }}
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#0066cc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Search
          </button>
          {searchResults.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: 'white',
              border: '1px solid #ccc',
              borderRadius: '4px',
              maxHeight: '300px',
              overflowY: 'auto',
              zIndex: 1000,
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
              {searchResults.map(card => (
                <div
                  key={card.id}
                  onClick={() => {
                    console.log('Quick add clicked', card, 'selectedPortfolio:', selectedPortfolio);
                    setSelectedCard(card);
                    setSearchResults([]);
                    setSearchQuery('');
                    setShowModal(true);
                  }}
                  style={{
                    padding: '0.75rem',
                    borderBottom: '1px solid #eee',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {card.imageUrl && (
                    <img src={card.imageUrl} alt={card.name} style={{ width: 40, height: 40, objectFit: 'contain' }} />
                  )}
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{card.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>
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
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ marginRight: '0.5rem' }}>Portfolio:</label>
          <select
            value={selectedPortfolio}
            onChange={(e) => setSelectedPortfolio(e.target.value)}
            style={{ padding: '0.5rem', fontSize: '1rem' }}
          >
            {portfolios.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}

      <h2>{currentPortfolio?.name || 'My Portfolio'}</h2>
      
      {!currentPortfolio?.items || currentPortfolio.items.length === 0 ? (
        <div>
          <p>No cards in your portfolio yet.</p>
          <p>Start adding cards to track your collection!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {currentPortfolio.items.map(item => (
            <div key={item.id} style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '0.5rem' }}>
              {item.card.imageUrl && (
                <img src={item.card.imageUrl} alt={item.card.name} style={{ width: '100%', height: 'auto', borderRadius: '4px' }} />
              )}
              <h4 style={{ margin: '0.5rem 0 0.25rem' }}>{item.card.name}</h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>
                {item.card.setName} ({item.card.setCode} #{item.card.cardNumber})
              </p>
              <p style={{ margin: '0.25rem 0', fontSize: '0.8rem' }}>
                Qty: {item.quantity} | {item.condition.replace('_', ' ')}
              </p>
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
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h3>Add {selectedCard.name} to Portfolio</h3>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>
              {selectedCard.setName} ({selectedCard.setCode} #{selectedCard.cardNumber})
            </p>
            
            <div style={{ marginTop: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem' }}>Condition</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
              >
                <option value="MINT">Mint</option>
                <option value="NEAR_MINT">Near Mint</option>
                <option value="LIGHTLY_PLAYED">Lightly Played</option>
                <option value="MODERATELY_PLAYED">Moderately Played</option>
                <option value="HEAVILY_PLAYED">Heavily Played</option>
                <option value="DAMAGED">Damaged</option>
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem' }}>Quantity</label>
              <input
                type="number"
                min="1"
                max="99"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                style={{ width: '100%', padding: '0.5rem' }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem' }}>Purchase Price (optional)</label>
              <input
                type="number"
                step="0.01"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="0.00"
                style={{ width: '100%', padding: '0.5rem' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
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
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: adding ? 'not-allowed' : 'pointer'
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
