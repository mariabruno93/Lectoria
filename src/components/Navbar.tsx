import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-40 border-b" style={{ background: 'rgba(13,12,11,0.92)', borderColor: '#2A2720', backdropFilter: 'blur(8px)' }}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <polygon points="6,3 20,12 6,21" fill="#C9933A" />
          </svg>
          <span className="text-xl font-semibold" style={{ color: '#F2EDE4', fontFamily: 'Georgia, serif', letterSpacing: '-0.01em' }}>
            Lectoria
          </span>
        </Link>

        <div className="flex items-center gap-6">
          <Link href="/" className="nav-link text-sm">
            Inicio
          </Link>
          <Link href="/biblioteca" className="nav-link text-sm">
            Biblioteca
          </Link>
        </div>
      </div>
    </nav>
  );
}
