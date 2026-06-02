'use client';

import { usePlayer } from '@/context/PlayerContext';

export default function ObraPlayer({
  workId, title, audioUrl, authorName,
}: {
  workId: string;
  title: string;
  audioUrl: string;
  authorName: string;
}) {
  const { play, book, chapter, isPlaying, togglePlay } = usePlayer();

  const isThisPlaying = chapter?.id === `uw-${workId}` && isPlaying;
  const isLoaded = chapter?.id === `uw-${workId}`;

  function handlePlay() {
    if (isLoaded) {
      togglePlay();
    } else {
      play(
        {
          slug: `obra-${workId}`,
          title,
          cover_gradient_from: '#2A1A08',
          cover_gradient_to: '#0D0C0B',
        },
        {
          id: `uw-${workId}`,
          title,
          audio_url: audioUrl,
          duration_label: null,
        }
      );
    }
  }

  return (
    <div className="rounded-2xl p-5 flex items-center gap-4"
      style={{ background: '#1A1816', border: '1px solid #2A2720' }}>
      <button
        onClick={handlePlay}
        className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all hover:scale-105"
        style={{ background: '#C9933A', boxShadow: '0 2px 12px rgba(201,147,58,0.4)' }}
      >
        {isThisPlaying ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <rect x="6" y="4" width="4" height="16" rx="1"/>
            <rect x="14" y="4" width="4" height="16" rx="1"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <polygon points="6,3 20,12 6,21"/>
          </svg>
        )}
      </button>
      <div>
        <p className="text-sm font-medium" style={{ color: '#F2EDE4' }}>
          {isThisPlaying ? 'Reproduciendo…' : isLoaded ? 'En pausa' : 'Escuchar'}
        </p>
        <p className="text-xs" style={{ color: '#8A8478' }}>
          {title} · {authorName}
        </p>
      </div>
    </div>
  );
}
