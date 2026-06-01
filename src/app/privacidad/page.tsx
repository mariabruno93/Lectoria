import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Política de Privacidad — Epovox',
  description: 'Política de privacidad y uso de datos de Epovox.',
};

export default function PrivacidadPage() {
  const sectionStyle = { color: '#F2EDE4' };
  const paraStyle = { color: '#8A8478', lineHeight: 1.8 };
  const h2Style = { fontFamily: 'Georgia, serif', color: '#F2EDE4', fontSize: '1.15rem', fontWeight: 600, marginTop: '2rem', marginBottom: '0.5rem' };

  return (
    <div className="max-w-2xl mx-auto px-6 py-14">
      {/* Encabezado */}
      <div className="mb-10">
        <Link href="/" className="text-xs uppercase tracking-widest hover:opacity-70 transition-opacity" style={{ color: '#C9933A' }}>
          ← Volver
        </Link>
        <h1 className="mt-6 text-3xl font-bold" style={{ fontFamily: 'Georgia, serif', ...sectionStyle }}>
          Política de Privacidad
        </h1>
        <p className="mt-2 text-sm" style={{ color: '#8A8478' }}>
          Última actualización: junio 2026
        </p>
      </div>

      {/* Intro */}
      <p style={paraStyle}>
        Epovox (<strong style={{ color: '#C9E4E4', fontWeight: 400 }}>epovox.com</strong>) es una plataforma gratuita
        de audiolibros clásicos. Esta política explica qué datos recopilamos, por qué y cómo los usamos.
      </p>

      {/* 1 */}
      <h2 style={h2Style}>1. Datos que recopilamos</h2>
      <p style={paraStyle}>
        <strong style={{ color: '#C9C3B8' }}>Visitantes sin cuenta:</strong> No recopilamos ningún dato personal
        identificable. El servicio funciona completamente sin registro.
      </p>
      <p style={{ ...paraStyle, marginTop: '0.75rem' }}>
        <strong style={{ color: '#C9C3B8' }}>Usuarios registrados (opcional):</strong> Si creás una cuenta, almacenamos
        tu dirección de email y, opcionalmente, el nombre que vos elijas. Esto lo usamos únicamente para guardar
        tu progreso de lectura (qué libros seguís o terminaste).
      </p>

      {/* 2 */}
      <h2 style={h2Style}>2. Cookies y publicidad</h2>
      <p style={paraStyle}>
        Epovox muestra publicidad a través de <strong style={{ color: '#C9C3B8' }}>Google AdSense</strong> para
        financiar el servicio gratuito. Google puede usar cookies para personalizar anuncios según tus intereses
        y tu actividad de navegación. Podés gestionar o deshabilitar estas cookies en{' '}
        <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer"
          style={{ color: '#C9933A', textDecoration: 'underline' }}>
          adssettings.google.com
        </a>.
      </p>
      <p style={{ ...paraStyle, marginTop: '0.75rem' }}>
        Google también puede recopilar datos de uso anonimizados para mejorar sus servicios. Para más información,
        consultá la{' '}
        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer"
          style={{ color: '#C9933A', textDecoration: 'underline' }}>
          Política de Privacidad de Google
        </a>.
      </p>

      {/* 3 */}
      <h2 style={h2Style}>3. Cómo usamos tus datos</h2>
      <ul style={{ ...paraStyle, paddingLeft: '1.25rem', listStyleType: 'disc' }}>
        <li style={{ marginBottom: '0.4rem' }}>Guardar tu progreso de lectura y lista de seguidos.</li>
        <li style={{ marginBottom: '0.4rem' }}>Mostrarte estadísticas de reproducción (anónimas).</li>
        <li style={{ marginBottom: '0.4rem' }}>Mejorar la experiencia y el catálogo de la plataforma.</li>
        <li>Mostrar publicidad relevante a través de Google AdSense.</li>
      </ul>
      <p style={{ ...paraStyle, marginTop: '0.75rem' }}>
        <strong style={{ color: '#C9C3B8' }}>No vendemos</strong> ni compartimos tu información personal con terceros,
        salvo los proveedores de servicio mencionados (Google AdSense, Supabase para la base de datos).
      </p>

      {/* 4 */}
      <h2 style={h2Style}>4. Seguridad</h2>
      <p style={paraStyle}>
        La autenticación y el almacenamiento de datos están gestionados por{' '}
        <a href="https://supabase.com" target="_blank" rel="noopener noreferrer"
          style={{ color: '#C9933A', textDecoration: 'underline' }}>
          Supabase
        </a>
        , que aplica encriptación en tránsito (HTTPS) y en reposo. Las contraseñas se almacenan
        con hash seguro y nunca en texto plano.
      </p>

      {/* 5 */}
      <h2 style={h2Style}>5. Tus derechos</h2>
      <p style={paraStyle}>
        Podés solicitar la eliminación completa de tu cuenta y tus datos en cualquier momento escribiéndonos a{' '}
        <a href="mailto:privacidad@epovox.com" style={{ color: '#C9933A', textDecoration: 'underline' }}>
          privacidad@epovox.com
        </a>
        . Procesamos estas solicitudes en un plazo máximo de 30 días.
      </p>

      {/* 6 */}
      <h2 style={h2Style}>6. Menores de edad</h2>
      <p style={paraStyle}>
        Epovox no está dirigido a personas menores de 13 años. Si sos menor, necesitás el permiso de un
        adulto para usar el servicio.
      </p>

      {/* 7 */}
      <h2 style={h2Style}>7. Cambios a esta política</h2>
      <p style={paraStyle}>
        Podemos actualizar esta política en cualquier momento. Los cambios importantes se notificarán
        en la plataforma. El uso continuado del servicio implica la aceptación de la política vigente.
      </p>

      {/* 8 */}
      <h2 style={h2Style}>8. Contacto</h2>
      <p style={paraStyle}>
        Consultas sobre privacidad:{' '}
        <a href="mailto:privacidad@epovox.com" style={{ color: '#C9933A', textDecoration: 'underline' }}>
          privacidad@epovox.com
        </a>
      </p>

      {/* Volver */}
      <div className="mt-14 pt-8 border-t" style={{ borderColor: '#2A2720' }}>
        <Link href="/"
          className="inline-flex items-center gap-2 text-sm hover:opacity-70 transition-opacity"
          style={{ color: '#8A8478' }}>
          ← Volver a Epovox
        </Link>
      </div>
    </div>
  );
}
