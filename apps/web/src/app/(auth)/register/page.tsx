'use client';

import { useState } from 'react';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const data = await response.json();
        
        if (data.errors && Array.isArray(data.errors)) {
          const messages = data.errors.map((err: any) => err.msg).join('. ');
          setError(messages);
        } else {
          setError(data.error || 'Registration failed');
        }
        return;
      }

      const data = await response.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.location.href = '/onboarding';
    } catch (err) {
      setError('An error occurred');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto' }}>
      <h1>Create Account</h1>
      
      {error && (
        <div style={{ color: 'red', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem' }}>
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem' }}>
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem' }}
          />
          <small style={{ color: '#666' }}>Min 8 characters, 1 uppercase letter, 1 number</small>
        </div>

        <button type="submit" style={{ width: '100%', padding: '0.75rem', cursor: 'pointer' }}>
          Create Account
        </button>
      </form>

      <div style={{ marginTop: '1rem', textAlign: 'center' }}>
        <a href="/api/auth/google">Sign in with Google</a>
      </div>

      <div style={{ marginTop: '1rem', textAlign: 'center' }}>
        Already have an account? <a href="/login">Sign in</a>
      </div>
    </div>
  );
}
