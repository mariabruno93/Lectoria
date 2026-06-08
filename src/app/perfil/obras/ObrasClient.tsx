'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Status = 'draft' | 'published' | 'archived';
type Work = {
  id: string;
  title: string;
  description: string | null;
  status: Status;
  is_public: boolean;
  language: string;
  created_at: string;
  updated_at: string;
};

const STATUS_LABEL: Record<Status, string> = {
  draft:     'Borrador',
  published: 'Compartida',
  archived:  'Archivada',
};
const STATUS_COLOR: Record<Status, { bg: string; color: string }> = {
  draft:     { bg: '#2A2720', color: '#8A8478' },
  published: { bg: '#0A2D1A', color: '#22c55e' },
  archived:  { bg: '#1A1816', color: '#6A6460' },
};

type Filter = 'all' | Status;

export default function ObrasClient({ works: initialWorks }: { works: Work[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [works, setWorks] = useState<Work[]>(initialWorks);
  const [filter, setFilter] = useState<Filter>('all');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const visible = filter === 'all' ? works : works.filter(w => w.status === filter);
  const publishedPublic = works.filter(w => w.status === 'published' && w.is_public).length;
  const showTip = works.length > 0 && publishedPublic < 2;

  async function togglePublic(work: Work) {
    setLoadingId(work.id);
    const { error } = await supabase
      .from('user_works')
      .update({ is_public: !work.is_public })
      .eq('id', work.id);
    if (!error) setWorks(prev => prev.map(w => w.id === work.id ? { ...w, is_public: !w.is_public } : w));
    setLoadingId(null);
  }

  async function setStatus(work: Work, status: Status) {
    setLoadingId(work.id);
    const { error } = await supabase
      .from('user_works')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', work.id);
    if (!error) setWorks(prev => prev.map(w => w.id === work.id ? { ...w, status } : w));
    setLoadingId(null);
  }

  const FILTERS: { id: Filter; label: string }[] = [
    { id: 'all',       label: `Todas (${works.length})` },
    { id: 'published', label: `Compartidas (${works.filter(w => w.status === 'published').length})` },
    { id: 'draft',     label: `Borradores (${works.filter(w => w.status === 'draft').length})` },
    { id: 'archived',  label: `Archivadas (${works.filter(w => w.status === 'archived').length})` },
  ];

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/perfil" className="text-xs uppercase tracking-widest hover:opacity-70 transition-opacity"
            style={{ color: '#C9933A' }}>← Mi cuenta</Link>
          <h1 className="mt-3 text-3xl font-bold" style={{ fontFamily: 'Georgia, serif', color: '#F2EDE4' }}>
            Mis obras
          </h1>
        </div>
        <Link href="/perfil/obras/nueva"
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ background: '#C9933A', color: '#fff' }}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Nueva obra
        </Link>
      </div>

      {/* Tip: recomendación de obras públicas */}
      {showTip && (
        <div className="mb-6 px-5 py-4 rounded-2xl flex gap-3 items-start"
          style={{ background: 'rgba(201,147,58,0.07)', border: '1px solid rgba(201,147,58,0.2)' }}>
          <span className="text-xl flex-shrink-0 mt-0.5">💡</span>
          <div>
            <p className="text-sm font-medium mb-0.5" style={{ color: '#F2EDE4' }}>
              Consejo para atraer lectores
            </p>
            <p className="text-xs leading-5" style={{ color: '#8A8478' }}>
              Compartir al menos <strong style={{ color: '#C9933A' }}>2 obras cortas gratuitas</strong> genera
              confianza y atrae a lectores que luego comprarán tus obras de pago.
              Tenés {publishedPublic === 0 ? 'ninguna' : `${publishedPublic}`} obra{publishedPublic === 1 ? '' : 's'} gratuita{publishedPublic === 1 ? '' : 's'} compartida{publishedPublic === 1 ? '' : 's'} — te {publishedPublic === 0 ? 'faltan 2' : 'falta 1'} para completar el mínimo recomendado.
            </p>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className="px-4 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{
              background: filter === f.id ? '#C9933A' : '#1A1816',
              color: filter === f.id ? '#fff' : '#8A8478',
              border: '1px solid',
              borderColor: filter === f.id ? '#C9933A' : '#2A2720',
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {visible.length === 0 ? (
        <div className="py-20 text-center rounded-2xl" style={{ background: '#1A1816', border: '1px solid #2A2720' }}>
          <p className="text-3xl mb-4">✍️</p>
          <p className="text-sm mb-6" style={{ color: '#8A8478' }}>
            {filter === 'all'
              ? 'Todavía no compartiste ninguna obra.'
              : `No tenés obras en "${STATUS_LABEL[filter as Status]}".`}
          </p>
          {filter === 'all' && (
            <Link href="/perfil/obras/nueva"
              className="inline-block px-6 py-2.5 rounded-full text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ background: '#C9933A', color: '#fff' }}>
              Crear primera obra
            </Link>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map(work => {
            const sc = STATUS_COLOR[work.status];
            const isLoading = loadingId === work.id;
            return (
              <div key={work.id} className="rounded-2xl p-5"
                style={{ background: '#1A1816', border: '1px solid #2A2720' }}>
                <div className="flex items-start justify-between gap-4">
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {/* Status badge */}
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ background: sc.bg, color: sc.color }}>
                        {STATUS_LABEL[work.status]}
                      </span>
                      {/* Visibilidad */}
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: '#2A2720', color: work.is_public ? '#C9933A' : '#6A6460' }}>
                        {work.is_public ? 'Gratis' : '🔒 De pago'}
                      </span>
                      <span className="text-xs uppercase" style={{ color: '#6A6460' }}>
                        {work.language}
                      </span>
                    </div>
                    <h3 className="font-semibold text-base leading-snug" style={{ color: '#F2EDE4' }}>
                      {work.title}
                    </h3>
                    {work.description && (
                      <p className="text-xs mt-1 line-clamp-2" style={{ color: '#8A8478' }}>
                        {work.description}
                      </p>
                    )}
                    <p className="text-xs mt-2" style={{ color: '#3A3728' }}>
                      Modificada {new Date(work.updated_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>

                  {/* Acciones rápidas */}
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <Link href={`/perfil/obras/${work.id}`}
                      className="px-4 py-1.5 rounded-full text-xs font-medium text-center transition-opacity hover:opacity-80"
                      style={{ background: '#2A2720', color: '#F2EDE4' }}>
                      Editar
                    </Link>
                    <button
                      disabled={isLoading}
                      onClick={() => togglePublic(work)}
                      className="px-4 py-1.5 rounded-full text-xs font-medium transition-opacity hover:opacity-80"
                      style={{ background: '#2A2720', color: work.is_public ? '#6A6460' : '#C9933A' }}>
                      {work.is_public ? 'Hacer de pago' : 'Hacer gratis'}
                    </button>
                  </div>
                </div>

                {/* Acciones de estado */}
                <div className="flex gap-2 mt-4 pt-4 flex-wrap" style={{ borderTop: '1px solid #2A2720' }}>
                  {work.status !== 'published' && (
                    <button disabled={isLoading} onClick={() => setStatus(work, 'published')}
                      className="px-3 py-1 rounded-full text-xs transition-opacity hover:opacity-80"
                      style={{ background: '#0A2D1A', color: '#22c55e', border: '1px solid #22c55e33' }}>
                      Compartir
                    </button>
                  )}
                  {work.status !== 'draft' && (
                    <button disabled={isLoading} onClick={() => setStatus(work, 'draft')}
                      className="px-3 py-1 rounded-full text-xs transition-opacity hover:opacity-80"
                      style={{ background: '#2A2720', color: '#8A8478' }}>
                      Volver a borrador
                    </button>
                  )}
                  {work.status !== 'archived' && (
                    <button disabled={isLoading} onClick={() => setStatus(work, 'archived')}
                      className="px-3 py-1 rounded-full text-xs transition-opacity hover:opacity-80"
                      style={{ background: '#1A1816', color: '#6A6460', border: '1px solid #2A2720' }}>
                      Archivar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
