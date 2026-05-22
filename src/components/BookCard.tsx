import Link from 'next/link';
import { Work } from '@/types';

// Acepta tanto el tipo Work (Supabase) como el tipo legacy de books.ts
type CardWork = Work | {
  slug: string; title: string; author?: string; language: string;
  year?: number | null; genre: string[]; duration_label?: string | null;
  cover_gradient_from: string; cover_gradient_to: string; type?: string;
};

function getField(work: any) {
  return {
    from: work.cover_gradient_from ?? work.coverGradient?.from ?? '#1a1a2e',
    to: work.cover_gradient_to ?? work.coverGradient?.to ?? '#0d0d0d',
    duration: work.duration_label ?? work.duration ?? '',
    author: work.author?.name ?? work.author ?? '',
    type: work.type ?? 'book',
  };
}

export default function BookCard({ work }: { work: any }) {
  const { from, to, duration, author, type } = getField(work);
  const isStory = type === 'story';

  return (
    <Link href={`/libro/${work.slug}`} className="group block">
      {/* Cover — cuentos son cuadrados, libros 2:3 */}
      <div
        className={`${isStory ? 'aspect-square' : 'aspect-[2/3]'} rounded-xl mb-3 relative overflow-hidden`}
        style={{
          background: `linear-gradient(160deg, ${from} 0%, ${to} 100%)`,
          boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
        }}
      >
        {/* Portada real si existe */}
        {work.cover_url && (
          <img
            src={work.cover_url}
            alt={work.title}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          <span className="text-xs px-2 py-0.5 rounded-full font-medium tracking-widest"
            style={{ background: 'rgba(0,0,0,0.45)', color: 'rgba(255,255,255,0.75)' }}>
            {work.language.toUpperCase()}
          </span>
          {isStory && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: 'rgba(201,147,58,0.7)', color: '#fff' }}>
              cuento
            </span>
          )}
        </div>

        {/* Title overlay */}
        <div className="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-black/70 via-transparent to-transparent">
          <p className="font-semibold leading-tight text-white line-clamp-3"
            style={{ fontFamily: 'Georgia, serif', fontSize: '0.95rem' }}>
            {work.title}
          </p>
          {author && (
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>{author}</p>
          )}
        </div>

        {/* Hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: 'rgba(0,0,0,0.35)' }}>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
            style={{ background: '#C9933A', color: '#fff' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
              <polygon points="5,3 19,12 5,21" />
            </svg>
            Escuchar
          </div>
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center justify-between">
        <p className="text-xs truncate" style={{ color: '#8A8478' }}>
          {work.year} · {work.genre?.[0]}
        </p>
        <p className="text-xs" style={{ color: '#8A8478' }}>{duration}</p>
      </div>
    </Link>
  );
}
