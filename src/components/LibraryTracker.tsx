'use client';

import { useEffect, useRef } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { createClient } from '@/lib/supabase/client';

/**
 * Componente invisible que auto-registra "En reproducción" en user_library
 * cuando el usuario empieza a escuchar un trabajo.
 */
export default function LibraryTracker({ userId }: { userId: string | null }) {
  const { book } = usePlayer();
  const lastWorkId = useRef<string | null>(null);

  useEffect(() => {
    if (!userId || !book?.id) return;
    if (book.id === lastWorkId.current) return;
    lastWorkId.current = book.id;

    const supabase = createClient();
    supabase
      .from('user_library')
      .upsert(
        {
          user_id: userId,
          work_id: book.id,
          is_playing: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,work_id' }
      )
      .then(({ error }) => {
        if (error) console.warn('[LibraryTracker]', error.message);
      });
  }, [book?.id, userId]);

  return null;
}
