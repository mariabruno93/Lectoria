'use client';

import { usePlayer } from '@/context/PlayerContext';

function fmt(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function AudioPlayer() {
  const { book, chapter, isPlaying, currentTime, duration, togglePlay, seek } = usePlayer();

  if (!book || !chapter) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{ background: '#1A1816', borderTop: '1px solid #2A2720' }}
    >
      {/* Scrubber */}
      <div
        className="h-1 cursor-pointer"
        style={{ background: '#2A2720' }}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          seek(((e.clientX - rect.left) / rect.width) * duration);
        }}
      >
        <div
          className="h-full"
          style={{ width: `${progress}%`, background: '#C9933A', transition: 'none' }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-5">
        {/* Mini cover */}
        <div
          className="w-10 h-10 rounded-lg flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${book.coverGradient.from}, ${book.coverGradient.to})`,
          }}
        />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: '#F2EDE4' }}>
            {book.title}
          </p>
          <p className="text-xs truncate" style={{ color: '#8A8478' }}>
            {chapter.title}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <span className="text-xs tabular-nums" style={{ color: '#8A8478' }}>
            {fmt(currentTime)}
          </span>

          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
            style={{ background: '#C9933A' }}
            aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
          >
            {isPlaying ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <polygon points="6,3 20,12 6,21" />
              </svg>
            )}
          </button>

          <span className="text-xs tabular-nums" style={{ color: '#8A8478' }}>
            {fmt(duration)}
          </span>
        </div>
      </div>
    </div>
  );
}
