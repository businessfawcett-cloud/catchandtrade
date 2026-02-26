'use client';

import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

const STARTERS = [
  { id: '1', pokemon: 'bulbasaur' },
  { id: '4', pokemon: 'charmander' },
  { id: '7', pokemon: 'squirtle' },
  { id: '25', pokemon: 'pikachu' },
  { id: '39', pokemon: 'jigglypuff' },
  { id: '52', pokemon: 'meowth' },
  { id: '54', pokemon: 'psyduck' },
  { id: '94', pokemon: 'gengar' },
  { id: '131', pokemon: 'lapras' },
  { id: '133', pokemon: 'eevee' },
  { id: '143', pokemon: 'snorlax' },
  { id: '150', pokemon: 'mewtwo' },
];

const COUNTRIES = [
  'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany',
  'France', 'Japan', 'Brazil', 'Mexico', 'Spain', 'Italy', 'Netherlands'
];

const containerStyle: React.CSSProperties = {
  background: '#0a0f1e',
  minHeight: '100vh',
  padding: '2rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '20px',
  padding: '2.5rem',
  maxWidth: '500px',
  width: '100%'
};

const inputStyle: React.CSSProperties = {
  background: '#1a2332',
  border: '1px solid rgba(255,255,255,0.1)',
  color: 'white',
  padding: '0.875rem',
  borderRadius: '8px',
  width: '100%',
  fontSize: '1rem',
  boxSizing: 'border-box'
};

const buttonStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #e63946, #c1121f)',
  color: 'white',
  border: 'none',
  padding: '1rem 2rem',
  borderRadius: '8px',
  fontSize: '1rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  width: '100%',
  transition: 'opacity 0.2s'
};

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
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

  const handleContinue = () => {
    if (step === 1) {
      if (!username || username.length < 3) {
        setError('Please choose a username (at least 3 characters)');
        return;
      }
      if (!usernameAvailable) {
        setError('Please choose an available username');
        return;
      }
      setError('');
      setStep(2);
    } else if (step === 2) {
      if (!avatarId) {
        setError('Please choose a starter Pokemon');
        return;
      }
      setError('');
      setStep(3);
    }
  };

  const handleComplete = async () => {
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
          displayName: displayName || null,
          avatarId,
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
        throw new Error(data.error || 'Failed to save profile');
      }

      const userData = await response.json();
      localStorage.setItem('user', JSON.stringify(userData));
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message || 'An error occurred');
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
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', color: 'white' }}>Loading...</div>
        </div>
      </div>
    );
  }

  const labelStyle: React.CSSProperties = {
    color: 'white',
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: 'bold',
    fontSize: '0.9rem'
  };

  const textMutedStyle: React.CSSProperties = {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '0.875rem'
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: step === s ? '#e63946' : '#374151',
                transition: 'background 0.3s'
              }}
            />
          ))}
        </div>

        {error && (
          <div style={{ color: '#ef4444', marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        {step === 1 && (
          <>
            <h1 style={{ color: 'white', fontSize: '1.75rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '0.5rem' }}>
              Welcome to Catch & Trade
            </h1>
            <p style={{ ...textMutedStyle, textAlign: 'center', marginBottom: '2rem' }}>
              Set up your trainer profile to get started
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle} htmlFor="displayName">
                Display Name <span style={textMutedStyle}>(optional)</span>
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value.slice(0, 25))}
                maxLength={25}
                placeholder="How you want to be called"
                style={inputStyle}
              />
              <div style={{ ...textMutedStyle, textAlign: 'right', marginTop: '0.25rem' }}>
                {displayName.length}/25
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={labelStyle} htmlFor="username">
                Username <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder="your-username"
                  style={{ ...inputStyle, paddingRight: '40px' }}
                />
                <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: checkingUsername ? 'rgba(255,255,255,0.5)' : usernameAvailable === true ? '#22c55e' : usernameAvailable === false ? '#ef4444' : 'transparent', fontSize: '0.875rem' }}>
                  {checkingUsername ? '...' : usernameAvailable === true ? '✓' : usernameAvailable === false ? '✗' : ''}
                </span>
              </div>
              <div style={{ ...textMutedStyle, marginTop: '0.5rem' }}>
                {username.length}/25 • lowercase, no spaces
              </div>
              {usernameAvailable === true && (
                <div style={{ fontSize: '0.875rem', color: '#22c55e', marginTop: '0.25rem' }}>✓ Available</div>
              )}
              {usernameAvailable === false && (
                <div style={{ fontSize: '0.875rem', color: '#ef4444', marginTop: '0.25rem' }}>✗ Already taken</div>
              )}
            </div>

            <button onClick={handleContinue} style={buttonStyle}>
              Continue →
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h1 style={{ color: 'white', fontSize: '1.75rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '0.5rem' }}>
              Choose Your Starter
            </h1>
            <p style={{ ...textMutedStyle, textAlign: 'center', marginBottom: '2rem' }}>
              Select your first Pokemon partner
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '2rem' }}>
              {STARTERS.map((starter) => (
                <button
                  key={starter.id}
                  onClick={() => setAvatarId(starter.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '0.75rem',
                    backgroundColor: avatarId === starter.id ? 'rgba(230,57,70,0.15)' : 'rgba(255,255,255,0.03)',
                    border: avatarId === starter.id ? '2px solid #e63946' : '2px solid transparent',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: avatarId === starter.id ? '0 0 20px rgba(230,57,70,0.3)' : 'none'
                  }}
                >
                  <img
                    src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${starter.id}.png`}
                    alt={starter.pokemon}
                    style={{ width: '72px', height: '72px', objectFit: 'contain', imageRendering: 'pixelated' }}
                  />
                  <span style={{ 
                    marginTop: '0.5rem', 
                    fontSize: '0.65rem', 
                    textTransform: 'capitalize' as const,
                    color: avatarId === starter.id ? '#ffd700' : 'white',
                    fontWeight: avatarId === starter.id ? 'bold' : 'normal'
                  }}>
                    {starter.pokemon}
                  </span>
                </button>
              ))}
            </div>

            <button onClick={handleContinue} style={buttonStyle}>
              Continue →
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <h1 style={{ color: 'white', fontSize: '1.75rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '0.5rem' }}>
              Preferences
            </h1>
            <p style={{ ...textMutedStyle, textAlign: 'center', marginBottom: '1.5rem' }}>
              Customize your profile visibility
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>Profile Visibility</label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => setIsPublic(true)}
                  style={{
                    flex: 1,
                    padding: '1rem',
                    background: isPublic ? 'rgba(230,57,70,0.15)' : 'rgba(255,255,255,0.03)',
                    border: isPublic ? '2px solid #e63946' : '2px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    textAlign: 'center' as const
                  }}
                >
                  <div style={{ color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>Public</div>
                  <div style={{ ...textMutedStyle, fontSize: '0.75rem', marginTop: '0.25rem' }}>Anyone can find you</div>
                </button>
                <button
                  onClick={() => setIsPublic(false)}
                  style={{
                    flex: 1,
                    padding: '1rem',
                    background: !isPublic ? 'rgba(230,57,70,0.15)' : 'rgba(255,255,255,0.03)',
                    border: !isPublic ? '2px solid #e63946' : '2px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    textAlign: 'center' as const
                  }}
                >
                  <div style={{ color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>Private</div>
                  <div style={{ ...textMutedStyle, fontSize: '0.75rem', marginTop: '0.25rem' }}>Only you can see</div>
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>Collection Value</label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => setHideCollectionValue(false)}
                  style={{
                    flex: 1,
                    padding: '1rem',
                    background: !hideCollectionValue ? 'rgba(230,57,70,0.15)' : 'rgba(255,255,255,0.03)',
                    border: !hideCollectionValue ? '2px solid #e63946' : '2px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    textAlign: 'center' as const
                  }}
                >
                  <div style={{ color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>Show</div>
                  <div style={{ ...textMutedStyle, fontSize: '0.75rem', marginTop: '0.25rem' }}>Value visible</div>
                </button>
                <button
                  onClick={() => setHideCollectionValue(true)}
                  style={{
                    flex: 1,
                    padding: '1rem',
                    background: hideCollectionValue ? 'rgba(230,57,70,0.15)' : 'rgba(255,255,255,0.03)',
                    border: hideCollectionValue ? '2px solid #e63946' : '2px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    textAlign: 'center' as const
                  }}
                >
                  <div style={{ color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>Hide</div>
                  <div style={{ ...textMutedStyle, fontSize: '0.75rem', marginTop: '0.25rem' }}>Value private</div>
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle} htmlFor="country">
                Country <span style={textMutedStyle}>(optional)</span>
              </label>
              <select
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
              >
                <option value="" style={{ background: '#1a2332' }}>Select a country</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c} style={{ background: '#1a2332' }}>{c}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>Social Links <span style={textMutedStyle}>(optional)</span></label>
              <input
                type="text"
                value={twitterHandle}
                onChange={(e) => setTwitterHandle(e.target.value)}
                placeholder="Twitter @username"
                style={{ ...inputStyle, marginBottom: '0.75rem' }}
              />
              <input
                type="text"
                value={instagramHandle}
                onChange={(e) => setInstagramHandle(e.target.value)}
                placeholder="Instagram @username"
                style={{ ...inputStyle, marginBottom: '0.75rem' }}
              />
              <input
                type="text"
                value={tiktokHandle}
                onChange={(e) => setTiktokHandle(e.target.value)}
                placeholder="TikTok @username"
                style={inputStyle}
              />
            </div>

            <button onClick={handleComplete} disabled={saving} style={{ ...buttonStyle, opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Saving...' : 'Complete Setup'}
            </button>
          </>
        )}

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <button
            onClick={handleSignOut}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '0.875rem' }}
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
