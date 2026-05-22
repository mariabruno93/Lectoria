export type Language = 'es' | 'en';

export interface Chapter {
  id: number;
  title: string;
  duration: string;
  audioUrl?: string;
}

export interface Book {
  slug: string;
  title: string;
  author: string;
  year: number;
  language: Language;
  description: string;
  genre: string[];
  duration: string;
  coverGradient: { from: string; to: string };
  featured?: boolean;
  chapters: Chapter[];
  /** Títulos alternativos para búsqueda (otro idioma, variantes, etc.) */
  altTitles?: string[];
  /** Slugs de versiones en otros idiomas */
  translations?: Partial<Record<Language, string>>;
}

export const books: Book[] = [
  // ─── ESPAÑOL ────────────────────────────────────────────────────────────────
  {
    slug: 'don-quijote',
    title: 'Don Quijote de la Mancha',
    author: 'Miguel de Cervantes',
    year: 1605,
    language: 'es',
    altTitles: ['Don Quixote', 'El Quijote', 'The Ingenious Gentleman'],
    translations: { en: 'don-quixote' },
    description:
      'La primera novela moderna de la literatura occidental. Las aventuras del ingenioso hidalgo Don Quijote y su fiel escudero Sancho Panza a través de los campos de La Mancha.',
    genre: ['Clásico', 'Aventura', 'Sátira'],
    duration: '34h 15min',
    coverGradient: { from: '#7C2D12', to: '#1C0A00' },
    featured: true,
    chapters: [
      { id: 1, title: 'Capítulo I — Que trata de la condición del famoso hidalgo', duration: '18:32' },
      { id: 2, title: 'Capítulo II — De la primera salida que de su tierra hizo', duration: '22:10' },
      { id: 3, title: 'Capítulo III — La manera que tuvo Don Quijote en armarse caballero', duration: '15:44' },
    ],
  },
  {
    slug: 'dracula',
    title: 'Drácula',
    author: 'Bram Stoker',
    year: 1897,
    language: 'es',
    altTitles: ['Dracula'],
    translations: { en: 'dracula-en' },
    description:
      'La novela gótica más famosa de todos los tiempos. Jonathan Harker viaja a Transilvania y descubre el oscuro secreto del Conde Drácula.',
    genre: ['Terror', 'Gótico', 'Misterio'],
    duration: '15h 40min',
    coverGradient: { from: '#7F1D1D', to: '#0D0806' },
    featured: true,
    chapters: [
      { id: 1, title: 'Capítulo I — Diario de Jonathan Harker', duration: '28:15' },
      { id: 2, title: 'Capítulo II — El castillo del Conde', duration: '31:20' },
      { id: 3, title: 'Capítulo III — Una advertencia', duration: '24:50' },
    ],
  },
  {
    slug: 'frankenstein',
    title: 'Frankenstein',
    author: 'Mary Shelley',
    year: 1818,
    language: 'es',
    altTitles: ['Frankenstein or the Modern Prometheus', 'El moderno Prometeo'],
    translations: { en: 'frankenstein-en' },
    description:
      'El científico Víctor Frankenstein da vida a una criatura que desafía las leyes de la naturaleza. Una reflexión sobre la ambición, la responsabilidad y lo que nos hace humanos.',
    genre: ['Ciencia ficción', 'Terror', 'Filosofía'],
    duration: '9h 20min',
    coverGradient: { from: '#1E3A5F', to: '#050B14' },
    featured: true,
    chapters: [
      { id: 1, title: 'Carta I — A Margaret Saville', duration: '12:40' },
      { id: 2, title: 'Carta II — El viaje al Polo Norte', duration: '10:15' },
      { id: 3, title: 'Capítulo I — La infancia de Víctor', duration: '22:30' },
    ],
  },
  {
    slug: 'la-metamorfosis',
    title: 'La Metamorfosis',
    author: 'Franz Kafka',
    year: 1915,
    language: 'es',
    altTitles: ['The Metamorphosis', 'Die Verwandlung', 'La transformación'],
    description:
      'Gregor Samsa se despierta una mañana convertido en un insecto monstruoso. Una exploración del alienamiento, la identidad y las relaciones familiares.',
    genre: ['Clásico', 'Absurdismo', 'Drama'],
    duration: '2h 50min',
    coverGradient: { from: '#14532D', to: '#030D07' },
    featured: false,
    chapters: [
      { id: 1, title: 'Parte I', duration: '42:15' },
      { id: 2, title: 'Parte II', duration: '48:30' },
      { id: 3, title: 'Parte III', duration: '39:20' },
    ],
  },
  {
    slug: 'moby-dick-es',
    title: 'Moby Dick',
    author: 'Herman Melville',
    year: 1851,
    language: 'es',
    altTitles: ['Moby-Dick', 'La ballena blanca'],
    translations: { en: 'moby-dick' },
    description:
      'La obsesiva búsqueda del capitán Ahab por el mar para cazar a la ballena blanca que le arrancó la pierna. Una profunda meditación sobre el destino, la obsesión y la lucha humana contra la naturaleza.',
    genre: ['Aventura', 'Clásico', 'Filosofía'],
    duration: '24h 10min',
    coverGradient: { from: '#1E40AF', to: '#030712' },
    featured: false,
    chapters: [
      { id: 1, title: 'Capítulo I — Reflexiones', duration: '14:20' },
      { id: 2, title: 'Capítulo II — El saco de viaje', duration: '08:45' },
      { id: 3, title: 'Capítulo III — La posada Spouter', duration: '22:10' },
    ],
  },

  // ─── ENGLISH ────────────────────────────────────────────────────────────────
  {
    slug: 'don-quixote',
    title: 'Don Quixote',
    author: 'Miguel de Cervantes',
    year: 1605,
    language: 'en',
    altTitles: ['Don Quijote de la Mancha', 'El Quijote', 'The Ingenious Gentleman'],
    translations: { es: 'don-quijote' },
    description:
      'The first modern novel in Western literature. The adventures of the ingenious gentleman Don Quixote and his faithful squire Sancho Panza across the plains of La Mancha.',
    genre: ['Classic', 'Adventure', 'Satire'],
    duration: '34h 15min',
    coverGradient: { from: '#7C2D12', to: '#1C0A00' },
    featured: false,
    chapters: [
      { id: 1, title: 'Chapter I — Which treats of the condition of the famous hidalgo', duration: '18:32' },
      { id: 2, title: 'Chapter II — His first sally from home', duration: '22:10' },
      { id: 3, title: 'Chapter III — The manner in which Don Quixote was dubbed a knight', duration: '15:44' },
    ],
  },
  {
    slug: 'dracula-en',
    title: 'Dracula',
    author: 'Bram Stoker',
    year: 1897,
    language: 'en',
    altTitles: ['Drácula'],
    translations: { es: 'dracula' },
    description:
      'The most famous gothic novel of all time. Jonathan Harker travels to Transylvania and discovers the dark secret of Count Dracula.',
    genre: ['Horror', 'Gothic', 'Mystery'],
    duration: '15h 40min',
    coverGradient: { from: '#7F1D1D', to: '#0D0806' },
    featured: false,
    chapters: [
      { id: 1, title: 'Chapter I — Jonathan Harker\'s Journal', duration: '28:15' },
      { id: 2, title: 'Chapter II — Jonathan Harker\'s Journal (continued)', duration: '31:20' },
      { id: 3, title: 'Chapter III — Jonathan Harker\'s Journal (continued)', duration: '24:50' },
    ],
  },
  {
    slug: 'frankenstein-en',
    title: 'Frankenstein',
    author: 'Mary Shelley',
    year: 1818,
    language: 'en',
    altTitles: ['Frankenstein or the Modern Prometheus', 'El moderno Prometeo'],
    translations: { es: 'frankenstein' },
    description:
      'Scientist Victor Frankenstein creates a creature that defies the laws of nature. A reflection on ambition, responsibility, and what makes us human.',
    genre: ['Science fiction', 'Horror', 'Philosophy'],
    duration: '9h 20min',
    coverGradient: { from: '#1E3A5F', to: '#050B14' },
    featured: false,
    chapters: [
      { id: 1, title: 'Letter I — To Mrs. Saville, England', duration: '12:40' },
      { id: 2, title: 'Letter II — To Mrs. Saville, England', duration: '10:15' },
      { id: 3, title: 'Chapter I — Victor\'s early life', duration: '22:30' },
    ],
  },
  {
    slug: 'the-tell-tale-heart',
    title: 'The Tell-Tale Heart',
    author: 'Edgar Allan Poe',
    year: 1843,
    language: 'en',
    altTitles: ['El corazón delator', 'El corazón revelador'],
    description:
      'A classic short story of psychological horror. A narrator insists on his sanity while describing how he murdered an old man, driven mad by the sound of his beating heart.',
    genre: ['Horror', 'Psychological', 'Short story'],
    duration: '25min',
    coverGradient: { from: '#831843', to: '#0D0206' },
    featured: true,
    chapters: [{ id: 1, title: 'The Tell-Tale Heart (complete)', duration: '25:00' }],
  },
  {
    slug: 'moby-dick',
    title: 'Moby Dick',
    author: 'Herman Melville',
    year: 1851,
    language: 'en',
    altTitles: ['Moby-Dick', 'La ballena blanca', 'The White Whale'],
    translations: { es: 'moby-dick-es' },
    description:
      "Captain Ahab's obsessive quest across the oceans to hunt the white whale that took his leg. A profound meditation on fate, obsession, and the human struggle against nature.",
    genre: ['Adventure', 'Classic', 'Philosophy'],
    duration: '24h 10min',
    coverGradient: { from: '#1E40AF', to: '#030712' },
    featured: true,
    chapters: [
      { id: 1, title: 'Chapter I — Loomings', duration: '14:20' },
      { id: 2, title: 'Chapter II — The Carpet-Bag', duration: '08:45' },
      { id: 3, title: 'Chapter III — The Spouter-Inn', duration: '22:10' },
    ],
  },
  {
    slug: 'alice-in-wonderland',
    title: "Alice's Adventures in Wonderland",
    author: 'Lewis Carroll',
    year: 1865,
    language: 'en',
    altTitles: ['Alice in Wonderland', 'Alicia en el país de las maravillas'],
    description:
      'Young Alice falls through a rabbit hole into a fantastical world of talking animals, strange creatures, and an absurd logic all its own.',
    genre: ['Fantasy', 'Adventure', 'Classic'],
    duration: '3h 45min',
    coverGradient: { from: '#6D28D9', to: '#0D0520' },
    featured: false,
    chapters: [
      { id: 1, title: 'Chapter I — Down the Rabbit-Hole', duration: '11:30' },
      { id: 2, title: 'Chapter II — The Pool of Tears', duration: '09:15' },
      { id: 3, title: 'Chapter III — A Caucus-Race', duration: '08:40' },
    ],
  },
  {
    slug: 'the-great-gatsby',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    year: 1925,
    language: 'en',
    altTitles: ['El gran Gatsby', 'Gatsby el magnífico'],
    description:
      'Set in the Jazz Age of 1920s America, the story of the mysterious millionaire Jay Gatsby and his obsession with the beautiful Daisy Buchanan.',
    genre: ['Classic', 'Drama', 'Social critique'],
    duration: '5h 30min',
    coverGradient: { from: '#92400E', to: '#0C0804' },
    featured: false,
    chapters: [
      { id: 1, title: 'Chapter I', duration: '28:40' },
      { id: 2, title: 'Chapter II', duration: '24:15' },
      { id: 3, title: 'Chapter III', duration: '26:50' },
    ],
  },
];

export function getBookBySlug(slug: string): Book | undefined {
  return books.find((b) => b.slug === slug);
}

export function getFeaturedBooks(): Book[] {
  return books.filter((b) => b.featured);
}

/** Busca libros por título (incluyendo altTitles) y autor, sin distinguir mayúsculas */
export function searchBooks(query: string): Book[] {
  const q = query.toLowerCase().trim();
  if (!q) return books;
  return books.filter((b) => {
    const inTitle = b.title.toLowerCase().includes(q);
    const inAlt = b.altTitles?.some((t) => t.toLowerCase().includes(q));
    const inAuthor = b.author.toLowerCase().includes(q);
    return inTitle || inAlt || inAuthor;
  });
}
