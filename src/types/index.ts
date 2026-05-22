export type Language = 'es' | 'en';
export type WorkType = 'book' | 'story';

export interface Author {
  id: string;
  slug: string;
  name: string;
  bio: string | null;
  nationality: string | null;
  born_year: number | null;
  died_year: number | null;
  photo_url: string | null;
  created_at: string;
}

export interface Work {
  id: string;
  slug: string;
  title: string;
  type: WorkType;
  author_id: string;
  author?: Author;
  language: Language;
  year: number | null;
  description: string | null;
  genre: string[];
  duration_label: string | null;
  cover_gradient_from: string;
  cover_gradient_to: string;
  featured: boolean;
  translation_slug: string | null;
  alt_titles: string[];
  chapters?: Chapter[];
  created_at: string;
}

export interface Chapter {
  id: string;
  work_id: string;
  chapter_number: number;
  title: string;
  audio_url: string | null;
  duration_label: string | null;
}

export interface Play {
  id: string;
  work_id: string;
  chapter_id: string | null;
  played_at: string;
  duration_seconds: number | null;
}

export interface AdminStats {
  total_works: number;
  total_authors: number;
  total_plays: number;
  top_works: { title: string; plays: number }[];
}
