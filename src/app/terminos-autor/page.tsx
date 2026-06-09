import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Acuerdo de Autor — Epovox',
  description: 'Condiciones para autores que publican y venden sus obras en Epovox.',
};

export default function TerminosAutorPage() {
  const sectionStyle = { color: '#F2EDE4' };
  const paraStyle = { color: '#8A8478', lineHeight: 1.8 };
  const h2Style = { fontFamily: 'Georgia, serif', color: '#F2EDE4', fontSize: '1.15rem', fontWeight: 600, marginTop: '2rem', marginBottom: '0.5rem' };

  return (
    <div className="max-w-2xl mx-auto px-6 py-14">
      <div className="mb-10">
        <Link href="/" className="text-xs uppercase tracking-widest hover:opacity-70 transition-opacity" style={{ color: '#C9933A' }}>
          ← Volver
        </Link>
        <h1 className="mt-6 text-3xl font-bold" style={{ fontFamily: 'Georgia, serif', ...sectionStyle }}>
          Acuerdo de Autor
        </h1>
        <p className="mt-2 text-sm" style={{ color: '#8A8478' }}>Última actualización: junio 2026</p>
      </div>

      <div className="mb-8 px-4 py-3 rounded-xl text-xs" style={{ background: 'rgba(201,147,58,0.08)', border: '1px solid rgba(201,147,58,0.25)', color: '#C9933A' }}>
        Borrador inicial. Este texto debe ser revisado por un profesional legal antes de habilitar ventas reales.
      </div>

      <p style={paraStyle}>
        Estas condiciones se aplican a los autores que publican y venden sus obras en Epovox
        (<strong style={{ color: '#C9E4E4', fontWeight: 400 }}>epovox.com</strong>). Al publicar una obra de pago aceptás este acuerdo.
      </p>

      <h2 style={h2Style}>1. Titularidad y garantías</h2>
      <p style={paraStyle}>
        Declarás, según tu leal saber y entender, que la obra es <strong style={{ color: '#C9C3B8' }}>tuya y original</strong>,
        que tenés todos los derechos para publicarla y venderla, que no infringe derechos de terceros y que no
        contiene material ilegal.
      </p>

      <h2 style={h2Style}>2. Conservás tu obra</h2>
      <p style={paraStyle}>
        <strong style={{ color: '#C9C3B8' }}>Seguís siendo el titular de los derechos de autor de tu obra</strong> (Ley
        11.723). Nos otorgás una <strong style={{ color: '#C9C3B8' }}>licencia no exclusiva</strong> para alojarla,
        reproducirla, comunicarla públicamente, exhibirla y venderla en tu nombre dentro de Epovox. Podés retirar tu
        obra cuando quieras (quienes ya la compraron conservan su acceso).
      </p>

      <h2 style={h2Style}>3. Narración con voz IA</h2>
      <p style={paraStyle}>
        Autorizás expresamente que Epovox genere una versión en audio de tu texto mediante voz sintética (IA) para
        ofrecerla junto a la obra.
      </p>

      <h2 style={h2Style}>4. Precio y comisión</h2>
      <p style={paraStyle}>
        Vos fijás el precio de cada obra y de tu biblioteca, y podés editarlo cuando quieras. De cada venta recibís el
        <strong style={{ color: '#C9C3B8' }}> 70%</strong> y Epovox retiene el <strong style={{ color: '#C9C3B8' }}>30%</strong>.
        El cobro se realiza a través de tu propia cuenta de Mercado Pago, que conectás a la plataforma; el dinero
        ingresa directamente a tu cuenta.
      </p>

      <h2 style={h2Style}>5. Impuestos</h2>
      <p style={paraStyle}>
        Sos responsable de tus propias obligaciones impositivas (monotributo, AFIP, etc.) por los ingresos que generes.
      </p>

      <h2 style={h2Style}>6. Indemnidad</h2>
      <p style={paraStyle}>
        Te comprometés a mantener indemne a Epovox frente a reclamos de terceros derivados de tu obra, en la medida en
        que un tribunal determine tu responsabilidad.
      </p>

      <h2 style={h2Style}>7. Contenido prohibido</h2>
      <p style={paraStyle}>
        No se permite contenido que infrinja derechos de autor, plagios, ni material ilegal, difamatorio o de odio.
      </p>

      <div className="mt-12 pt-6" style={{ borderTop: '1px solid #2A2720' }}>
        <Link href="/" className="text-xs uppercase tracking-widest hover:opacity-70 transition-opacity" style={{ color: '#C9933A' }}>
          ← Volver a Epovox
        </Link>
      </div>
    </div>
  );
}
