import Link from 'next/link';
import { Work } from '@/types';

function getField(work: any) {
  return {
    from: work.cover_gradient_from ?? work.coverGradient?.from ?? '#1a1a2e',
    to: work.cover_gradient_to ?? work.coverGradient?.to ?? '#0d0d0d',
    duration: work.duration_label ?? work.duration ?? '',
    authorName: work.authors?.name ?? work.author?.name ?? work.author ?? '',
    authorSlug: work.authors?.slug ?? work.author?.slug ?? null,
    type: work.type ?? 'book',
  };
}

export default function BookCard({ work }: { work: any }) {
  const { from, to, duration, authorName, authorSlug, type } = getField(work);
  const isStory = type === 'story';

  return (
    <div className="group block">
      {/* Cover */}
      <Link href={`/libro/${work.slug}`} className="block">
        <div
          className={`${isStory ? 'aspect-square' : 'aspect-[2/3]'} rounded-xl mb-3 relative overflow-hidden`}
          style={{
            background: `linear-gradient(160deg, ${from} 0%, ${to} 100%)`,
            boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
          }}
        >
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
      </Link>

      {/* Meta — autor es link separado */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {authorName && (
            authorSlug ? (
              <Link
                href={`/autor/${authorSlug}`}
                className="text-xs block truncate hover:underline transition-colors"
                style={{ color: '#C9933A' }}
              >
                {authorName}
              </Link>
            ) : (
              <p className="text-xs truncate" style={{ color: '#8A8478' }}>{authorName}</p>
            )
          )}
          <p className="text-xs" style={{ color: '#6A6460' }}>
            {work.year}{work.genre?.[0] ? ` · ${work.genre[0]}` : ''}
          </p>
        </div>
        {duration && <p className="text-xs flex-shrink-0" style={{ color: '#6A6460' }}>{duration}</p>}
      </div>
    </div>
  );
}
