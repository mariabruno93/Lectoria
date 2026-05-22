import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import AudioPlayer from '@/components/AudioPlayer';
import { PlayerProvider } from '@/context/PlayerContext';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Lectoria — Audiolibros con voz IA',
  description:
    'Los grandes clásicos de la literatura narrados con voz IA. En español e inglés. Completamente gratis.',
  openGraph: {
    title: 'Lectoria — Audiolibros con voz IA',
    description: 'Clásicos de la literatura en audio. Gratis.',
    siteName: 'Lectoria',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="min-h-screen flex flex-col" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
        <PlayerProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <AudioPlayer />
        </PlayerProvider>
      </body>
    </html>
  );
}
