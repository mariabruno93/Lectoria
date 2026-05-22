'use client';

import {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { Book, Chapter } from '@/lib/books';

interface PlayerState {
  book: Book | null;
  chapter: Chapter | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

interface PlayerContextType extends PlayerState {
  play: (book: Book, chapter: Chapter) => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setDuration: (d: number) => void;
  setCurrentTime: (t: number) => void;
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
  });

  const play = useCallback((book: Book, chapter: Chapter) => {
    setState((prev) => ({ ...prev, book, chapter, isPlaying: true, currentTime: 0 }));
    if (audioRef.current) {
      audioRef.current.src = chapter.audioUrl ?? '';
      if (chapter.audioUrl) audioRef.current.play().catch(() => {});
    }
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
    <PlayerContext.Provider value={{ ...state, play, togglePlay, seek, setDuration, setCurrentTime }}>
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
