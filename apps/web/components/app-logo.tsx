import Link from 'next/link';

export function AppLogo() {
  return (
    <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={{ fontWeight: 'bold', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>📸</span>
        <span>Studio Hut</span>
      </div>
    </Link>
  );
}