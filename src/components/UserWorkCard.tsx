import Link from 'next/link';

type UserWork = {
  id: string;
  title: string;
  description: string | null;
  language: string;
  user_id: string;
  created_at: string;
  // profile joined
  profiles?: { display_name: string | null; avatar_url: string | null } | null;
};

export default function UserWorkCard({ work }: { work: UserWork }) {
  const authorName = work.profiles?.display_name ?? 'Autor';
  const authorAvatar = work.profiles?.avatar_url;

  // Generar color de fondo determinista a partir del id
  const hue = parseInt(work.id.slice(0, 8), 16) % 360;
  const from = `hsl(${hue}, 30%, 18%)`;
  const to   = `hsl(${hue}, 20%, 10%)`;

  return (
    <Link href={`/obra/${work.id}`} className="group block">
      {/* Cover */}
      <div
        className="aspect-[2/3] rounded-xl mb-3 relative overflow-hidden"
        style={{
          background: `linear-gradient(160deg, ${from} 0%, ${to} 100%)`,
          boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
        }}
      >
        {/* Badge idioma */}
        <div className="absolute top-3 left-3">
          <span className="text-xs px-2 py-0.5 rounded-full font-medium tracking-widest"
            style={{ background: 'rgba(0,0,0,0.45)', color: 'rgba(255,255,255,0.75)' }}>
            {work.language.toUpperCase()}
          </span>
        </div>

        {/* Título overlay */}
        <div className="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-black/70 via-transparent to-transparent">
          <p className="font-semibold leading-tight text-white line-clamp-3"
            style={{ fontFamily: 'Georgia, serif', fontSize: '0.95rem' }}>
            {work.title}
          </p>
        </div>

        {/* Hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: 'rgba(0,0,0,0.35)' }}>
          <div className="px-4 py-2 rounded-full text-sm font-medium"
            style={{ background: '#C9933A', color: '#fff' }}>
            Ver obra
          </div>
        </div>
      </div>

      {/* Autor */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0"
          style={{ background: '#2A2720' }}>
          {authorAvatar
            ? <img src={authorAvatar} alt={authorName} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-xs font-bold"
                style={{ color: '#C9933A', fontFamily: 'Georgia, serif' }}>
                {authorName.charAt(0)}
              </div>
          }
        </div>
        <p className="text-xs truncate hover:text-amber-400 transition-colors"
          style={{ color: '#C9933A' }}>
          {authorName}
        </p>
      </div>
      <p className="text-xs mt-0.5" style={{ color: '#6A6460' }}>
        {new Date(work.created_at).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' })}
      </p>
    </Link>
  );
}
