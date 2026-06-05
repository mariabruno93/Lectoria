'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface LibraryEntry {
  is_following: boolean;
  is_playing: boolean;
  is_finished: boolean;
}

interface Props {
  workId: string;
  userId: string;
  initialStatus: LibraryEntry | null;
  onUpdate?: (workId: string, entry: LibraryEntry) => void;
}

export default function LibraryButtons({ workId, userId, initialStatus, onUpdate }: Props) {
  const supabase = createClient();
  const [status, setStatus] = useState<LibraryEntry>(
    initialStatus ?? { is_following: false, is_playing: false, is_finished: false }
  );
  const [loadingField, setLoadingField] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function toggle(field: 'is_following' | 'is_finished', e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (loadingField) return;
    setLoadingField(field);
    setErrorMsg(null);

    const newValue = !status[field];
    const newStatus = { ...status, [field]: newValue };

    // Optimistic update
    setStatus(newStatus);
    onUpdate?.(workId, newStatus);

    try {
      const { error } = await supabase
        .from('user_library')
        .upsert(
          {
            user_id: userId,
            work_id: workId,
            is_following: newStatus.is_following,
            is_playing:   newStatus.is_playing,
            is_finished:  newStatus.is_finished,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,work_id' }
        );
      if (error) throw error;
    } catch (err: any) {
      // Revert on error + mostrar mensaje
      setStatus(status);
      onUpdate?.(workId, status);
      setErrorMsg('No se pudo guardar');
      setTimeout(() => setErrorMsg(null), 3000);
    } finally {
      setLoadingField(null);
    }
  }

  return (
    <>
      {errorMsg && (
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#2D0A0A', color: '#ef4444' }}>
          {errorMsg}
        </span>
      )}
      {/* Follow / bookmark button */}
      <button
        onClick={(e) => toggle('is_following', e)}
        className="w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90"
        style={{
          background: status.is_following ? '#C9933A' : 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)',
          border: status.is_following ? 'none' : '1px solid rgba(255,255,255,0.18)',
          opacity: loadingField === 'is_following' ? 0.6 : 1,
        }}
        title={status.is_following ? 'Quitar de seguidos' : 'Agregar a seguidos'}
      >
        {status.is_following ? (
          <svg width="11" height="13" viewBox="0 0 12 15" fill="white">
            <path d="M1 1h10a1 1 0 011 1v12l-6-3-6 3V2a1 1 0 011-1z"/>
          </svg>
        ) : (
          <svg width="11" height="13" viewBox="0 0 12 15" fill="none" stroke="white" strokeWidth="1.5" strokeLinejoin="round">
            <path d="M1 1h10a1 1 0 011 1v12l-6-3-6 3V2a1 1 0 011-1z"/>
          </svg>
        )}
      </button>

      {/* Finished / check button */}
      <button
        onClick={(e) => toggle('is_finished', e)}
        className="w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90"
        style={{
          background: status.is_finished ? '#22c55e' : 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)',
          border: status.is_finished ? 'none' : '1px solid rgba(255,255,255,0.18)',
          opacity: loadingField === 'is_finished' ? 0.6 : 1,
        }}
        title={status.is_finished ? 'Marcar como no terminado' : 'Marcar como terminado'}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
          stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </button>
    </>
  );
}
