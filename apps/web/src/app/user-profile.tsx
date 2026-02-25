'use client';

import { useEffect, useState } from 'react';

const AVATARS: Record<string, string> = {
  '1': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png',
  '4': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png',
  '7': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/7.png',
  '25': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png',
  '39': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/39.png',
  '52': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/52.png',
  '54': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/54.png',
  '94': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/94.png',
  '131': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/131.png',
  '133': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/133.png',
  '143': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/143.png',
  '150': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/150.png',
};

export default function UserProfile() {
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    setMounted(true);
  }, []);

  if (!mounted || !user) {
    return null;
  }

  const avatarUrl = user.avatarId ? AVATARS[user.avatarId] : null;
  const displayName = user.username || user.displayName || 'User';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      {avatarUrl ? (
        <img 
          src={avatarUrl} 
          alt={displayName}
          style={{ 
            width: '32px', 
            height: '32px', 
            borderRadius: '50%', 
            objectFit: 'contain',
            backgroundColor: '#f0f0f0'
          }}
        />
      ) : (
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: '#3b82f6',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.875rem',
          fontWeight: 'bold'
        }}>
          {displayName.charAt(0).toUpperCase()}
        </div>
      )}
      <span style={{ fontWeight: '500' }}>@{displayName}</span>
    </div>
  );
}
