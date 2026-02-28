'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

const containerStyle: React.CSSProperties = {
  background: '#0a0f1e',
  minHeight: '100vh',
  padding: '2rem'
};

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

const getRarityColor = (rarity: string | null): string => {
  if (!rarity) return '#94a3b8';
  const r = rarity.toLowerCase();
  if (r.includes('secret') || r.includes('ultra')) return '#a855f7';
  if (r.includes('rare') || r.includes('holo')) return '#ffd700';
  if (r.includes('super') || r.includes('hyper')) return '#3b82f6';
  if (r.includes('amazing') || r.includes('special')) return '#ec4899';
  return '#94a3b8';
};

const formatRarity = (rarity: string | null): string => {
  if (!rarity) return 'Unknown';
  return rarity.replace(/_/g, ' ').replace(/MEGA_ATTACK_RARE/g, 'Mega Rare');
};

const SetBadge = ({ imageUrl, name }: { imageUrl: string | null; name: string }) => {
  const initial = name.charAt(0).toUpperCase();
  
  if (!imageUrl) {
    return (
      <div style={{
        width: '150px',
        height: '75px',
        borderRadius: '8px',
        background: 'linear-gradient(135deg, #e63946, #c1121f)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '40px',
        fontWeight: 'bold',
        color: 'white'
      }}>
        {initial}
      </div>
    );
  }
  
  return (
    <>
      <img 
        src={imageUrl}
        alt={name}
        style={{ width: '150px', height: '75px', objectFit: 'contain' }}
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
          if (fallback) fallback.style.display = 'flex';
        }}
      />
      <div style={{ display: 'none', width: '150px', height: '75px', borderRadius: '8px', background: 'linear-gradient(135deg, #e63946, #c1121f)', alignItems: 'center', justifyContent: 'center', fontSize: '40px', fontWeight: 'bold', color: 'white' }}>
        {initial}
      </div>
    </>
  );
};

