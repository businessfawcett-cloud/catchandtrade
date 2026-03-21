'use client';

import Link from 'next/link';

export default function ScanPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem', textAlign: 'center' }}>
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ 
          width: '120px', 
          height: '120px', 
          margin: '0 auto 2rem',
          backgroundColor: '#ef4444',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'pulse 2s infinite'
        }}>
          <svg width="60" height="60" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Scan Cards with Your Phone</h1>
        <p style={{ fontSize: '1.125rem', color: '#666', maxWidth: '500px', margin: '0 auto' }}>
          Point your camera at any Pokemon card and instantly see its value, add it to your portfolio, and track your collection
        </p>
      </div>

      <div style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center', maxWidth: '200px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📷</div>
            <h3 style={{ marginBottom: '0.5rem' }}>Instant Recognition</h3>
            <p style={{ color: '#666', fontSize: '0.875rem' }}>Identify any Pokemon card in seconds</p>
          </div>
          <div style={{ textAlign: 'center', maxWidth: '200px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💰</div>
            <h3 style={{ marginBottom: '0.5rem' }}>Real-Time Prices</h3>
            <p style={{ color: '#666', fontSize: '0.875rem' }}>See current market value instantly</p>
          </div>
          <div style={{ textAlign: 'center', maxWidth: '200px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📁</div>
            <h3 style={{ marginBottom: '0.5rem' }}>One-Tap Portfolio</h3>
            <p style={{ color: '#666', fontSize: '0.875rem' }}>Add directly to your collection</p>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '3rem' }}>
        <div style={{ 
          padding: '1.5rem', 
          backgroundColor: 'rgba(230, 57, 70, 0.1)', 
          borderRadius: '12px',
          border: '1px solid rgba(230, 57, 70, 0.3)',
          display: 'inline-block'
        }}>
          <p style={{ margin: 0, color: '#e63946', fontWeight: '600' }}>
            📱 Mobile App Coming Soon
          </p>
          <p style={{ margin: '0.5rem 0 0', color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
            The scanning feature is available in our mobile app. Sign up to get notified when it&apos;s ready!
          </p>
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <Link 
          href="/register"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            backgroundColor: '#e63946',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: '600'
          }}
        >
          Get Started Free
        </Link>
      </div>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
