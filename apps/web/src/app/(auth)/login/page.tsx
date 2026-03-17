'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const EnvelopeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M22 6L12 13 2 6" />
  </svg>
);

const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const PokeballWatermark = () => (
  <svg width="240" height="240" viewBox="0 0 100 100" style={{ position: 'absolute', bottom: '-40px', right: '-40px', opacity: 0.025, pointerEvents: 'none' }}>
    <circle cx="50" cy="50" r="48" fill="none" stroke="white" strokeWidth="2" />
    <line x1="2" y1="50" x2="98" y2="50" stroke="white" strokeWidth="2" />
    <circle cx="50" cy="50" r="14" fill="none" stroke="white" strokeWidth="2" />
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    document.body.classList.add('hide-nav');
    return () => {
      document.body.classList.remove('hide-nav');
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Login failed');
        return;
      }

      const data = await response.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      // Redirect back to previous page or homepage
      const returnUrl = sessionStorage.getItem('returnUrl') || '/';
      sessionStorage.removeItem('returnUrl');
      window.location.href = data.user.username ? returnUrl : '/onboarding';
    } catch (err) {
      setError('An error occurred');
    }
  };

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
        
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        
        .float1 { animation: float1 4s ease-in-out infinite; }
        .float2 { animation: float2 5s ease-in-out infinite; }
        .float3 { animation: float3 4.5s ease-in-out infinite; }
        .shimmer {
          background: linear-gradient(105deg, transparent 25%, rgba(167,139,250,0.12) 50%, transparent 75%);
          background-size: 200% 100%;
          animation: shimmer 3s linear infinite;
        }
        
        @media (max-width: 768px) {
          .right-panel { display: none !important; }
          .left-panel { width: 100% !important; }
        }
      `}</style>
      
      <div className="h-screen overflow-hidden flex" style={{ fontFamily: 'DM Sans, sans-serif' }}>
        {/* LEFT COLUMN - Form */}
        <div className="left-panel" style={{ 
          width: '45%', 
          background: '#0a0a14',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          overflow: 'hidden'
        }}>
          {/* Subtle glow bottom-left */}
          <div style={{
            position: 'absolute',
            bottom: '-150px',
            left: '-150px',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(239,68,68,0.06), transparent 70%)',
            pointerEvents: 'none'
          }} />
          
          {/* Pokeball watermark */}
          <PokeballWatermark />
          
          {/* Centered content block */}
          <div style={{
            width: '100%',
            maxWidth: '340px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingBottom: '20px'
          }}>
            {/* Logo + Brand Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <img 
                src="/Logo.png" 
                alt="Catch & Trade" 
                style={{ height: '36px', width: 'auto' }} 
              />
              <h1 style={{
                fontFamily: 'Bebas Neue, sans-serif',
                fontSize: '16px',
                letterSpacing: '3px',
                background: 'linear-gradient(110deg, #f0c040, #ef8c44, #ef4444)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                CATCH & TRADE
              </h1>
            </div>
            
            {/* Form Title */}
            <h2 style={{ color: 'white', fontSize: '28px', fontWeight: '700', marginBottom: '0.25rem', textAlign: 'center' }}>
              Welcome Back
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '20px', textAlign: 'center' }}>
              Sign in to your collection
            </p>
            
            {/* Error */}
            {error && (
              <div style={{ 
                marginBottom: '1.5rem', 
                padding: '0.75rem', 
                borderRadius: '8px', 
                background: 'rgba(239,68,68,0.1)', 
                border: '1px solid rgba(239,68,68,0.3)',
                color: '#f87171',
                textAlign: 'center',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}
            
            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              {/* Email Input */}
              <label htmlFor="email" className="sr-only">Email</label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                  zIndex: 1
                }}>
                  <EnvelopeIcon />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  required
                  style={{
                    width: '100%',
                    padding: '14px 14px 14px 44px',
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
              
              {/* Password Input */}
              <label htmlFor="password" className="sr-only">Password</label>
              <div style={{ position: 'relative', marginTop: '12px' }}>
                <div style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                  zIndex: 1
                }}>
                  <LockIcon />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  style={{
                    width: '100%',
                    padding: '14px 44px 14px 44px',
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
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              
              {/* Sign In Button */}
              <button 
                type="submit"
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
                  marginTop: '16px',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#dc2626'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#ef4444'}
              >
                Sign In
              </button>
            </form>
            
            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '20px 0', width: '100%' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
              <span style={{ color: '#64748b', fontSize: '13px' }}>or</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
            </div>
            
            {/* Google Button */}
            <a 
              href={`${process.env.NEXT_PUBLIC_API_URL || 'https://api.catchandtrade.com'}/api/auth/google`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.03)',
                color: 'white',
                fontSize: '15px',
                fontWeight: '500',
                textDecoration: 'none',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
            >
              <GoogleIcon />
              Sign in with Google
            </a>
            
            {/* Footer */}
            <p style={{ marginTop: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
              Don&apos;t have an account?{' '}
              <Link href="/register" style={{ color: '#ffd700', textDecoration: 'none', fontWeight: '500' }}>
                Create one
              </Link>
            </p>
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
          {/* Grid Texture Overlay */}
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
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(240,192,64,0.07), transparent 65%)',
            pointerEvents: 'none'
          }} />
          
          {/* Floating Cards Container */}
          <div style={{ position: 'relative', width: '380px', height: '240px' }}>
            {/* Card 2 - Left, Whimsicott */}
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
            
            {/* Card 1 - Center, Charizard */}
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
              boxShadow: '0 24px 64px rgba(139,92,246,0.4), 0 0 0 1px rgba(139,92,246,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
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
              <div className="shimmer" style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', zIndex: 1 }} />
            </div>
            
            {/* Card 3 - Right, Blissey */}
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
