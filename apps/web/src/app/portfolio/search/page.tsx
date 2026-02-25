'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

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

interface Portfolio {
  id: string;
  name: string;
}

export default function PortfolioSearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  
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
      const response = await fetch(`${API_URL}/api/cards/search?q=${encodeURIComponent(query)}`);
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
    
    if (token && userData) {
      setUser(JSON.parse(userData));
      fetchPortfolios();
    }
    fetchCards();
  }, [fetchPortfolios, fetchCards]);

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
        setSuccessMessage('Added to Portfolio!');
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
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
        <h1>Search Cards</h1>
        <p>Please <a href="/login">login</a> to add cards to your portfolio.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ marginBottom: '1rem' }}>
        <Link href="/portfolio" style={{ color: '#0066cc', textDecoration: 'none' }}>
          ← Back to Portfolio
        </Link>
      </div>

      <h1>Search Results{query ? ` for "${query}"` : ''}</h1>

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

      {loading ? (
        <div>Loading...</div>
      ) : cards.length === 0 ? (
        <div>No results for "{query}"</div>
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
                border: '1px solid #ccc', 
                borderRadius: '8px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div style={{ 
                height: '180px', 
                backgroundColor: '#f5f5f5',
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
                  'Card Image'
                )}
              </div>
              <div style={{ padding: '0.75rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ margin: '0 0 0.25rem', fontSize: '1rem' }}>{card.name}</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>
                  {card.setName} ({card.setCode} #{card.cardNumber})
                </p>
                {card.rarity && (
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#888' }}>
                    {card.rarity}
                  </p>
                )}
                {card.currentPrice && (
                  <p style={{ margin: '0.5rem 0', fontWeight: 'bold', fontSize: '1.1rem' }}>
                    ${card.currentPrice.toFixed(2)}
                  </p>
                )}
                <button
                  onClick={() => {
                    console.log('Add to portfolio clicked', card);
                    console.log('showModal before:', showModal);
                    setSelectedCard(card);
                    setShowModal(true);
                    console.log('showModal after:', true);
                  }}
                  style={{
                    marginTop: 'auto',
                    padding: '0.5rem',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
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

            {portfolios.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.25rem' }}>Portfolio</label>
                <select
                  value={selectedPortfolio}
                  onChange={(e) => setSelectedPortfolio(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem' }}
                >
                  {portfolios.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}

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
