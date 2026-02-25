'use client';

import { useEffect, useState } from 'react';

export default function LoginStatus() {
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    setMounted(true);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/';
  };

  if (!mounted) {
    return null;
  }

  if (user) {
    return (
      <button onClick={handleLogout} style={{ cursor: 'pointer' }}>Logout</button>
    );
  }

  return (
    <>
      <a href="/login">Login</a>
      <a href="/register" style={{ marginLeft: '1rem' }}>Register</a>
    </>
  );
}
