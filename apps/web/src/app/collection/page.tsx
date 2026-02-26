'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

const containerStyle: React.CSSProperties = {
  background: '#0a0f1e',
  minHeight: '100vh',
  padding: '2rem'
};

const getEraColor = (year: number): string => {
  if (year >= 2020) return '#e63946'; // Modern - red
  if (year >= 2010) return '#ffd700'; // Classic - gold  
  return '#a855f7'; // Vintage - purple
};

const getEra = (year: number): string => {
  if (year >= 2020) return 'modern';
  if (year >= 2010) return 'classic';
  return 'vintage';
};

interface PokemonSet {
  id: string;
  name: string;
  code: string;
  totalCards: number;
  releaseYear: number;
  imageUrl: string | null;
  cardCount: number;
}

export default function CollectionPage() {
  const [user, setUser] = useState<any>(null);
  const [sets, setSets] = useState<PokemonSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [progressMap, setProgressMap] = useState<Record<string, { owned: number; total: number; percentage: number }>>({});

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const fetchSets = async () => {
      try {
        const response = await fetch(`${API_URL}/api/sets`);
        if (response.ok) {
          const data = await response.json();
          setSets(data.sets || []);
        }
      } catch (err) {
        console.error('Failed to fetch sets:', err);
      }
    };

    fetchSets();
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchProgress = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      const progress: Record<string, { owned: number; total: number; percentage: number }> = {};

      for (const set of sets) {
        try {
          const response = await fetch(`${API_URL}/api/sets/${set.code}/progress`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            progress[set.code] = {
              owned: data.progress.owned,
              total: data.progress.total,
              percentage: data.progress.percentage
            };
          }
        } catch (err) {
          // Use fallback - set will show 0 owned
        }
      }

      setProgressMap(progress);
    };

    fetchProgress();
  }, [user, sets]);

  const totalOwned = Object.values(progressMap).reduce((sum, p) => sum + p.owned, 0);
  const totalCards = 20079;

  const setsByYear = useMemo(() => {
    const grouped: Record<number, PokemonSet[]> = {};
    for (const set of sets) {
      const year = set.releaseYear || 2024;
      if (!grouped[year]) grouped[year] = [];
      grouped[year].push(set);
    }
    return Object.entries(grouped).sort((a, b) => Number(b[0]) - Number(a[0]));
  }, [sets]);

  const getProgressColor = (percentage: number) => {
    if (percentage === 0) return '#e63946';
    if (percentage >= 100) return '#10b981';
    return '#ffd700';
  };

  const SetBadge = ({ name, imageUrl }: { name: string; imageUrl: string | null }) => {
    const initial = name.charAt(0).toUpperCase();
    
    if (!imageUrl) {
      return (
        <div style={{
          width: '120px',
          height: '60px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #e63946, #c1121f)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '32px',
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
          style={{ width: '120px', height: '50px', objectFit: 'contain', display: 'block' }}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = 'flex';
          }}
        />
        <div style={{ display: 'none', width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #e63946, #c1121f)', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '20px' }}>
          {initial}
        </div>
      </>
    );
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

  if (!user) {
    return (
      <div style={containerStyle}>
        <div style={{ 
          background: 'rgba(255,255,255,0.05)', 
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px', 
          padding: '3rem', 
          textAlign: 'center',
          maxWidth: '500px',
          margin: '0 auto'
        }}>
          <h1 style={{ color: 'white', fontSize: '1.75rem', marginBottom: '1rem' }}>Collection</h1>
          <p style={{ color: '#94a3b8' }}>Please <a href="/login" style={{ color: '#e63946' }}>login</a> to view your collection progress.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header with total progress */}
        <div style={{ 
          background: 'rgba(255,255,255,0.05)', 
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px', 
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <h1 style={{ color: 'white', fontSize: '32px', fontWeight: 'bold', margin: 0 }}>
            My Pokemon Collection
          </h1>
          <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>
            Track your progress across Pokemon card sets
          </p>
          <div style={{ 
            marginTop: '1rem', 
            padding: '1rem', 
            background: 'rgba(0,0,0,0.2)', 
            borderRadius: '8px',
            display: 'inline-block'
          }}>
            <span style={{ color: 'white', fontSize: '1.1rem' }}>
              You own <span style={{ color: '#ffd700', fontWeight: 'bold' }}>{totalOwned.toLocaleString()}</span> of <span style={{ fontWeight: 'bold' }}>{totalCards.toLocaleString()}</span> total cards
            </span>
          </div>
        </div>

        {/* Sets grouped by year */}
        {setsByYear.map(([year, yearSets]) => (
          <div key={year} style={{ marginBottom: '2rem' }}>
            {/* Year divider */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '1rem',
              gap: '1rem'
            }}>
              <span style={{ 
                color: '#ffd700', 
                fontSize: '24px', 
                fontWeight: 'bold'
              }}>
                {year}
              </span>
              <div style={{ 
                flex: 1, 
                height: '1px', 
                background: 'linear-gradient(to right, rgba(255,215,0,0.3), transparent)' 
              }} />
            </div>

            {/* Set cards grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {yearSets.map(set => {
                const progress = progressMap[set.code];
                const owned = progress?.owned || 0;
                const total = progress?.total || set.cardCount || set.totalCards || 0;
                const percentage = progress?.percentage || 0;
                const progressColor = getProgressColor(percentage);
                const eraColor = getEraColor(set.releaseYear);
                
                return (
                  <Link 
                    key={set.id} 
                    href={`/collection/${set.code}`}
                    style={{ textDecoration: 'none', display: 'block' }}
                  >
                    <div style={{ 
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: '12px', 
                      padding: '1.5rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      position: 'relative',
                      overflow: 'hidden',
                      height: '100%',
                      minHeight: '140px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(230, 57, 70, 0.5)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(230, 57, 70, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    >
                      {/* Left accent bar */}
                      <div style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: '3px',
                        background: eraColor
                      }} />

                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <SetBadge name={set.name} imageUrl={set.imageUrl || null} />
                        
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <h3 style={{ color: 'white', margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
                              {set.name}
                            </h3>
                            <span style={{ color: '#94a3b8', fontSize: '12px' }}>
                              {set.releaseYear}
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div style={{ marginTop: '1rem' }}>
                            <div style={{ 
                              height: '6px', 
                              backgroundColor: '#1a2332', 
                              borderRadius: '3px',
                              overflow: 'hidden'
                            }}>
                              <div style={{ 
                                height: '100%', 
                                width: `${percentage}%`,
                                backgroundColor: progressColor,
                                borderRadius: '3px',
                                transition: 'width 0.3s ease'
                              }} />
                            </div>
                          </div>

                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            marginTop: '0.5rem',
                            fontSize: '14px'
                          }}>
                            <span style={{ color: 'white' }}>
                              {owned} / {total} cards
                            </span>
                            <span style={{ color: progressColor, fontWeight: 'bold' }}>
                              {percentage}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
