'use client';

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
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <a 
            href="#app-store"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              backgroundColor: '#000',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '500'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            Download on the App Store
          </a>
          <a 
            href="#google-play"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              backgroundColor: '#000',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '500'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M3 20.5v-17c0-.59.34-1.11.84-1.35L13.69 12l-9.85 9.85c-.5-.24-.84-.76-.84-1.35m13.81-5.38L6.05 21.34l8.49-8.49 2.27 2.27m3.35-4.31c.34.27.59.69.59 1.19s-.22.9-.57 1.18l-2.29 1.32-2.5-2.5 2.5-2.5 2.27 1.31M6.05 2.66l10.76 6.22-2.27 2.27L6.05 2.66z"/>
            </svg>
            Get it on Google Play
          </a>
        </div>
      </div>

      <div style={{ 
        padding: '1.5rem', 
        backgroundColor: '#f9fafb', 
        borderRadius: '8px',
        display: 'inline-block'
      }}>
        <p style={{ margin: 0, color: '#666' }}>
          Already have the app? <a href="/" style={{ color: '#3b82f6' }}>Open it to start scanning</a>
        </p>
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
