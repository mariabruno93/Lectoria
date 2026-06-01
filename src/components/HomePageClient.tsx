'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import BookCard from '@/components/BookCard';
import LibraryButtons, { type LibraryEntry } from '@/components/LibraryButtons';

interface Section {
  id: string;
  title: string;
  works: any[];
  href?: string;
}

interface Props {
  sections: Section[];
  userId: string | null;
  initialLibraryMap: Record<string, LibraryEntry>;
}

export default function HomePageClient({ sections, userId, initialLibraryMap }: Props) {
  const [libraryMap, setLibraryMap] = useState<Record<string, LibraryEntry>>(initialLibraryMap);

  const handleUpdate = useCallback((workId: string, entry: LibraryEntry) => {
    setLibraryMap(prev => ({ ...prev, [workId]: entry }));
  }, []);

  if (sections.every(s => s.works.length === 0)) return null;

  return (
    <div className="py-10 flex flex-col gap-12">
      {sections.map((section) => {
        if (section.works.length === 0) return null;
        return (
          <section key={section.id} className="max-w-6xl mx-auto w-full px-6">
            {/* Section header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold"
                style={{ fontFamily: 'Georgia, serif', color: '#F2EDE4' }}>
                {section.title}
              </h2>
              {section.href && (
                <Link href={section.href}
                  className="text-xs transition-opacity hover:opacity-70"
                  style={{ color: '#C9933A' }}>
                  Ver todos →
                </Link>
              )}
            </div>

            {/* Horizontal scroll row */}
            <div
              className="flex gap-3 overflow-x-auto pb-2"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
            >
              {section.works.map((work: any) => (
                <div key={work.id ?? work.slug} className="flex-none w-36 sm:w-40 relative group/card">
                  <BookCard work={work} />
                  {userId && work.id && (
                    <div
                      className="absolute top-2 right-2 z-20 flex flex-col gap-1.5 opacity-0 group-hover/card:opacity-100 transition-opacity"
                      onClick={e => e.preventDefault()}
                    >
                      <LibraryButtons
                        workId={work.id}
                        userId={userId}
                        initialStatus={libraryMap[work.id] ?? null}
                        onUpdate={handleUpdate}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
