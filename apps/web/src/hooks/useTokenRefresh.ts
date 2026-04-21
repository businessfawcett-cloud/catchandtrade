'use client';

import { useEffect, useRef } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export function useTokenRefresh() {
  const refreshing = useRef(false);

  useEffect(() => {
    // Check and refresh token every 5 minutes
    const checkToken = async () => {
      const token = localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refreshToken');

      // No tokens to refresh
      if (!token || !refreshToken) return;

      // Already refreshing, skip
      if (refreshing.current) return;

      try {
        // Decode JWT to check expiration
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
          console.log('[TokenRefresh] Invalid token format, clearing');
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          return;
        }
        
        let payload;
        try {
          payload = JSON.parse(atob(tokenParts[1]));
        } catch {
          console.log('[TokenRefresh] Failed to decode token, clearing');
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          return;
        }
        
        if (!payload.exp) {
          console.log('[TokenRefresh] No expiration in token');
          return;
        }
        
        const exp = payload.exp * 1000;
        const now = Date.now();
        const timeUntilExpiry = exp - now;

        // Refresh if token expires in less than 10 minutes
        if (timeUntilExpiry < 10 * 60 * 1000) {
          refreshing.current = true;
          
          const response = await fetch(`${API_URL}/api/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
          });

          if (response.ok) {
            const data = await response.json();
            localStorage.setItem('token', data.token);
            localStorage.setItem('refreshToken', data.refreshToken);
            console.log('[TokenRefresh] Token refreshed successfully');
          } else {
            // Refresh token also expired, clear tokens
            console.log('[TokenRefresh] Refresh token expired, logging out');
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }
          
          refreshing.current = false;
        }
      } catch (err) {
        console.error('[TokenRefresh] Error:', err);
        refreshing.current = false;
      }
    };

    // Check immediately
    checkToken();

    // Then check every 5 minutes
    const interval = setInterval(checkToken, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);
}
