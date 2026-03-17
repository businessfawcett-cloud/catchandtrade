export default function NotFound() {
  return (
    <div style={{ margin: 0, minHeight: '100vh', background: '#0a0f1e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'white', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ fontSize: '80px', marginBottom: '16px' }}>⚡</div>
      <h1 style={{ fontSize: '48px', color: '#ffd700', margin: '0 0 8px' }}>404</h1>
      <p style={{ color: '#94a3b8', margin: '0 0 24px' }}>This page doesn't exist</p>
      <a href="/" style={{ background: '#e63946', color: 'white', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: '500' }}>Go Home</a>
    </div>
  );
}
