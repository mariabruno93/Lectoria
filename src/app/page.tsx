import Link from 'next/link';
import BookCard from '@/components/BookCard';
import { createClient } from '@/lib/supabase/server';

export default async function Home() {
  const supabase = await createClient();

  const { data: featured } = await supabase
    .from('works')
    .select('*, authors(name, slug)')
    .eq('featured', true)
    .order('created_at', { ascending: false });

  const { data: rest } = await supabase
    .from('works')
    .select('*, authors(name, slug)')
    .eq('featured', false)
    .order('created_at', { ascending: false });

  return (
    <div>
      {/* Hero */}
      <section
        className="relative overflow-hidden px-6 py-24 md:py-36 flex flex-col items-center text-center"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 0%, #2A1A08 0%, #0D0C0B 70%)',
        }}
      >
        <div className="max-w-2xl mx-auto">
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-6"
            style={{ color: '#C9933A' }}
          >
            Audiolibros · Voz IA · Gratis
          </p>
          <h1
            className="text-4xl md:text-6xl font-bold leading-tight mb-6"
            style={{ fontFamily: 'Georgia, serif', color: '#F2EDE4' }}
          >
            Escuchá a los grandes.
          </h1>
          <p className="text-lg md:text-xl mb-10" style={{ color: '#8A8478', lineHeight: 1.7 }}>
            Los clásicos de la literatura narrados con voz IA.
            <br />
            En español e inglés. Sin costo, sin registro.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/biblioteca"
              className="px-8 py-3 rounded-full text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ background: '#C9933A', color: '#fff' }}
            >
              Explorar biblioteca
            </Link>
            <Link
              href="#como-funciona"
              className="px-8 py-3 rounded-full text-sm font-semibold border transition-colors hover:opacity-80"
              style={{ borderColor: '#2A2720', color: '#8A8478' }}
            >
              ¿Cómo funciona?
            </Link>
          </div>
        </div>
      </section>

      {/* Featured books */}
      {featured && featured.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="flex items-center justify-between mb-8">
            <h2
              className="text-2xl font-semibold"
              style={{ fontFamily: 'Georgia, serif', color: '#F2EDE4' }}
            >
              Títulos destacados
            </h2>
            <Link
              href="/biblioteca"
              className="text-sm hover:opacity-80 transition-opacity"
              style={{ color: '#C9933A' }}
            >
              Ver todos →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
            {featured.map((work: any) => (
              <BookCard key={work.slug} work={work} />
            ))}
          </div>
        </section>
      )}

      {/* Rest of catalog */}
      {rest && rest.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 pb-16">
          <h2
            className="text-lg font-semibold mb-6"
            style={{ fontFamily: 'Georgia, serif', color: '#F2EDE4' }}
          >
            También disponibles
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {rest.map((work: any) => (
              <BookCard key={work.slug} work={work} />
            ))}
          </div>
        </section>
      )}

      {/* How it works */}
      <section
        id="como-funciona"
        className="border-t py-16 px-6"
        style={{ borderColor: '#2A2720' }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <h2
            className="text-2xl font-semibold mb-12"
            style={{ fontFamily: 'Georgia, serif', color: '#F2EDE4' }}
          >
            ¿Cómo funciona?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            {[
              {
                n: '01',
                title: 'Elegí un libro',
                desc: 'Navegá nuestra biblioteca de clásicos en español e inglés.',
              },
              {
                n: '02',
                title: 'Seleccioná un capítulo',
                desc: 'Cada libro está dividido en capítulos para arrancar donde quieras.',
              },
              {
                n: '03',
                title: 'Escuchá',
                desc: 'El reproductor se queda activo mientras navegás. Sin interrupciones.',
              },
            ].map(({ n, title, desc }) => (
              <div key={n} className="flex flex-col items-center gap-3">
                <span
                  className="text-3xl font-bold"
                  style={{ fontFamily: 'Georgia, serif', color: '#C9933A', opacity: 0.4 }}
                >
                  {n}
                </span>
                <h3 className="font-semibold" style={{ color: '#F2EDE4' }}>
                  {title}
                </h3>
                <p className="text-sm text-center" style={{ color: '#8A8478', lineHeight: 1.7 }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PDF teaser */}
      <section className="py-12 px-6">
        <div
          className="max-w-3xl mx-auto rounded-2xl p-8 text-center"
          style={{ background: '#1A1816', border: '1px solid #2A2720' }}
        >
          <span
            className="text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full inline-block mb-4"
            style={{ background: '#2A2720', color: '#C9933A' }}
          >
            Próximamente
          </span>
          <h3
            className="text-xl font-semibold mb-3"
            style={{ fontFamily: 'Georgia, serif', color: '#F2EDE4' }}
          >
            ¿Tenés un PDF o Word?
          </h3>
          <p style={{ color: '#8A8478', lineHeight: 1.7 }}>
            Muy pronto vas a poder subir cualquier documento y convertirlo en audiolibro con voz IA en segundos.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="border-t py-8 px-6 text-center text-xs"
        style={{ borderColor: '#2A2720', color: '#8A8478' }}
      >
        © {new Date().getFullYear()} Lectoria · Todos los libros son de dominio público
      </footer>
    </div>
  );
}
