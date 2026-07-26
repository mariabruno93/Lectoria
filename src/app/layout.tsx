import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import Navbar from '@/components/Navbar';
import AudioPlayer from '@/components/AudioPlayer';
import { PlayerProvider } from '@/context/PlayerContext';
import { createClient } from '@/lib/supabase/server';
import LibraryTracker from '@/components/LibraryTracker';
import Footer from '@/components/Footer';
import JsonLd from '@/components/JsonLd';

const SITE_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Epovox',
  url: 'https://epovox.com',
  description: 'Audiolibros de clásicos de la literatura, gratis, con voz IA.',
  inLanguage: 'es',
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: 'https://epovox.com/biblioteca?q={search_term_string}' },
    'query-input': 'required name=search_term_string',
  },
  publisher: { '@type': 'Organization', name: 'Epovox', url: 'https://epovox.com' },
};

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  metadataBase: new URL('https://epovox.com'),
  title: 'Epovox — Audiolibros clásicos gratis para escuchar',
  description:
    'Escuchá gratis los grandes clásicos de la literatura narrados en audio con voz IA, en español e inglés. Cuentos de terror, misterio, drama y más.',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
  openGraph: {
    title: 'Epovox — Audiolibros clásicos',
    description: 'Clásicos de la literatura en audio. Gratis.',
    siteName: 'Epovox',
  },
  other: {
    'google-adsense-account': 'ca-pub-5365119447652587',
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id ?? null;

  return (
    <html lang="es" className={inter.variable}>
      <body className="min-h-screen flex flex-col" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5365119447652587"
          crossOrigin="anonymous"
          strategy="beforeInteractive"
        />
        <JsonLd data={SITE_JSONLD} />
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');`}
            </Script>
          </>
        )}
        <PlayerProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <AudioPlayer />
          <LibraryTracker userId={userId} />
        </PlayerProvider>
      </body>
    </html>
  );
}
