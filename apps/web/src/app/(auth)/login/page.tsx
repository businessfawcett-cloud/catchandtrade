'use client';

import { useState } from 'react';
import Link from 'next/link';

const FloatingPokeball = ({ delay, left, top }: { delay: number; left: string; top: string }) => (
  <div 
    className="absolute opacity-10 animate-float"
    style={{ 
      left, 
      top, 
      animationDelay: `${delay}s`,
      animationDuration: '10s'
    }}
  >
    <svg width="60" height="60" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="48" fill="#e63946" stroke="#0a0f1e" strokeWidth="4" />
      <rect x="2" y="46" width="96" height="8" fill="#0a0f1e" />
      <circle cx="50" cy="50" r="14" fill="#ffffff" stroke="#0a0f1e" strokeWidth="4" />
      <circle cx="50" cy="50" r="6" fill="#0a0f1e" />
    </svg>
  </div>
);

const PokeballLogo = () => (
  <svg width="60" height="60" viewBox="0 0 100 100" className="mx-auto mb-4">
    <defs>
      <linearGradient id="pokeballGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ff6b6b" />
        <stop offset="50%" stopColor="#e63946" />
        <stop offset="100%" stopColor="#c1121f" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="48" fill="url(#pokeballGrad)" stroke="#0a0f1e" strokeWidth="4" />
    <rect x="2" y="46" width="96" height="8" fill="#0a0f1e" />
    <circle cx="50" cy="50" r="14" fill="#ffffff" stroke="#0a0f1e" strokeWidth="4" />
    <circle cx="50" cy="50" r="6" fill="#0a0f1e" />
  </svg>
);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

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
      localStorage.setItem('user', JSON.stringify(data.user));
      window.location.href = data.user.username ? '/' : '/onboarding';
    } catch (err) {
      setError('An error occurred');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1529 50%, #0f1a2e 100%)' }}>
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <FloatingPokeball delay={0} left="5%" top="10%" />
        <FloatingPokeball delay={2} left="85%" top="15%" />
        <FloatingPokeball delay={4} left="75%" top="70%" />
        <FloatingPokeball delay={1} left="20%" top="80%" />
        <FloatingPokeball delay={3} left="50%" top="90%" />
        
        {/* Background Pokemon Silhouette */}
        <div className="absolute right-10 bottom-20 opacity-5">
          <img 
            src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png" 
            alt="" 
            className="w-64 h-64 object-contain"
          />
        </div>
      </div>

      {/* Login Card */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div 
          className="w-full max-w-md p-8 rounded-2xl"
          style={{ 
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          <PokeballLogo />
          
          <h1 className="font-rajdhani text-3xl font-bold text-white text-center mb-8">
            Welcome Back
          </h1>
          
          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm text-poke-text-muted mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg text-white placeholder-gray-500 focus:outline-none"
                style={{ background: '#1a2332', border: '1px solid #374151' }}
                onFocus={(e) => e.target.style.borderColor = '#e63946'}
                onBlur={(e) => e.target.style.borderColor = '#374151'}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm text-poke-text-muted mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg text-white placeholder-gray-500 focus:outline-none"
                style={{ background: '#1a2332', border: '1px solid #374151' }}
                onFocus={(e) => e.target.style.borderColor = '#e63946'}
                onBlur={(e) => e.target.style.borderColor = '#374151'}
              />
            </div>

            <button 
              type="submit" 
              className="w-full py-3 rounded-full font-bold text-white transition-all shadow-lg"
              style={{ 
                background: 'linear-gradient(to right, #e63946, #c1121f)',
                boxShadow: '0 4px 15px rgba(230, 57, 70, 0.3)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 25px rgba(230, 57, 70, 0.5)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 4px 15px rgba(230, 57, 70, 0.3)'}
            >
              Sign In
            </button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
            <span className="text-poke-text-muted text-sm">or</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
          </div>

          <a 
            href="/api/auth/google"
            className="flex items-center justify-center gap-3 w-full py-3 rounded-lg font-medium transition-all"
            style={{ 
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </a>

          <p className="mt-8 text-center text-poke-text-muted">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-poke-gold hover:underline font-medium">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
