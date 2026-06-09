import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Botón de arrepentimiento — Epovox',
  description: 'Ejercé tu derecho de arrepentimiento de una compra en Epovox (Ley 24.240).',
};

export default function ArrepentimientoPage() {
  const sectionStyle = { color: '#F2EDE4' };
  const paraStyle = { color: '#8A8478', lineHeight: 1.8 };
  const h2Style = { fontFamily: 'Georgia, serif', color: '#F2EDE4', fontSize: '1.15rem', fontWeight: 600, marginTop: '2rem', marginBottom: '0.5rem' };

  const asunto = encodeURIComponent('Solicitud de arrepentimiento — Epovox');
  const cuerpo = encodeURIComponent(
    'Quiero ejercer mi derecho de arrepentimiento sobre la siguiente compra:\n\n' +
    '- Email con el que compré:\n- Obra / biblioteca comprada:\n- Fecha de la compra:\n\n' +
    'Declaro que aún no accedí al contenido.'
  );

  return (
    <div className="max-w-2xl mx-auto px-6 py-14">
      <div className="mb-10">
        <Link href="/" className="text-xs uppercase tracking-widest hover:opacity-70 transition-opacity" style={{ color: '#C9933A' }}>
          ← Volver
        </Link>
        <h1 className="mt-6 text-3xl font-bold" style={{ fontFamily: 'Georgia, serif', ...sectionStyle }}>
          Botón de arrepentimiento
        </h1>
      </div>

      <p style={paraStyle}>
        Si compraste una obra en Epovox y querés <strong style={{ color: '#C9C3B8' }}>cancelar la operación</strong>,
        tenés derecho a hacerlo dentro de los <strong style={{ color: '#C9C3B8' }}>10 días corridos</strong> desde la
        compra, sin tener que dar explicaciones y sin ningún costo, según la Ley 24.240 de Defensa del Consumidor.
        No necesitás registrarte ni iniciar sesión para ejercer este derecho.
      </p>

      <h2 style={h2Style}>Importante sobre el contenido digital</h2>
      <p style={paraStyle}>
        Como las obras son contenido digital de ejecución inmediata, el derecho de arrepentimiento aplica
        <strong style={{ color: '#C9C3B8' }}> siempre que todavía no hayas accedido</strong> a la obra. Si ya la leíste
        o escuchaste, el contenido se considera consumido y el reembolso puede no corresponder.
      </p>

      <h2 style={h2Style}>Cómo ejercerlo</h2>
      <p style={paraStyle}>
        Escribinos a <strong style={{ color: '#C9C3B8' }}>brunomariaok@gmail.com</strong> con los datos de tu compra.
        Te confirmaremos la cancelación dentro de las 24 horas por el mismo medio.
      </p>

      <a
        href={`mailto:brunomariaok@gmail.com?subject=${asunto}&body=${cuerpo}`}
        className="inline-block mt-4 px-6 py-3 rounded-full text-sm font-semibold transition-opacity hover:opacity-80"
        style={{ background: '#C9933A', color: '#fff' }}
      >
        Solicitar el arrepentimiento por email
      </a>

      <div className="mt-12 pt-6" style={{ borderTop: '1px solid #2A2720' }}>
        <Link href="/" className="text-xs uppercase tracking-widest hover:opacity-70 transition-opacity" style={{ color: '#C9933A' }}>
          ← Volver a Epovox
        </Link>
      </div>
    </div>
  );
}
