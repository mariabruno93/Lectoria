import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Términos de compra — Epovox',
  description: 'Términos y condiciones de compra de obras en Epovox.',
};

export default function TerminosPage() {
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
          Términos de compra
        </h1>
        <p className="mt-2 text-sm" style={{ color: '#8A8478' }}>Última actualización: junio 2026</p>
      </div>

      <div className="mb-8 px-4 py-3 rounded-xl text-xs" style={{ background: 'rgba(201,147,58,0.08)', border: '1px solid rgba(201,147,58,0.25)', color: '#C9933A' }}>
        Borrador inicial. Este texto debe ser revisado por un profesional legal antes de habilitar ventas reales.
      </div>

      <p style={paraStyle}>
        Estos términos regulan la compra de obras de autores independientes en Epovox
        (<strong style={{ color: '#C9E4E4', fontWeight: 400 }}>epovox.com</strong>). Al comprar, aceptás estas condiciones.
      </p>

      <h2 style={h2Style}>1. Qué estás comprando</h2>
      <p style={paraStyle}>
        Al pagar una obra (o la biblioteca de un autor) obtenés una <strong style={{ color: '#C9C3B8' }}>licencia de
        acceso personal e intransferible</strong> para leerla y escucharla dentro de Epovox. <strong style={{ color: '#C9C3B8' }}>No
        adquirís la propiedad de la obra</strong> ni derechos de autor. No podés revender, redistribuir, copiar,
        descargar (salvo donde se ofrezca) ni compartir el contenido con terceros.
      </p>

      <h2 style={h2Style}>2. Alcance y duración del acceso</h2>
      <p style={paraStyle}>
        La compra de una obra habilita el acceso a esa obra. La compra de la biblioteca de un autor habilita el
        acceso a todas sus obras de pago, presentes y futuras. El acceso se mantiene mientras la obra siga publicada
        en Epovox y mientras exista tu cuenta.
      </p>

      <h2 style={h2Style}>3. Precio, pago e impuestos</h2>
      <p style={paraStyle}>
        Los precios están expresados en pesos argentinos (ARS) e incluyen los impuestos aplicables. El precio de cada
        obra lo fija su autor. El pago se procesa a través de <strong style={{ color: '#C9C3B8' }}>Mercado Pago</strong>;
        Epovox no almacena los datos de tu tarjeta. De cada compra, el autor recibe el 70% y Epovox retiene el 30%
        como comisión de la plataforma.
      </p>

      <h2 style={h2Style}>4. Derecho de arrepentimiento y su excepción</h2>
      <p style={paraStyle}>
        Por la Ley 24.240, tenés derecho a arrepentirte de la compra dentro de los <strong style={{ color: '#C9C3B8' }}>10
        días corridos</strong>. Sin embargo, al tratarse de <strong style={{ color: '#C9C3B8' }}>contenido digital de
        ejecución inmediata</strong>, si elegís acceder al contenido en el momento de la compra, prestás tu
        consentimiento expreso a esa ejecución inmediata y reconocés que, una vez que accedés a la obra, decae el
        derecho de arrepentimiento (art. 1116 del Código Civil y Comercial). Si todavía no accediste a la obra,
        podés ejercer tu derecho desde el <Link href="/arrepentimiento" style={{ color: '#C9933A' }}>botón de arrepentimiento</Link>.
      </p>

      <h2 style={h2Style}>5. Reembolsos</h2>
      <p style={paraStyle}>
        Devolvemos el importe si todavía no accediste a la obra y solicitás el arrepentimiento dentro del plazo, o si
        hubo un problema técnico que te impidió acceder al contenido que compraste.
      </p>

      <h2 style={h2Style}>6. Responsabilidad sobre el contenido</h2>
      <p style={paraStyle}>
        Las obras son creadas por autores independientes, responsables de su contenido y de tener los derechos para
        publicarlas. Epovox actúa como plataforma. Si una obra infringe derechos de terceros, podés reportarla y la
        retiraremos.
      </p>

      <div className="mt-12 pt-6" style={{ borderTop: '1px solid #2A2720' }}>
        <Link href="/" className="text-xs uppercase tracking-widest hover:opacity-70 transition-opacity" style={{ color: '#C9933A' }}>
          ← Volver a Epovox
        </Link>
      </div>
    </div>
  );
}
