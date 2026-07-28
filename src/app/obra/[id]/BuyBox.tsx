'use client';

import { useState } from 'react';
import Link from 'next/link';

type Props = {
  workId: string;
  authorId: string;
  authorName: string;
  price: number | null;
  libraryPrice: number | null;
  authorConnected: boolean;
  isLoggedIn: boolean;
};

const money = (n: number) => '$' + n.toLocaleString('es-AR');

export default function BuyBox({ workId, authorId, authorName, price, libraryPrice, authorConnected, isLoggedIn }: Props) {
  const [consented, setConsented] = useState(false);
  const [loading, setLoading] = useState<'single' | 'library' | null>(null);
  const [error, setError] = useState('');

  async function buy(tier: 'single' | 'library') {
    setLoading(tier); setError('');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorId, tier, workId, consented: true }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else { setError(data.error ?? 'No se pudo iniciar el pago.'); setLoading(null); }
    } catch {
      setError('No se pudo iniciar el pago.'); setLoading(null);
    }
  }

  if (!price || price <= 0) {
    return (
      <p className="text-sm" style={{ color: '#8A8478' }}>
        El autor todavía no definió el precio de esta obra.
      </p>
    );
  }

  if (!isLoggedIn) {
    return (
      <Link href={`/login?redirect=/obra/${workId}`}
        className="inline-block px-6 py-3 rounded-full text-sm font-semibold transition-opacity hover:opacity-80"
        style={{ background: '#C9933A', color: '#fff' }}>
        Iniciá sesión para comprar · {money(price)}
      </Link>
    );
  }

  if (!authorConnected) {
    return (
      <p className="text-sm" style={{ color: '#8A8478' }}>
        Este autor todavía no configuró sus cobros. Volvé pronto.
      </p>
    );
  }

  return (
    <div className="max-w-sm mx-auto text-left">
      {/* Consentimiento */}
      <label className="flex items-start gap-2 mb-4 cursor-pointer">
        <input type="checkbox" checked={consented} onChange={e => setConsented(e.target.checked)}
          className="mt-0.5 flex-shrink-0" style={{ accentColor: '#C9933A' }} />
        <span className="text-xs" style={{ color: '#8A8478', lineHeight: 1.5 }}>
          Entiendo que compro una licencia de acceso personal e intransferible y acepto los{' '}
          <Link href="/terminos" style={{ color: '#C9933A' }}>Términos de compra</Link>. Acepto acceder al
          contenido de inmediato; una vez que accedo, pierdo el derecho de arrepentimiento.
        </span>
      </label>

      <button
        onClick={() => buy('single')}
        disabled={!consented || loading !== null}
        className="w-full py-3 rounded-full text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
        style={{ background: '#009EE3', color: '#fff' }}>
        {loading === 'single' ? 'Redirigiendo a Mercado Pago…' : `Comprar esta obra · ${money(price)}`}
      </button>

      {libraryPrice && libraryPrice > 0 && (
        <button
          onClick={() => buy('library')}
          disabled={!consented || loading !== null}
          className="w-full py-2.5 mt-3 rounded-full text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
          style={{ background: '#1A1816', color: '#C9933A', border: '1px solid #C9933A40' }}>
          {loading === 'library' ? 'Redirigiendo…' : `Comprar toda la biblioteca de ${authorName} · ${money(libraryPrice)}`}
        </button>
      )}

      {error && (
        <p className="text-xs mt-3 py-2 px-3 rounded-lg" style={{ background: '#2D0A0A', color: '#ef4444' }}>{error}</p>
      )}
    </div>
  );
}
