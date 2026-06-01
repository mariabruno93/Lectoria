'use client';

import { useEffect, useState } from 'react';
import { usePlayer } from '@/context/PlayerContext';

const SKIP_AFTER = 5; // segundos

export default function PrerollAd() {
  const { showAd, dismissAd, pendingPlay } = usePlayer();
  const [countdown, setCountdown] = useState(SKIP_AFTER);
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    if (!showAd) {
      setCountdown(SKIP_AFTER);
      setCanSkip(false);
      return;
    }
    setCountdown(SKIP_AFTER);
    setCanSkip(false);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanSkip(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [showAd]);

  if (!showAd) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center pb-6 px-4"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(4px)' }}
    >
      <div className="w-full max-w-xl rounded-2xl overflow-hidden"
        style={{ background: '#1A1816', border: '1px solid #2A2720' }}>

        {/* Header del anuncio */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <span className="text-xs font-medium px-2 py-0.5 rounded"
            style={{ background: '#2A2720', color: '#8A8478' }}>
            Anuncio
          </span>
          <p className="text-xs" style={{ color: '#8A8478' }}>
            Epovox es gratis gracias a los sponsors
          </p>
        </div>

        {/* Slot publicitario — reemplazá esto con tu código de AdSense */}
        <div className="mx-4 mb-4 rounded-xl flex items-center justify-center"
          style={{ background: '#111', border: '1px dashed #2A2720', minHeight: '120px' }}>
          {/* ─────────────────────────────────────────────────────────
              PEGAR ACÁ EL CÓDIGO DE GOOGLE ADSENSE
              Ejemplo:
              <ins className="adsbygoogle"
                style={{ display: 'block' }}
                data-ad-client="ca-pub-XXXXXXXXXX"
                data-ad-slot="XXXXXXXXXX"
                data-ad-format="auto"
                data-full-width-responsive="true" />
          ───────────────────────────────────────────────────────── */}
          <p className="text-sm text-center px-4" style={{ color: '#3A3728' }}>
            [ Espacio publicitario · AdSense ]
          </p>
        </div>

        {/* Footer: qué vas a escuchar + botón saltar */}
        <div className="px-4 pb-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs mb-0.5" style={{ color: '#8A8478' }}>A punto de escuchar</p>
            <p className="text-sm font-medium truncate" style={{ color: '#F2EDE4' }}>
              {pendingPlay?.book.title}
            </p>
          </div>

          <button
            onClick={canSkip ? dismissAd : undefined}
            className="flex-shrink-0 px-5 py-2 rounded-full text-sm font-semibold transition-all"
            style={{
              background: canSkip ? '#C9933A' : '#2A2720',
              color: canSkip ? '#fff' : '#8A8478',
              cursor: canSkip ? 'pointer' : 'default',
              minWidth: '120px',
            }}
          >
            {canSkip ? 'Saltar ▶' : `Saltar en ${countdown}s`}
          </button>
        </div>
      </div>
    </div>
  );
}
