import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Acerca de Epovox — Clásicos de la literatura en audio',
  description:
    'Epovox es una biblioteca curada de cuentos y clásicos de la literatura, narrados en audio y con lectura sincronizada. Qué es, cómo funciona y por qué es gratis.',
  alternates: { canonical: '/acerca' },
};

export default function AcercaPage() {
  const h2 = { fontFamily: 'Georgia, serif', color: '#F2EDE4', fontSize: '1.35rem', fontWeight: 600, marginTop: '2.5rem', marginBottom: '0.75rem' } as const;
  const p = { color: '#B4ADA2', lineHeight: 1.9, fontSize: '1.02rem', marginBottom: '1rem' } as const;

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <Link href="/" className="text-xs uppercase tracking-widest hover:opacity-70 transition-opacity" style={{ color: '#C9933A' }}>
        ← Volver
      </Link>

      <h1 className="mt-6 mb-4 text-4xl font-bold" style={{ fontFamily: 'Georgia, serif', color: '#F2EDE4' }}>
        Acerca de Epovox
      </h1>
      <p style={{ ...p, fontSize: '1.1rem', color: '#C9C3B8' }}>
        Epovox es una biblioteca curada de cuentos y clásicos de la literatura para <strong style={{ color: '#F2EDE4', fontWeight: 600 }}>escuchar
        y leer al mismo tiempo</strong>, de forma completamente gratuita. Reunimos en un solo lugar las grandes obras de autores como Edgar
        Allan Poe, Horacio Quiroga, Emilia Pardo Bazán, Antón Chéjov o Katherine Mansfield, narradas en audio y acompañadas de su texto.
      </p>

      <h2 style={h2}>Por qué existe</h2>
      <p style={p}>
        Muchos de los mejores cuentos jamás escritos están a un clic de distancia, pero dispersos, en ediciones difíciles de leer o sin una
        forma cómoda de escucharlos. Epovox nació para cambiar eso: tomar esas obras, cuidarlas una por una y ofrecerlas en el formato en el
        que hoy consumimos historias —el audio— sin perder la posibilidad de seguir el texto con la vista.
      </p>
      <p style={p}>
        Creemos que un clásico no debería sentirse como una tarea. Debería poder escucharse mientras viajás, cocinás o caminás, y engancharte
        igual que un buen podcast.
      </p>

      <h2 style={h2}>Qué lo hace distinto</h2>
      <p style={p}>
        <strong style={{ color: '#F2EDE4' }}>Curaduría.</strong> No subimos todo lo que existe: elegimos cuento por cuento, escribimos una
        descripción propia de cada uno y lo presentamos con su contexto y su autor. Cada obra tiene su ficha, su portada y su ubicación dentro
        de la trayectoria de quien la escribió.
      </p>
      <p style={p}>
        <strong style={{ color: '#F2EDE4' }}>Lectura acompañada (read-along).</strong> Mientras suena el audio, el texto avanza resaltado en
        pantalla. Es ideal para volver a los clásicos, para quienes aprenden un idioma y para acompañar la escucha sin perder el hilo.
      </p>
      <p style={p}>
        <strong style={{ color: '#F2EDE4' }}>Español e inglés.</strong> Muchas obras están disponibles en ambos idiomas, con voces distintas
        según el autor o autora, para que la narración se sienta cuidada y no robótica.
      </p>

      <h2 style={h2}>Cómo narramos las obras</h2>
      <p style={p}>
        La narración se genera con voces de inteligencia artificial de alta calidad. Somos transparentes con esto: no es una persona leyendo,
        es tecnología de síntesis de voz que nos permite ofrecer cientos de horas de audio de forma gratuita. Elegimos las voces con criterio
        —una para las autoras, otra para los autores— y ajustamos el texto para que la lectura fluya de forma natural.
      </p>

      <h2 style={h2}>Por qué es gratis (y legal)</h2>
      <p style={p}>
        Los clásicos que publicamos son obras de <strong style={{ color: '#F2EDE4' }}>dominio público</strong>: sus derechos de autor ya
        expiraron, por lo que pueden difundirse libremente. Eso nos permite ofrecerlas sin costo. El trabajo de Epovox está en la curaduría, la
        narración, las portadas y la experiencia de escucha y lectura.
      </p>

      <h2 style={h2}>Autores independientes</h2>
      <p style={p}>
        Epovox no es solo un archivo del pasado: también es un espacio para escritores y escritoras de hoy. Cualquier persona puede crear su
        perfil, publicar sus propias obras y compartirlas con la comunidad —de forma gratuita o poniéndoles un precio—. Podés conocerlos en la
        sección{' '}
        <Link href="/independientes" style={{ color: '#C9933A' }}>Autores independientes</Link>.
      </p>

      <h2 style={h2}>Quién está detrás</h2>
      <p style={p}>
        Epovox es un proyecto independiente, hecho en Argentina, con la idea simple de que los grandes cuentos merecen escucharse. Si querés
        escribirnos, contarnos qué obra te gustaría escuchar o reportar algo, podés hacerlo a{' '}
        <a href="mailto:brunomariaok@gmail.com" style={{ color: '#C9933A' }}>brunomariaok@gmail.com</a>.
      </p>

      <div className="mt-12 pt-8 flex flex-wrap gap-4" style={{ borderTop: '1px solid #2A2720' }}>
        <Link href="/biblioteca" className="px-6 py-3 rounded-full text-sm font-semibold transition-opacity hover:opacity-80" style={{ background: '#C9933A', color: '#fff' }}>
          Explorar la biblioteca
        </Link>
        <Link href="/autores" className="px-6 py-3 rounded-full text-sm font-semibold transition-opacity hover:opacity-80" style={{ background: '#1A1816', color: '#F2EDE4', border: '1px solid #2A2720' }}>
          Ver autores
        </Link>
      </div>
    </div>
  );
}
