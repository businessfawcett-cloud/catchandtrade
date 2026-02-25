'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

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
          console.error(`Failed to fetch progress for ${set.code}:`, err);
        }
      }

      setProgressMap(progress);
    };

    fetchProgress();
  }, [user, sets]);

  const getProgressColor = (percentage: number) => {
    if (percentage >= 75) return '#28a745';
    if (percentage >= 25) return '#ffc107';
    return '#6c757d';
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return (
      <div>
        <h1>Collection</h1>
        <p>Please <a href="/login">login</a> to view your collection progress.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <h1>My Pokemon Collection</h1>
      <p style={{ marginBottom: '2rem', color: '#666' }}>
        Track your progress across Pokemon card sets
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {sets.map(set => {
          const progress = progressMap[set.code];
          return (
            <Link 
              key={set.id} 
              href={`/collection/${set.code}`}
              style={{ 
                textDecoration: 'none', 
                color: 'inherit',
                display: 'block'
              }}
            >
              <div style={{ 
                border: '1px solid #ddd', 
                borderRadius: '12px', 
                padding: '1.5rem',
                backgroundColor: 'white',
                transition: 'box-shadow 0.2s ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{set.name}</h3>
                    <span style={{ fontSize: '0.85rem', color: '#666' }}>{set.releaseYear}</span>
                  </div>
                  <span style={{ 
                    backgroundColor: '#f0f0f0', 
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                  }}>
                    {set.code}
                  </span>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                    <span>Progress</span>
                    <span>
                      {progress ? `${progress.owned}/${progress.total} (${progress.percentage}%)` : `0/${set.cardCount} (0%)`}
                    </span>
                  </div>
                  <div style={{ 
                    height: '8px', 
                    backgroundColor: '#e9ecef', 
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      height: '100%', 
                      width: progress ? `${progress.percentage}%` : '0%',
                      backgroundColor: progress ? getProgressColor(progress.percentage) : '#6c757d',
                      borderRadius: '4px',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>

                <div style={{ fontSize: '0.85rem', color: '#666' }}>
                  {set.totalCards} cards in set
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
