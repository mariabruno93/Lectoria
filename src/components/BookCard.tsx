import Link from 'next/link';
import { Book } from '@/lib/books';

export default function BookCard({ book }: { book: Book }) {
  return (
    <Link href={`/libro/${book.slug}`} className="group block">
      {/* Cover */}
      <div
        className="aspect-[2/3] rounded-xl mb-3 relative overflow-hidden"
        style={{
          background: `linear-gradient(160deg, ${book.coverGradient.from} 0%, ${book.coverGradient.to} 100%)`,
          boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
        }}
      >
        {/* Language badge */}
        <div className="absolute top-3 left-3">
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium tracking-widest"
            style={{ background: 'rgba(0,0,0,0.45)', color: 'rgba(255,255,255,0.75)' }}
          >
            {book.language.toUpperCase()}
          </span>
        </div>

        {/* Title overlay */}
        <div className="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-black/60 via-transparent to-transparent">
          <p
            className="font-semibold leading-tight text-white line-clamp-3 transition-opacity group-hover:opacity-90"
            style={{ fontFamily: 'Georgia, serif', fontSize: '0.95rem' }}
          >
            {book.title}
          </p>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {book.author}
          </p>
        </div>

        {/* Hover overlay */}
        <div
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: 'rgba(0,0,0,0.35)' }}
        >
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
            style={{ background: '#C9933A', color: '#fff' }}
          >
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
          {book.year} · {book.genre[0]}
        </p>
        <p className="text-xs" style={{ color: '#8A8478' }}>
          {book.duration}
        </p>
      </div>
    </Link>
  );
}
