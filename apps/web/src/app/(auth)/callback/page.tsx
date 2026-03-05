'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PokeballLoader from '@/components/PokeballLoader';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.catchandtrade.com';

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const errorParam = params.get('error');

    if (errorParam) {
      setError(errorParam);
      return;
    }

    if (token) {
      localStorage.setItem('token', token);
      fetch(`${API_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(user => {
          localStorage.setItem('user', JSON.stringify(user));
          window.location.href = user.username ? '/' : '/onboarding';
        })
        .catch(() => {
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