export default function CollectionDetailPage({ params }: { params: { code: string } }) {
  const router = useRouter();
  
  const [user, setUser] = useState<any>(null);
  const [set, setSet] = useState<SetData | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [ownedCards, setOwnedCards] = useState<Card[]>([]);
  const [missingCards, setMissingCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMissing, setShowMissing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    const fetchSetData = async () => {
      try {
        const response = await fetch(`${API_URL}/api/sets/${params.code}`);
        if (response.ok) {
          const data = await response.json();
          setSet(data.set);
          setCards(data.cards || []);
        } else {
          setError('Set not found');
        }
      } catch (err) {
        setError('Failed to load');
      } finally {
        setLoading(false);
      }
    };

    fetchSetData();
  }, [params.code]);

  useEffect(() => {
    if (!user) return;

    const fetchProgress = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await fetch(`${API_URL}/api/sets/${params.code}/progress`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setProgress(data.progress);
          setOwnedCards(data.ownedCards || []);
          setMissingCards(data.missingCards || []);
        }
      } catch (err) {
        // Silently fail - user will see public data
      }
    };

    fetchProgress();
  }, [user, params.code]);

  const handleCardClick = (cardId: string) => {
    router.push(`/marketplace/${cardId}`);
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={{ 
          background: 'rgba(255,255,255,0.05)', 
          borderRadius: '16px', 
          padding: '3rem', 
          textAlign: 'center',
          color: 'white'
        }}>
          Loading...
        </div>
      </div>
    );
  }

  if (error || !set) {
    return (
      <div style={containerStyle}>
        <Link href="/collection" style={{ color: '#ffd700', textDecoration: 'none', display: 'inline-block', marginBottom: '1rem' }}>
          ← Back to Collection
        </Link>
        <div style={{ 
          background: 'rgba(255,255,255,0.05)', 
          borderRadius: '16px', 
          padding: '3rem', 
          textAlign: 'center'
        }}>
          <h1 style={{ color: 'white' }}>Set Not Found</h1>
          <p style={{ color: '#94a3b8', marginTop: '1rem' }}>{error || 'Loading...'}</p>
        </div>
      </div>
    );
  }

  const displayCards = user ? (showMissing ? missingCards : ownedCards) : cards;
  
  const sortedCards = [...displayCards].sort((a, b) => {
    const numA = parseInt(a.cardNumber, 10) || 0;
    const numB = parseInt(b.cardNumber, 10) || 0;
    return numA - numB;
  });
  
  const ownedSet = new Set(ownedCards.map(c => c.id));

  return (
    <div style={containerStyle}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header */}
        <Link href="/collection" style={{ color: '#ffd700', textDecoration: 'none', display: 'inline-block', marginBottom: '1.5rem' }}>
          ← Collection
        </Link>

        <div style={{ 
          background: 'rgba(255,255,255,0.05)', 
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px', 
          padding: '2rem',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <SetBadge imageUrl={set.imageUrl} name={set.name} />
            
            <div style={{ flex: 1, minWidth: '200px' }}>
              <h1 style={{ color: 'white', fontSize: '32px', fontWeight: 'bold', margin: 0 }}>
                {set.name}
              </h1>
              <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>
                {set.releaseYear} • {set.totalCards} cards
              </p>
              
              {/* Progress Bar - only show for logged in users */}
              {user ? (
                <div style={{ marginTop: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'white', fontSize: '14px' }}>Progress</span>
                    <span style={{ color: '#ffd700', fontWeight: 'bold' }}>
                      {progress?.owned || 0} / {progress?.total || set.totalCards} cards
                    </span>
                  </div>
                  <div style={{ 
                    height: '8px', 
                    backgroundColor: '#1a2332', 
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      height: '100%', 
                      width: `${progress?.percentage || 0}%`,
                      background: 'linear-gradient(to right, #e63946, #c1121f)',
                      borderRadius: '4px',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
              ) : (
                <div style={{ 
                  marginTop: '1.5rem',
                  padding: '1rem',
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: '8px',
                  border: '1px solid rgba(230, 57, 70, 0.2)'
                }}>
                  <p style={{ color: '#94a3b8', margin: 0, fontSize: '14px' }}>
                    Sign in to track your collection
                  </p>
                </div>
              )}
              
              {/* Stat Pills - only show for logged in users */}
              {user && (
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <div style={{ 
                    background: 'rgba(16, 185, 129, 0.1)', 
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '20px', 
                    padding: '0.5rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>{progress?.owned || 0}</span>
                    <span style={{ color: '#94a3b8', fontSize: '14px' }}>owned</span>
                  </div>
                  <div style={{ 
                    background: 'rgba(239, 68, 68, 0.1)', 
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '20px', 
                    padding: '0.5rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{(progress?.total || set.totalCards) - (progress?.owned || 0)}</span>
                    <span style={{ color: '#94a3b8', fontSize: '14px' }}>missing</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs - only show for logged in users */}
        {user && (
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <button
              onClick={() => setShowMissing(true)}
              style={{
                padding: '0.75rem 1.5rem',
                background: showMissing ? 'linear-gradient(135deg, #e63946, #c1121f)' : 'rgba(255,255,255,0.05)',
                color: 'white',
                border: showMissing ? 'none' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '20px',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.2s'
              }}
            >
              Missing Cards ({missingCards.length})
            </button>
            <button
              onClick={() => setShowMissing(false)}
              style={{
                padding: '0.75rem 1.5rem',
                background: !showMissing ? 'linear-gradient(135deg, #e63946, #c1121f)' : 'rgba(255,255,255,0.05)',
                color: 'white',
                border: !showMissing ? 'none' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '20px',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.2s'
              }}
            >
              Owned Cards ({ownedCards.length})
            </button>
          </div>
        )}

        {/* Card Grid */}
        {!user && (
          <div style={{ 
            background: 'rgba(255,255,255,0.05)', 
            borderRadius: '16px', 
            padding: '1rem', 
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>
              Showing all {cards.length} cards in this set
            </p>
          </div>
        )}

        {displayCards.length === 0 ? (
          <div style={{ 
            background: 'rgba(255,255,255,0.05)', 
            borderRadius: '16px', 
            padding: '3rem', 
            textAlign: 'center'
          }}>
            <p style={{ color: '#94a3b8', fontSize: '18px' }}>
              {!user 
                ? 'Sign in to track your collection'
                : showMissing 
                  ? (ownedCards.length === 0 && cards.length > 0 
                      ? `You don't own any cards in this set yet`
                      : '🎉 No missing cards! You have the complete set!')
                  : 'No owned cards in this set yet.'
              }
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
            {sortedCards.map(card => {
              const isOwned = user && ownedSet.has(card.id);
              const rarityColor = getRarityColor(card.rarity);
              
              return (
                <div 
                  key={card.id}
                  onClick={() => handleCardClick(card.id)}
                  style={{ 
                    background: '#111827', 
                    borderRadius: '12px', 
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative',
                    border: `1px solid ${rarityColor}40`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02) translateY(-4px)';
                    e.currentTarget.style.boxShadow = `0 8px 25px ${rarityColor}30`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1) translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Owned indicator - only show for logged in users */}
                  {isOwned && (
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: '#10b981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 10,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Card Image */}
                  <div style={{ height: '140px', background: '#1a2332', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem' }}>
                    {card.imageUrl ? (
                      <img 
                        src={card.imageUrl} 
                        alt={card.name}
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                      />
                    ) : (
                      <span style={{ color: '#94a3b8' }}>No Image</span>
                    )}
                  </div>
                  
                  {/* Card Info */}
                  <div style={{ padding: '0.75rem' }}>
                    <h4 style={{ color: 'white', margin: 0, fontSize: '14px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {card.name}
                    </h4>
                    <p style={{ color: '#94a3b8', margin: '0.25rem 0 0', fontSize: '12px' }}>
                      #{card.cardNumber}
                    </p>
                    {card.rarity && (
                      <span style={{ 
                        display: 'inline-block',
                        marginTop: '0.5rem',
                        padding: '0.125rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        background: `${rarityColor}20`,
                        color: rarityColor,
                        border: `1px solid ${rarityColor}40`
                      }}>
                        {formatRarity(card.rarity)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
