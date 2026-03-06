'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PokeballLoader from '@/components/PokeballLoader';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.catchandtrade.com';

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Callback: page loaded');
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const errorParam = params.get('error');

    console.log('Callback: token:', token ? 'exists' : 'missing');
    console.log('Callback: error:', errorParam);

    if (errorParam) {
      setError(errorParam);
      return;
    }

    if (token) {
      localStorage.setItem('token', token);
      console.log('Callback: token saved, fetching user...');
      fetch(`${API_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          console.log('Callback: /users/me status:', res.status);
          if (!res.ok) {
            // If API fails, still try to save token and redirect
            console.log('Callback: User fetch failed, but saving token anyway');
            window.location.href = '/';
            return null;
          }
          return res.json();
        })
        .then(user => {
          console.log('Callback: user response:', user);
          if (user && user.username) {
            localStorage.setItem('user', JSON.stringify(user));
            console.log('Callback: user saved to localStorage');
            window.location.href = '/';
          } else {
            console.log('Callback: no username, going to onboarding');
            window.location.href = '/onboarding';
          }
        })
        .catch(err => {
          console.error('OAuth callback error:', err);
          // Even on error, save token and try home page
          window.location.href = '/';
        });
    } else {
      setError('No token provided');
    }
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1529 50%, #0f1a2e 100%)' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Authentication Failed</h1>
          <p className="text-poke-text-muted mb-6">{error}</p>
          <a href="/login" className="text-poke-gold hover:underline">Try again</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1529 50%, #0f1a2e 100%)' }}>
      <div className="text-center">
        <PokeballLoader size="lg" />
        <p className="mt-4 text-poke-text-muted">Completing sign in...</p>
      </div>
    </div>
  );
}
