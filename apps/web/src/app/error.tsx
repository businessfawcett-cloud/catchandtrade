'use client';

export const dynamic = 'force-dynamic';

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div style={{ margin: 0, minHeight: '100vh', background: '#0a0f1e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'white', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ fontSize: '80px', marginBottom: '16px' }}>🔴</div>
      <h1 style={{ fontSize: '48px', color: '#e63946', margin: '0 0 8px' }}>500</h1>
      <p style={{ color: '#94a3b8', margin: '0 0 24px' }}>Something went wrong</p>
      <button onClick={reset} style={{ background: '#e63946', color: 'white', padding: '12px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '500', fontSize: '16px' }}>Try Again</button>
    </div>
  );
}
