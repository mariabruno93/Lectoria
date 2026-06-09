import { createClient, createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import ObraPlayer from './ObraPlayer';
import { hasAccess } from '@/lib/entitlements';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const admin = createAdminClient();
  const { data } = await admin.from('user_works').select('title, description').eq('id', id).single();
  if (!data) return {};
  return { title: `${data.title} — Epovox`, description: data.description ?? undefined };
}

export default async function ObraPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Datos públicos por admin (server-side); auth del visitante por el cliente normal.
  const admin = createAdminClient();
  const authClient = await createClient();

  // Carga la obra sin filtrar por is_public (las de pago muestran estado bloqueado)
  const { data: work } = await admin
    .from('user_works')
    .select('*')
    .eq('id', id)
    .eq('status', 'published')
    .single();

  if (!work) notFound();

  // Perfil del autor (consulta aparte: no hay relación declarada en la DB)
  const { data: author } = await admin
    .from('profiles')
    .select('display_name, avatar_url, nationality')
    .eq('id', work.user_id)
    .single();
  const authorName = author?.display_name ?? 'Autor';
  const authorAvatar = author?.avatar_url ?? null;

  // Acceso: gratis, el autor, o quien la compró. Si no, queda bloqueada.
  const { data: { user } } = await authClient.auth.getUser();
  const access = await hasAccess(admin, user?.id ?? null, work);
  const isLocked = !access;

  return (
    <div className="max-w-2xl mx-auto px-6 py-14">
      {/* Breadcrumb */}
      <Link href={`/independientes/${work.user_id}`}
        className="text-xs uppercase tracking-widest hover:opacity-70 transition-opacity"
        style={{ color: '#C9933A' }}>
        ← {authorName}
      </Link>

      {/* Header */}
      <div className="mt-8 mb-10">
        {work.cover_url && (
          <div className="w-40 aspect-[2/3] rounded-xl overflow-hidden mb-6"
            style={{ boxShadow: '0 6px 30px rgba(0,0,0,0.5)' }}>
            <img src={work.cover_url} alt={work.title} className="w-full h-full object-cover" />
          </div>
        )}

        {isLocked && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-4"
            style={{ background: 'rgba(201,147,58,0.12)', border: '1px solid rgba(201,147,58,0.3)', color: '#C9933A' }}>
            🔒 Obra de pago
          </div>
        )}

        <h1 className="text-4xl font-bold leading-tight mb-4"
          style={{ fontFamily: 'Georgia, serif', color: '#F2EDE4' }}>
          {work.title}
        </h1>

        {/* Autor */}
        <Link href={`/independientes/${work.user_id}`}
          className="flex items-center gap-3 w-fit hover:opacity-80 transition-opacity">
          <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0"
            style={{ border: '2px solid #2A2720' }}>
            {authorAvatar
              ? <img src={authorAvatar} alt={authorName} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-sm font-bold"
                  style={{ background: '#1A1816', color: '#C9933A', fontFamily: 'Georgia, serif' }}>
                  {authorName.charAt(0)}
                </div>
            }
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: '#F2EDE4' }}>{authorName}</p>
            <p className="text-xs" style={{ color: '#6A6460' }}>
              {author?.nationality ? `${author.nationality} · ` : ''}
              {new Date(work.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
              {' · '}{work.language.toUpperCase()}
            </p>
          </div>
        </Link>

        {work.description && (
          <p className="mt-5 text-base leading-7" style={{ color: '#8A8478' }}>{work.description}</p>
        )}
      </div>

      {/* ── Obra de pago — estado bloqueado ── */}
      {isLocked ? (
        <div className="rounded-2xl p-8 text-center"
          style={{ background: '#1A1816', border: '1px solid #2A2720' }}>
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'Georgia, serif', color: '#F2EDE4' }}>
            Esta obra es de pago
          </h2>
          {work.price_ars && work.price_ars > 0 ? (
            <>
              <p className="text-3xl font-bold mb-1" style={{ fontFamily: 'Georgia, serif', color: '#F2EDE4' }}>
                ${work.price_ars.toLocaleString('es-AR')}
              </p>
              <p className="text-sm mb-6 max-w-xs mx-auto" style={{ color: '#8A8478' }}>
                Comprala una vez y accedé para siempre. También podés comprar toda la biblioteca de {authorName}.
              </p>
            </>
          ) : (
            <p className="text-sm mb-6 max-w-xs mx-auto" style={{ color: '#8A8478' }}>
              El autor todavía no definió el precio de esta obra.
            </p>
          )}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold"
            style={{ background: '#2A2720', color: '#6A6460', cursor: 'not-allowed' }}>
            Compra disponible muy pronto
          </div>
          <p className="mt-5 text-xs" style={{ color: '#3A3728' }}>
            ¿Ya compraste esta obra?{' '}
            <Link href="/login" className="hover:opacity-80" style={{ color: '#C9933A' }}>
              Iniciá sesión
            </Link>
          </p>
        </div>
      ) : (
        <>
          {/* Player de audio */}
          {work.audio_url && (
            <ObraPlayer
              workId={work.id}
              title={work.title}
              audioUrl={work.audio_url}
              authorName={authorName}
            />
          )}

          {/* Texto */}
          {work.content && (
            <div className="mt-10 pt-8" style={{ borderTop: '1px solid #2A2720' }}>
              <div
                className="prose prose-invert max-w-none leading-8 text-base whitespace-pre-wrap"
                style={{
                  color: '#C9C3B8',
                  fontFamily: 'Georgia, serif',
                  lineHeight: 1.9,
                  fontSize: '1.05rem',
                }}
              >
                {work.content}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
