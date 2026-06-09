import Link from 'next/link';

const links = [
  { href: '/privacidad', label: 'Privacidad' },
  { href: '/terminos', label: 'Términos de compra' },
  { href: '/arrepentimiento', label: 'Botón de arrepentimiento' },
  { href: '/terminos-autor', label: 'Para autores' },
];

export default function Footer() {
  return (
    <footer className="mt-16 py-8 px-6" style={{ borderTop: '1px solid #2A2720' }}>
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs" style={{ color: '#6A6460' }}>
          © {2026} Epovox · Audiolibros
        </p>
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          {links.map(l => (
            <Link key={l.href} href={l.href}
              className="text-xs transition-opacity hover:opacity-70"
              style={{ color: '#8A8478' }}>
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
