'use client';

import { useEffect } from 'react';

// Cuenta de AdSense de Epovox (el script ya se carga en layout.tsx).
const CLIENT = 'ca-pub-5365119447652587';

/**
 * Unidad de AdSense in-page (display). Segura — NO es interstitial.
 * Necesita el id de la unidad de aviso (data-ad-slot). Se toma del prop o de
 * NEXT_PUBLIC_ADSENSE_SLOT. Si no hay slot configurado, no renderiza nada.
 */
export default function AdSlot({ slot }: { slot?: string }) {
  const adSlot = slot ?? process.env.NEXT_PUBLIC_ADSENSE_SLOT;

  useEffect(() => {
    if (!adSlot) return;
    try { ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({}); } catch { /* noop */ }
  }, [adSlot]);

  if (!adSlot) return null;

  return (
    <div className="my-8 flex justify-center">
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', maxWidth: 728 }}
        data-ad-client={CLIENT}
        data-ad-slot={adSlot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
