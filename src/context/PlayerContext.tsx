'use client';

import {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from 'react';

// Campos mínimos que necesita el player (compatibles con el tipo Work de Supabase)
export interface PlayerBook {
  id?: string;           // work_id para tracking de biblioteca
  slug: string;
  title: string;
  cover_gradient_from: string;
  cover_gradient_to: string;
  cover_url?: string | null;
}

export interface PlayerChapter {
  id: string;
  title: string;
  audio_url: string | null;
  duration_label: string | null;
  content?: string | null;   // texto del capítulo para read-along
}

interface PlayerState {
  book: PlayerBook | null;
  chapter: PlayerChapter | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  showAd: boolean;
  pendingPlay: { book: PlayerBook; chapter: PlayerChapter } | null;
}

interface PlayerContextType extends PlayerState {
  play: (book: PlayerBook, chapter: PlayerChapter) => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setDuration: (d: number) => void;
  setCurrentTime: (t: number) => void;
  dismissAd: () => void;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<PlayerState>({
    book: null,
    chapter: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    showAd: false,
    pendingPlay: null,
  });

  // Mostrar pre-roll antes de reproducir
  const play = useCallback((book: PlayerBook, chapter: PlayerChapter) => {
    setState((prev) => ({ ...prev, showAd: true, pendingPlay: { book, chapter } }));
  }, []);

  // Llamado cuando el usuario salta o termina el anuncio
  const dismissAd = useCallback(() => {
    setState((prev) => {
      if (!prev.pendingPlay) return { ...prev, showAd: false };
      const { book, chapter } = prev.pendingPlay;
      if (audioRef.current) {
        audioRef.current.src = chapter.audio_url ?? '';
        if (chapter.audio_url) audioRef.current.play().catch(() => {});
      }
      return { ...prev, showAd: false, pendingPlay: null, book, chapter, isPlaying: true, currentTime: 0 };
    });
  }, []);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    setState((prev) => {
      if (prev.isPlaying) {
        audioRef.current!.pause();
      } else {
        audioRef.current!.play().catch(() => {});
      }
      return { ...prev, isPlaying: !prev.isPlaying };
    });
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) audioRef.current.currentTime = time;
    setState((prev) => ({ ...prev, currentTime: time }));
  }, []);

  const setDuration = useCallback((duration: number) => {
    setState((prev) => ({ ...prev, duration }));
  }, []);

  const setCurrentTime = useCallback((currentTime: number) => {
    setState((prev) => ({ ...prev, currentTime }));
  }, []);

  return (
    <PlayerContext.Provider value={{ ...state, play, togglePlay, seek, setDuration, setCurrentTime, dismissAd }}>
      {children}
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => setState((prev) => ({ ...prev, isPlaying: false }))}
      />
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be inside PlayerProvider');
  return ctx;
}
