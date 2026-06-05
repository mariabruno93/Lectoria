'use client';

import { useState } from 'react';
import Link from 'next/link';
import LibraryButtons, { type LibraryEntry } from '@/components/LibraryButtons';

type Entry = {
  workId: string;
  status: LibraryEntry;
  work: any;
  updatedAt: string;
};

type Tab = 'playing' | 'following' | 'finished';

export default function ListasClient({ userId, entries: initial }: { userId: string; entries: Entry[] }) {
  const [tab, setTab] = useState<Tab>('playing');
  const [statusMap, setStatusMap] = useState<Record<string, LibraryEntry>>(
    Object.fromEntries(initial.map(e => [e.workId, e.status]))
  );

  function handleUpdate(workId: string, newStatus: LibraryEntry) {
    setStatusMap(prev => ({ ...prev, [workId]: newStatus }));
  }

  const visible = initial.filter(e => {
    const s = statusMap[e.workId] ?? e.status;
    if (tab === 'playing')   return s.is_playing && !s.is_finished;
    if (tab === 'following') return s.is_following;
    if (tab === 'finished')  return s.is_finished;
    return false;
  });

  const counts = {
    playing:   initial.filter(e => { const s = statusMap[e.workId] ?? e.status; return s.is_playing && !s.is_finished; }).length,
    following: initial.filter(e => { const s = statusMap[e.workId] ?? e.status; return s.is_following; }).length,
    finished:  initial.filter(e => { const s = statusMap[e.workId] ?? e.status; return s.is_finished; }).length,
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: 'playing',   label: `▶ En reproducción` },
    { id: 'following', label: `＋ Seguidos` },
    { id: 'finished',  label: `✓ Terminados` },
  ];

  const EMPTY: Record<Tab, string> = {
    playing:   'No estás escuchando nada. ¡Arrancá con un clásico!',
    following: 'No seguís ningún título todavía. Tocá el marcador en cualquier portada.',
    finished:  'No marcaste ningún título como terminado. Podés hacerlo desde la página de cada obra.',
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-8">
        <Link href="/perfil" className="text-xs uppercase tracking-widest hover:opacity-70 transition-opacity"
          style={{ color: '#C9933A' }}>← Mi cuenta</Link>
        <h1 className="mt-3 text-3xl font-bold" style={{ fontFamily: 'Georgia, serif', color: '#F2EDE4' }}>
          Mis listas
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-4 py-2 rounded-full text-sm font-medium transition-all"
            style={{
              background: tab === t.id ? '#C9933A' : '#1A1816',
              color: tab === t.id ? '#fff' : '#8A8478',
              border: '1px solid',
              borderColor: tab === t.id ? '#C9933A' : '#2A2720',
            }}>
            {t.label}
            <span className="ml-1.5 text-xs opacity-70">({counts[t.id]})</span>
          </button>
        ))}
      </div>

      {/* Lista */}
      {visible.length === 0 ? (
        <div className="py-16 text-center rounded-2xl" style={{ background: '#1A1816', border: '1px solid #2A2720' }}>
          <p className="text-sm" style={{ color: '#8A8478' }}>{EMPTY[tab]}</p>
          {tab !== 'finished' && (
            <Link href="/biblioteca"
              className="inline-block mt-5 px-5 py-2 rounded-full text-sm font-medium transition-opacity hover:opacity-80"
              style={{ background: '#C9933A', color: '#fff' }}>
              Ir a la biblioteca
            </Link>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {visible.map(e => {
            const w = e.work;
            const author = w.authors?.name ?? '';
            const isStory = w.type === 'story';
            return (
              <div key={e.workId}
                className="flex items-center gap-4 px-4 py-3 rounded-2xl transition-colors hover:bg-white/[0.02]"
                style={{ background: '#1A1816', border: '1px solid #2A2720' }}>

                {/* Cover miniatura */}
                <Link href={`/libro/${w.slug}`} className="flex-shrink-0">
                  <div
                    className={`${isStory ? 'w-10 h-10 rounded-lg' : 'w-10 h-14 rounded-lg'} overflow-hidden`}
                    style={{
                      background: `linear-gradient(160deg, ${w.cover_gradient_from ?? '#1A1816'} 0%, ${w.cover_gradient_to ?? '#0D0C0B'} 100%)`,
                    }}
                  >
                    {w.cover_url && (
                      <img src={w.cover_url} alt={w.title} className="w-full h-full object-cover" />
                    )}
                  </div>
                </Link>

                {/* Info */}
                <Link href={`/libro/${w.slug}`} className="flex-1 min-w-0 hover:opacity-80 transition-opacity">
                  <p className="text-sm font-medium truncate" style={{ color: '#F2EDE4' }}>{w.title}</p>
                  <p className="text-xs truncate" style={{ color: '#8A8478' }}>
                    {author}{author && w.year ? ' · ' : ''}{w.year ?? ''}
                    {isStory ? ' · Cuento' : ''}
                  </p>
                </Link>

                {/* Botones */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <LibraryButtons
                    workId={e.workId}
                    userId={userId}
                    initialStatus={statusMap[e.workId] ?? e.status}
                    onUpdate={handleUpdate}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
