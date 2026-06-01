import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import AudioPlayer from '@/components/AudioPlayer';
import { PlayerProvider } from '@/context/PlayerContext';
import { createClient } from '@/lib/supabase/server';
import LibraryTracker from '@/components/LibraryTracker';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Epovox — Audiolibros clásicos',
  description:
    'Los grandes clásicos de la literatura narrados en audio. En español e inglés. Completamente gratis.',
  openGraph: {
    title: 'Epovox — Audiolibros clásicos',
    description: 'Clásicos de la literatura en audio. Gratis.',
    siteName: 'Epovox',
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id ?? null;

  return (
    <html lang="es" className={inter.variable}>
      <body className="min-h-screen flex flex-col" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
        <PlayerProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <AudioPlayer />
          <LibraryTracker userId={userId} />
        </PlayerProvider>
      </body>
    </html>
  );
}
