'use client';

import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

const STARTERS = [
  { id: '1', name: 'bulbasaur' },
  { id: '4', name: 'charmander' },
  { id: '7', name: 'squirtle' },
  { id: '25', name: 'pikachu' },
  { id: '39', name: 'jigglypuff' },
  { id: '52', name: 'meowth' },
  { id: '54', name: 'psyduck' },
  { id: '94', name: 'gengar' },
  { id: '131', name: 'lapras' },
  { id: '133', name: 'eevee' },
  { id: '143', name: 'snorlax' },
  { id: '150', name: 'mewtwo' },
];

const COUNTRIES = [
  'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany',
  'France', 'Japan', 'Brazil', 'Mexico', 'Spain', 'Italy', 'Netherlands'
];

// Icons
const AtSymbolIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="4" />
    <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" />
  </svg>
);

const PersonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="8" r="4" />
    <path d="M20 21a8 8 0 1 0-16 0" />
  </svg>
);

const GlobeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const LockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const TwitterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const InstagramIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="18" cy="6" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const TiktokIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

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
    document.body.classList.add('hide-nav');
    return () => {
      document.body.classList.remove('hide-nav');
    };
  }, []);

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
      localStorage.setItem('user', JSON.stringify({
        ...userData,
        displayName: userData.displayname,
        username: userData.username
      }));

      // Create default portfolio if none exists
      try {
        const portfolioRes = await fetch(`${API_URL}/api/portfolios`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            name: 'My Collection',
            isDefault: true
          })
        });
        if (portfolioRes.ok) {
          console.log('Default portfolio created');
        }
      } catch (portfolioErr) {
        console.warn('Could not create default portfolio:', portfolioErr);
      }

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
      <div style={{ background: '#0a0a14', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'white' }}>Loading...</div>
      </div>
    );
  }

  const progressWidth = step === 1 ? '33%' : step === 2 ? '66%' : '100%';

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
        
        @keyframes float1 {
          0%, 100% { transform: translate(-50%, -50%) rotate(-6deg) translateY(0); }
          50% { transform: translate(-50%, -50%) rotate(-6deg) translateY(-14px); }
        }
        
        @keyframes float2 {
          0%, 100% { transform: translateY(-40%) rotate(-22deg) translateY(-6px); }
          50% { transform: translateY(-40%) rotate(-22deg) translateY(8px); }
        }
        
        @keyframes float3 {
          0%, 100% { transform: translateY(-40%) rotate(18deg) translateY(4px); }
          50% { transform: translateY(-40%) rotate(18deg) translateY(-10px); }
        }
        
        .float1 { animation: float1 4s ease-in-out infinite; }
        .float2 { animation: float2 5s ease-in-out infinite; }
        .float3 { animation: float3 4.5s ease-in-out infinite; }
        
        @media (max-width: 768px) {
          .right-panel { display: none !important; }
          .left-panel { width: 100% !important; }
        }
      `}</style>

      <div style={{ height: '100vh', overflow: 'hidden', display: 'flex', fontFamily: 'DM Sans, sans-serif' }}>
        {/* LEFT COLUMN - Form */}
        <div className="left-panel" style={{ 
          width: '45%', 
          background: '#0a0a14',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          padding: '0 48px',
          overflow: 'hidden'
        }}>
          {/* Subtle glow */}
          <div style={{
            position: 'absolute',
            bottom: '-150px',
            left: '-150px',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.08), transparent 70%)',
            pointerEvents: 'none'
          }} />

          {/* Content */}
          <div style={{
            width: '100%',
            maxWidth: '380px',
            display: 'flex',
            flexDirection: 'column',
            paddingBottom: '20px'
          }}>
            {/* Progress - Inside the centered content block */}
            <div style={{ marginBottom: '1.75rem' }}>
              <div style={{ fontSize: '11px', color: '#40404e', marginBottom: '8px', fontWeight: '500' }}>
                Step {step} of 3
              </div>
              <div style={{
                width: '100%',
                height: '3px',
                background: 'rgba(255,255,255,0.06)',
                borderRadius: '99px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: progressWidth,
                  height: '100%',
                  background: 'linear-gradient(90deg, #8b5cf6, #f0c040)',
                  borderRadius: '99px',
                  transition: 'width 0.4s ease'
                }} />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{ 
                marginBottom: '1.5rem', 
                padding: '0.75rem', 
                borderRadius: '8px', 
                background: 'rgba(239,68,68,0.1)', 
                border: '1px solid rgba(239,68,68,0.3)',
                color: '#f87171',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            {/* STEP 1 - Profile */}
            {step === 1 && (
              <>
                <h2 style={{ color: 'white', fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
                  Set Up Your Profile
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '24px' }}>
                  Choose your trainer identity
                </p>

                {/* Username */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                    Username <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      position: 'absolute',
                      left: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#94a3b8',
                      zIndex: 1
                    }}>
                      <AtSymbolIcon />
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      placeholder="your-username"
                      style={{
                        width: '100%',
                        padding: '14px 14px 14px 42px',
                        borderRadius: '12px',
                        border: `1px solid ${usernameAvailable === false ? 'rgba(239,68,68,0.5)' : usernameAvailable === true ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.08)'}`,
                        background: '#11111e',
                        color: 'white',
                        fontSize: '15px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                      onBlur={(e) => e.target.style.borderColor = usernameAvailable === false ? 'rgba(239,68,68,0.5)' : usernameAvailable === true ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.08)'}
                    />
                    <span style={{ 
                      position: 'absolute', 
                      right: '14px', 
                      top: '50%', 
                      transform: 'translateY(-50%)', 
                      color: checkingUsername ? '#94a3b8' : usernameAvailable === true ? '#22c55e' : usernameAvailable === false ? '#ef4444' : 'transparent', 
                      fontSize: '14px' 
                    }}>
                      {checkingUsername ? '...' : usernameAvailable === true ? '✓' : usernameAvailable === false ? '✗' : ''}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
                    {username.length}/25 • lowercase, no spaces
                  </div>
                  {usernameAvailable === true && (
                    <div style={{ fontSize: '12px', color: '#22c55e', marginTop: '4px' }}>✓ Available</div>
                  )}
                  {usernameAvailable === false && (
                    <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>✗ Already taken</div>
                  )}
                </div>

                {/* Display Name */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                    Display Name <span style={{ color: '#94a3b8' }}>(optional)</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      position: 'absolute',
                      left: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#94a3b8',
                      zIndex: 1
                    }}>
                      <PersonIcon />
                    </div>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value.slice(0, 25))}
                      maxLength={25}
                      placeholder="How you want to be called"
                      style={{
                        width: '100%',
                        padding: '14px 14px 14px 42px',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.08)',
                        background: '#11111e',
                        color: 'white',
                        fontSize: '15px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                      onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                    />
                  </div>
                </div>

                <button 
                  onClick={handleContinue}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    border: 'none',
                    background: '#ef4444',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#dc2626'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#ef4444'}
                >
                  Continue →
                </button>
              </>
            )}

            {/* STEP 2 - Starter */}
            {step === 2 && (
              <>
                <h2 style={{ 
                  fontFamily: 'Bebas Neue, sans-serif', 
                  fontSize: '42px', 
                  letterSpacing: '2px', 
                  color: 'white',
                  marginBottom: '8px'
                }}>
                  CHOOSE YOUR STARTER
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '24px' }}>
                  Your avatar for your trainer profile
                </p>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(4, 1fr)', 
                  gap: '12px', 
                  marginBottom: '24px' 
                }}>
                  {STARTERS.map((starter) => (
                    <button
                      key={starter.id}
                      onClick={() => setAvatarId(starter.id)}
                      style={{
                        width: '100px',
                        height: '110px',
                        borderRadius: '14px',
                        background: avatarId === starter.id ? 'rgba(139,92,246,0.12)' : '#11111e',
                        border: `1px solid ${avatarId === starter.id ? 'rgba(139,92,246,0.7)' : 'rgba(255,255,255,0.06)'}`,
                        padding: '8px 6px 10px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: avatarId === starter.id ? '0 0 20px rgba(139,92,246,0.3), 0 0 40px rgba(139,92,246,0.15)' : 'none',
                        transform: avatarId === starter.id ? 'scale(1.08)' : 'scale(1)'
                      }}
                    >
                      <img
                        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${starter.id}.png`}
                        alt={starter.name}
                        style={{ 
                          width: '72px', 
                          height: '72px', 
                          objectFit: 'contain', 
                          imageRendering: 'pixelated',
                          marginBottom: '6px',
                          filter: avatarId === starter.id ? 'drop-shadow(0 0 8px rgba(139,92,246,0.6))' : 'none'
                        }}
                      />
                      <span style={{ 
                        marginTop: '6px', 
                        fontSize: '11px', 
                        fontWeight: '600', 
                        textTransform: 'capitalize' as const,
                        color: avatarId === starter.id ? '#a78bfa' : '#94a3b8'
                      }}>
                        {starter.name}
                      </span>
                    </button>
                  ))}
                </div>

                <button 
                  onClick={handleContinue}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    border: 'none',
                    background: '#ef4444',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#dc2626'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#ef4444'}
                >
                  Continue →
                </button>
              </>
            )}

            {/* STEP 3 - Preferences */}
            {step === 3 && (
              <>
                <h2 style={{ color: 'white', fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
                  Customize Your Profile
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '20px' }}>
                  Control your privacy settings
                </p>

                {/* Profile Visibility */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                    Profile Visibility
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setIsPublic(true)}
                      style={{
                        flex: 1,
                        padding: '14px 16px',
                        borderRadius: '11px',
                        background: isPublic ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isPublic ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.07)'}`,
                        color: isPublic ? '#a78bfa' : '#9090a8',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: isPublic ? '0 0 16px rgba(139,92,246,0.1)' : 'none'
                      }}
                    >
                      <GlobeIcon />
                      <div style={{ fontSize: '14px', fontWeight: '600' }}>Public</div>
                      <div style={{ fontSize: '11px', opacity: 0.7 }}>Anyone can find you</div>
                    </button>
                    <button
                      onClick={() => setIsPublic(false)}
                      style={{
                        flex: 1,
                        padding: '14px 16px',
                        borderRadius: '11px',
                        background: !isPublic ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${!isPublic ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.07)'}`,
                        color: !isPublic ? '#a78bfa' : '#9090a8',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: !isPublic ? '0 0 16px rgba(139,92,246,0.1)' : 'none'
                      }}
                    >
                      <LockIcon />
                      <div style={{ fontSize: '14px', fontWeight: '600' }}>Private</div>
                      <div style={{ fontSize: '11px', opacity: 0.7 }}>Only you can see</div>
                    </button>
                  </div>
                </div>

                {/* Collection Value */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                    Collection Value
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setHideCollectionValue(false)}
                      style={{
                        flex: 1,
                        padding: '14px 16px',
                        borderRadius: '11px',
                        background: !hideCollectionValue ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${!hideCollectionValue ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.07)'}`,
                        color: !hideCollectionValue ? '#a78bfa' : '#9090a8',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: !hideCollectionValue ? '0 0 16px rgba(139,92,246,0.1)' : 'none'
                      }}
                    >
                      <EyeIcon />
                      <div style={{ fontSize: '14px', fontWeight: '600' }}>Show</div>
                      <div style={{ fontSize: '11px', opacity: 0.7 }}>Value visible</div>
                    </button>
                    <button
                      onClick={() => setHideCollectionValue(true)}
                      style={{
                        flex: 1,
                        padding: '14px 16px',
                        borderRadius: '11px',
                        background: hideCollectionValue ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${hideCollectionValue ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.07)'}`,
                        color: hideCollectionValue ? '#a78bfa' : '#9090a8',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: hideCollectionValue ? '0 0 16px rgba(139,92,246,0.1)' : 'none'
                      }}
                    >
                      <EyeOffIcon />
                      <div style={{ fontSize: '14px', fontWeight: '600' }}>Hide</div>
                      <div style={{ fontSize: '11px', opacity: 0.7 }}>Value private</div>
                    </button>
                  </div>
                </div>

                {/* Country */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                    Country <span style={{ color: '#94a3b8' }}>(optional)</span>
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '12px',
                      border: '1px solid rgba(255,255,255,0.08)',
                      background: '#11111e',
                      color: 'white',
                      fontSize: '15px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="" style={{ background: '#11111e' }}>Select a country</option>
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c} style={{ background: '#11111e' }}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Social Links */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                    Social Links <span style={{ color: '#94a3b8' }}>(optional)</span>
                  </label>
                  
                  <div style={{ position: 'relative', marginBottom: '10px' }}>
                    <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', zIndex: 1 }}>
                      <TwitterIcon />
                    </div>
                    <input
                      type="text"
                      value={twitterHandle}
                      onChange={(e) => setTwitterHandle(e.target.value)}
                      placeholder="@twitter"
                      style={{
                        width: '100%',
                        padding: '14px 14px 14px 42px',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.08)',
                        background: '#11111e',
                        color: 'white',
                        fontSize: '15px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                      onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                    />
                  </div>

                  <div style={{ position: 'relative', marginBottom: '10px' }}>
                    <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', zIndex: 1 }}>
                      <InstagramIcon />
                    </div>
                    <input
                      type="text"
                      value={instagramHandle}
                      onChange={(e) => setInstagramHandle(e.target.value)}
                      placeholder="@instagram"
                      style={{
                        width: '100%',
                        padding: '14px 14px 14px 42px',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.08)',
                        background: '#11111e',
                        color: 'white',
                        fontSize: '15px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                      onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                    />
                  </div>

                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', zIndex: 1 }}>
                      <TiktokIcon />
                    </div>
                    <input
                      type="text"
                      value={tiktokHandle}
                      onChange={(e) => setTiktokHandle(e.target.value)}
                      placeholder="@tiktok"
                      style={{
                        width: '100%',
                        padding: '14px 14px 14px 42px',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.08)',
                        background: '#11111e',
                        color: 'white',
                        fontSize: '15px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                      onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                    />
                  </div>
                </div>

                <button 
                  onClick={handleComplete}
                  disabled={saving}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    border: 'none',
                    background: saving ? '#ef444480' : '#ef4444',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => !saving && (e.currentTarget.style.background = '#dc2626')}
                  onMouseLeave={(e) => !saving && (e.currentTarget.style.background = '#ef4444')}
                >
                  {saving ? 'Saving...' : 'Complete Setup →'}
                </button>
              </>
            )}

            {/* Sign out */}
            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <button
                onClick={handleSignOut}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '13px' }}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - Visual Panel */}
        <div className="right-panel" style={{
          width: '55%',
          background: 'linear-gradient(135deg, #0e0820 0%, #160e30 40%, #0a1428 100%)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%'
        }}>
          {/* Grid Texture */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            pointerEvents: 'none'
          }} />
          
          {/* Ambient Glow Orbs */}
          <div style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.18), transparent 65%)',
            pointerEvents: 'none'
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-50px',
            left: '-50px',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(239,68,68,0.1), transparent 65%)',
            pointerEvents: 'none'
          }} />
          
          {/* Floating Cards */}
          <div style={{ position: 'relative', width: '380px', height: '240px' }}>
            <div className="float2" style={{
              position: 'absolute',
              left: '-10px',
              top: '50%',
              transform: 'translateY(-40%) rotate(-22deg)',
              width: '130px',
              height: '182px',
              borderRadius: '10px',
              background: 'linear-gradient(160deg, #0a1e14, #0e2a1a)',
              border: '1px solid rgba(34,197,94,0.4)',
              boxShadow: '0 16px 48px rgba(34,197,94,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              zIndex: 1
            }}>
              <img 
                src="https://images.pokemontcg.io/sv5/15_hires.png" 
                alt="Mewtwo ex"
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }}
              />
            </div>
            
            <div className="float1" style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%) rotate(-6deg)',
              width: '160px',
              height: '224px',
              borderRadius: '10px',
              background: 'linear-gradient(160deg, #1e1040, #2d1060, #1a0a3a)',
              border: '1px solid rgba(167,139,250,0.5)',
              boxShadow: '0 24px 64px rgba(139,92,246,0.4), 0 0 0 1px rgba(139,92,246,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              zIndex: 3
            }}>
              <img 
                src="https://images.pokemontcg.io/base1/4_hires.png" 
                alt="Charizard"
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }}
              />
            </div>
            
            <div className="float3" style={{
              position: 'absolute',
              right: '-10px',
              top: '50%',
              transform: 'translateY(-40%) rotate(18deg)',
              width: '130px',
              height: '182px',
              borderRadius: '10px',
              background: 'linear-gradient(160deg, #2a1408, #1e1006)',
              border: '1px solid rgba(245,158,11,0.4)',
              boxShadow: '0 16px 48px rgba(245,158,11,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              zIndex: 1
            }}>
              <img 
                src="https://images.pokemontcg.io/sv6/201_hires.png" 
                alt="Umbreon ex"
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }}
              />
            </div>
          </div>
          
          {/* Text */}
          <div style={{ textAlign: 'center', zIndex: 1, marginTop: '36px' }}>
            <h2 style={{
              fontFamily: 'Bebas Neue, sans-serif',
              fontSize: '28px',
              letterSpacing: '3px',
              background: 'linear-gradient(110deg, #f0c040, white)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '6px'
            }}>
              CATCH. TRADE. COLLECT.
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '13px' }}>
              Track every card. Know every value.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
