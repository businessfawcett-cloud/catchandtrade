'use client';

import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

const AVATARS = [
  { id: '1', pokemon: 'bulbasaur', spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png' },
  { id: '4', pokemon: 'charmander', spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png' },
  { id: '7', pokemon: 'squirtle', spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/7.png' },
  { id: '25', pokemon: 'pikachu', spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png' },
  { id: '39', pokemon: 'jigglypuff', spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/39.png' },
  { id: '52', pokemon: 'meowth', spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/52.png' },
  { id: '54', pokemon: 'psyduck', spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/54.png' },
  { id: '94', pokemon: 'gengar', spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/94.png' },
  { id: '131', pokemon: 'lapras', spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/131.png' },
  { id: '133', pokemon: 'eevee', spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/133.png' },
  { id: '143', pokemon: 'snorlax', spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/143.png' },
  { id: '150', pokemon: 'mewtwo', spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/150.png' },
];

const COUNTRIES = [
  'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany',
  'France', 'Japan', 'Brazil', 'Mexico', 'Spain', 'Italy', 'Netherlands'
];

export default function OnboardingPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [avatarId, setAvatarId] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [hideCollectionValue, setHideCollectionValue] = useState(false);
  const [country, setCountry] = useState('');
  const [twitterHandle, setTwitterHandle] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [tiktokHandle, setTiktokHandle] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) {
      window.location.href = '/login';
      return;
    }
    setLoading(false);
  }, []);

  const checkUsername = async (value: string) => {
    if (!value || value.length < 1) {
      setUsernameAvailable(null);
      return;
    }
    setCheckingUsername(true);
    try {
      const response = await fetch(`${API_URL}/api/users/check-username?u=${encodeURIComponent(value)}`);
      const data = await response.json();
      setUsernameAvailable(data.available);
    } catch (err) {
      setUsernameAvailable(null);
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleUsernameChange = (value: string) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 25);
    setUsername(cleaned);
    setUsernameAvailable(null);
    if (cleaned.length >= 3) {
      checkUsername(cleaned);
    }
  };

  const handleContinue = async () => {
    if (!username || username.length < 3) {
      setError('Please choose a username (at least 3 characters)');
      return;
    }
    if (!usernameAvailable) {
      setError('Please choose an available username');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          username,
          displayName: displayName || undefined,
          avatarId: avatarId || null,
          isPublic,
          hideCollectionValue,
          country: country || null,
          twitterHandle: twitterHandle || null,
          instagramHandle: instagramHandle || null,
          tiktokHandle: tiktokHandle || null,
        })
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to save profile');
        return;
      }

      const data = await response.json();
      localStorage.setItem('user', JSON.stringify(data));
      window.location.href = '/';
    } catch (err) {
      setError('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
      <h1>Set Up Your Profile</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Tell us about yourself to get started with your collection.
      </p>

      {error && (
        <div style={{ color: 'red', marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#fee2e2', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: '2rem' }}>
        <h2>Profile</h2>
        
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }} htmlFor="displayName">
            Display Name <span style={{ color: '#666', fontWeight: 'normal' }}>(optional)</span>
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value.slice(0, 25))}
            maxLength={25}
            placeholder="How you want to be called"
            style={{ width: '100%', padding: '0.5rem', fontSize: '1rem' }}
          />
          <div style={{ fontSize: '0.8rem', color: '#666', textAlign: 'right' }}>
            {displayName.length}/25
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }} htmlFor="username">
            Username <span style={{ color: 'red' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              placeholder="your-username"
              style={{ width: '100%', padding: '0.5rem', fontSize: '1rem', paddingRight: '40px' }}
            />
            <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
              {checkingUsername ? '...' : usernameAvailable === true ? '✓' : usernameAvailable === false ? '✗' : ''}
            </span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#666' }}>
            {username.length}/25 • lowercase, no spaces
          </div>
          {usernameAvailable === true && (
            <div style={{ fontSize: '0.8rem', color: 'green' }}>✓ Available</div>
          )}
          {usernameAvailable === false && (
            <div style={{ fontSize: '0.8rem', color: 'red' }}>✗ Already taken</div>
          )}
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2>Avatar</h2>
        <p style={{ color: '#666', marginBottom: '0.5rem' }}>Choose your starter Pokemon</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.75rem' }}>
          {AVATARS.map((avatar) => (
            <button
              key={avatar.id}
              onClick={() => setAvatarId(avatar.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '0.5rem',
                backgroundColor: avatarId === avatar.id ? '#e0f2fe' : '#f9fafb',
                border: avatarId === avatar.id ? '3px solid #3b82f6' : '3px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'transform 0.2s',
              }}
            >
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #e5e7eb',
              }}>
                <img 
                  src={avatar.spriteUrl} 
                  alt={avatar.pokemon}
                  style={{ width: '64px', height: '64px', objectFit: 'contain' }}
                />
              </div>
              <span style={{ 
                marginTop: '0.25rem', 
                fontSize: '0.7rem', 
                textTransform: 'capitalize',
                color: '#374151',
                fontWeight: '500'
              }}>
                {avatar.pokemon}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2>Privacy</h2>
        
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontWeight: 'bold' }}>Profile Visibility</label>
          <div style={{ marginTop: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', cursor: 'pointer' }}>
              <input
                type="radio"
                name="isPublic"
                checked={isPublic === true}
                onChange={() => setIsPublic(true)}
              />
              <div>
                <div>Public</div>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>Anyone can see and find your profile</div>
              </div>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="radio"
                name="isPublic"
                checked={isPublic === false}
                onChange={() => setIsPublic(false)}
              />
              <div>
                <div>Private</div>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>Only you and your friends can see your profile</div>
              </div>
            </label>
          </div>
        </div>

        {isPublic && (
          <div>
            <label style={{ fontWeight: 'bold' }}>Collection Value</label>
            <div style={{ marginTop: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="hideValue"
                  checked={hideCollectionValue === false}
                  onChange={() => setHideCollectionValue(false)}
                />
                Show - Your collection value is visible to anyone
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="hideValue"
                  checked={hideCollectionValue === true}
                  onChange={() => setHideCollectionValue(true)}
                />
                Hide - Only you can see your collection value
              </label>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2>Trading</h2>
        
        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }} htmlFor="country">
            Country <span style={{ color: '#666', fontWeight: 'normal' }}>(optional)</span>
          </label>
          <select
            id="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', fontSize: '1rem' }}
          >
            <option value="">Select a country</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
            Sharing your country helps you connect with traders nearby
          </p>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2>Socials</h2>
        <p style={{ color: '#666', marginBottom: '1rem' }}>Add your social links (all optional)</p>

        <div style={{ marginBottom: '0.75rem' }}>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Twitter/X</label>
          <input
            type="text"
            value={twitterHandle}
            onChange={(e) => setTwitterHandle(e.target.value)}
            placeholder="@username"
            style={{ width: '100%', padding: '0.5rem', fontSize: '1rem' }}
          />
        </div>

        <div style={{ marginBottom: '0.75rem' }}>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Instagram</label>
          <input
            type="text"
            value={instagramHandle}
            onChange={(e) => setInstagramHandle(e.target.value)}
            placeholder="@username"
            style={{ width: '100%', padding: '0.5rem', fontSize: '1rem' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>TikTok</label>
          <input
            type="text"
            value={tiktokHandle}
            onChange={(e) => setTiktokHandle(e.target.value)}
            placeholder="@username"
            style={{ width: '100%', padding: '0.5rem', fontSize: '1rem' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
        <button
          onClick={handleContinue}
          disabled={saving}
          style={{
            flex: 1,
            padding: '1rem',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '1rem',
            cursor: saving ? 'not-allowed' : 'pointer'
          }}
        >
          {saving ? 'Saving...' : 'Continue'}
        </button>
        <button
          onClick={handleSignOut}
          style={{
            padding: '1rem',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '1rem',
            cursor: 'pointer'
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
