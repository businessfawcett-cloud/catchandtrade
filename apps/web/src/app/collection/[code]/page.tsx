'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

interface Card {
  id: string;
  name: string;
  cardNumber: string;
  rarity: string | null;
  imageUrl: string | null;
}

interface SetData {
  id: string;
  name: string;
  code: string;
  totalCards: number;
  releaseYear: number;
  imageUrl: string | null;
}

interface ProgressData {
  owned: number;
  total: number;
  percentage: number;
}

export default function CollectionDetailPage({ params }: { params: { code: string } }) {
  console.log('[Collection] Code param:', params.code);
  
  const [user, setUser] = useState<any>(null);
  const [set, setSet] = useState<SetData | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [ownedCards, setOwnedCards] = useState<Card[]>([]);
  const [missingCards, setMissingCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMissing, setShowMissing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    console.log('[Collection] Token exists:', !!token);
    console.log('[Collection] User data exists:', !!userData);
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user) {
      console.log('[Collection] No user, skipping fetch');
      return;
    }

    const fetchProgress = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('[Collection] No token, skipping fetch');
        return;
      }

      try {
        console.log('[Collection] Fetching progress for code:', params.code);
        const response = await fetch(`${API_URL}/api/sets/${params.code}/progress`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('[Collection] Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('[Collection] Got data for set:', data.set?.name);
          setSet(data.set);
          setProgress(data.progress);
          setOwnedCards(data.ownedCards || []);
          setMissingCards(data.missingCards || []);
        } else {
          const errorData = await response.json();
          console.log('[Collection] Error response:', errorData);
          setError(errorData.error || 'Failed to load');
        }
      } catch (err) {
        console.error('[Collection] Failed to fetch progress:', err);
        setError('Failed to load');
      }
    };

    fetchProgress();
  }, [user, params.code]);

  const getProgressColor = (percentage: number) => {
    if (percentage >= 75) return '#28a745';
    if (percentage >= 25) return '#ffc107';
    return '#6c757d';
  };

  const getAffiliateLink = (cardName: string, setCode: string, cardNumber: string) => {
    const formattedSet = setCode.replace(/(\D+)(\d+)$/, '$1 $2');
    const searchQuery = `${cardName} ${formattedSet} ${cardNumber} Pokemon Card`;
    const tcgplayerQuery = encodeURIComponent(searchQuery);
    const amazonQuery = encodeURIComponent(searchQuery);
    const amazonTag = process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG || '';
    
    return {
      tcgplayer: `https://www.tcgplayer.com/search?product=${tcgplayerQuery}&utm_campaign=affiliate&utm_medium=cardvault&utm_source=cardvault`,
      amazon: `https://www.amazon.com/s?k=${amazonQuery}&tag=${amazonTag}`
    };
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return (
      <div>
        <h1>Collection Progress</h1>
        <p>Please <a href="/login">login</a> to view your collection progress.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1>Collection Progress</h1>
        <p style={{ color: 'red' }}>{error}</p>
        <p>Code parameter: {params.code}</p>
        <Link href="/collection">Back to Collection</Link>
      </div>
    );
  }

  if (!set) {
    return (
      <div>
        <h1>Collection Progress</h1>
        <p>Loading set: {params.code}</p>
        <Link href="/collection">Back to Collection</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <Link href="/collection" style={{ color: '#0066cc', textDecoration: 'none' }}>
        ← Back to Collection
      </Link>

      <div style={{ marginTop: '1rem', marginBottom: '2rem' }}>
        <h1>{set.name}</h1>
        <p style={{ color: '#666' }}>{set.releaseYear} • {set.totalCards} cards</p>
      </div>

      {progress && (
        <div style={{ 
          marginBottom: '2rem', 
          padding: '1.5rem', 
          backgroundColor: 'white', 
          borderRadius: '12px',
          border: '1px solid #ddd'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0 }}>Progress</h2>
            <span style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold',
              color: getProgressColor(progress.percentage)
            }}>
              {progress.percentage}%
            </span>
          </div>
          
          <div style={{ 
            height: '16px', 
            backgroundColor: '#e9ecef', 
            borderRadius: '8px',
            overflow: 'hidden',
            marginBottom: '1rem'
          }}>
            <div style={{ 
              height: '100%', 
              width: `${progress.percentage}%`,
              backgroundColor: getProgressColor(progress.percentage),
              borderRadius: '8px',
              transition: 'width 0.3s ease'
            }} />
          </div>

          <div style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem' }}>
            <div>
              <span style={{ color: '#28a745', fontWeight: 'bold' }}>{progress.owned}</span> owned
            </div>
            <div>
              <span style={{ color: '#dc3545', fontWeight: 'bold' }}>{progress.total - progress.owned}</span> missing
            </div>
            <div>
              <span style={{ fontWeight: 'bold' }}>{progress.total}</span> total
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '1rem' }}>
        <button
          onClick={() => setShowMissing(true)}
          style={{
            padding: '0.5rem 1rem',
            marginRight: '0.5rem',
            backgroundColor: showMissing ? '#0066cc' : '#e9ecef',
            color: showMissing ? 'white' : '#333',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Missing Cards ({missingCards.length})
        </button>
        <button
          onClick={() => setShowMissing(false)}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: !showMissing ? '#28a745' : '#e9ecef',
            color: !showMissing ? 'white' : '#333',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Owned Cards ({ownedCards.length})
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
        {(showMissing ? missingCards : ownedCards).map(card => (
          <div key={card.id} style={{ 
            border: '1px solid #ddd', 
            borderRadius: '8px', 
            padding: '1rem',
            backgroundColor: showMissing ? '#fff5f5' : 'white'
          }}>
            {card.imageUrl && (
              <img 
                src={card.imageUrl} 
                alt={card.name} 
                style={{ width: '100%', height: 'auto', borderRadius: '4px' }} 
              />
            )}
            <h4 style={{ margin: '0.5rem 0 0.25rem' }}>{card.name}</h4>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>
              #{card.cardNumber} • {card.rarity || 'Unknown'}
            </p>
            
            {showMissing && (
              <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                <a
                  href={getAffiliateLink(card.name, set.code, card.cardNumber).tcgplayer}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1,
                    display: 'block',
                    padding: '0.4rem',
                    backgroundColor: '#0066cc',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    textAlign: 'center'
                  }}
                >
                  TCGPlayer
                </a>
                <a
                  href={getAffiliateLink(card.name, set.code, card.cardNumber).amazon}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1,
                    display: 'block',
                    padding: '0.4rem',
                    backgroundColor: '#FF9900',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    textAlign: 'center'
                  }}
                >
                  Amazon
                </a>
              </div>
            )}
          </div>
        ))}
      </div>

      {(showMissing ? missingCards : ownedCards).length === 0 && (
        <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
          {showMissing ? 'No missing cards! You have the complete set!' : 'No owned cards in this set yet.'}
        </p>
      )}
    </div>
  );
}
