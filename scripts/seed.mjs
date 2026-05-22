/**
 * Seed script — carga los 11 libros en Supabase.
 * Uso: node scripts/seed.mjs
 * Lee las claves desde .env.local automáticamente.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const dir = dirname(fileURLToPath(import.meta.url));
const envFile = readFileSync(resolve(dir, '../.env.local'), 'utf8');
const env = Object.fromEntries(
  envFile.split('\n').filter(l => l.includes('=')).map(l => {
    const [k, ...v] = l.split('=');
    return [k.trim(), v.join('=').trim()];
  })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data: authors } = await supabase.from('authors').select('id, slug');
const bySlug = Object.fromEntries(authors.map((a) => [a.slug, a.id]));

const books = [
  { slug: 'don-quijote', title: 'Don Quijote de la Mancha', type: 'book', author_id: bySlug['miguel-de-cervantes'], language: 'es', year: 1605, description: 'La primera novela moderna de la literatura occidental. Las aventuras del hidalgo Don Quijote y su escudero Sancho Panza.', genre: ['Clasico', 'Aventura', 'Satira'], duration_label: '34h 15min', cover_gradient_from: '#7C2D12', cover_gradient_to: '#1C0A00', featured: true, translation_slug: 'don-quixote', alt_titles: ['Don Quixote', 'El Quijote'] },
  { slug: 'don-quixote', title: 'Don Quixote', type: 'book', author_id: bySlug['miguel-de-cervantes'], language: 'en', year: 1605, description: 'The first modern novel in Western literature. The adventures of Don Quixote and his faithful squire Sancho Panza.', genre: ['Classic', 'Adventure', 'Satire'], duration_label: '34h 15min', cover_gradient_from: '#7C2D12', cover_gradient_to: '#1C0A00', featured: false, translation_slug: 'don-quijote', alt_titles: ['Don Quijote de la Mancha'] },
  { slug: 'dracula', title: 'Dracula', type: 'book', author_id: bySlug['bram-stoker'], language: 'es', year: 1897, description: 'La novela gotica mas famosa. Jonathan Harker viaja a Transilvania y descubre el secreto del Conde Dracula.', genre: ['Terror', 'Gotico', 'Misterio'], duration_label: '15h 40min', cover_gradient_from: '#7F1D1D', cover_gradient_to: '#0D0806', featured: true, translation_slug: 'dracula-en', alt_titles: ['Dracula'] },
  { slug: 'dracula-en', title: 'Dracula', type: 'book', author_id: bySlug['bram-stoker'], language: 'en', year: 1897, description: 'The most famous gothic novel. Jonathan Harker travels to Transylvania and discovers the dark secret of Count Dracula.', genre: ['Horror', 'Gothic', 'Mystery'], duration_label: '15h 40min', cover_gradient_from: '#7F1D1D', cover_gradient_to: '#0D0806', featured: false, translation_slug: 'dracula', alt_titles: ['Dracula'] },
  { slug: 'frankenstein', title: 'Frankenstein', type: 'book', author_id: bySlug['mary-shelley'], language: 'es', year: 1818, description: 'El cientifico Victor Frankenstein da vida a una criatura que desafia las leyes de la naturaleza.', genre: ['Ciencia ficcion', 'Terror', 'Filosofia'], duration_label: '9h 20min', cover_gradient_from: '#1E3A5F', cover_gradient_to: '#050B14', featured: true, translation_slug: 'frankenstein-en', alt_titles: ['Frankenstein or the Modern Prometheus'] },
  { slug: 'frankenstein-en', title: 'Frankenstein', type: 'book', author_id: bySlug['mary-shelley'], language: 'en', year: 1818, description: 'Scientist Victor Frankenstein creates a creature that defies the laws of nature.', genre: ['Science fiction', 'Horror', 'Philosophy'], duration_label: '9h 20min', cover_gradient_from: '#1E3A5F', cover_gradient_to: '#050B14', featured: false, translation_slug: 'frankenstein', alt_titles: ['Frankenstein or the Modern Prometheus'] },
  { slug: 'la-metamorfosis', title: 'La Metamorfosis', type: 'book', author_id: bySlug['franz-kafka'], language: 'es', year: 1915, description: 'Gregor Samsa se despierta convertido en un insecto monstruoso. Una exploracion del alienamiento y la identidad.', genre: ['Clasico', 'Absurdismo', 'Drama'], duration_label: '2h 50min', cover_gradient_from: '#14532D', cover_gradient_to: '#030D07', featured: false, translation_slug: null, alt_titles: ['The Metamorphosis'] },
  { slug: 'moby-dick', title: 'Moby Dick', type: 'book', author_id: bySlug['herman-melville'], language: 'en', year: 1851, description: 'The obsessive quest of Captain Ahab to hunt the white whale. A meditation on fate and obsession.', genre: ['Adventure', 'Classic', 'Philosophy'], duration_label: '24h 10min', cover_gradient_from: '#1E40AF', cover_gradient_to: '#030712', featured: true, translation_slug: 'moby-dick-es', alt_titles: ['La ballena blanca'] },
  { slug: 'moby-dick-es', title: 'Moby Dick', type: 'book', author_id: bySlug['herman-melville'], language: 'es', year: 1851, description: 'La obsesiva busqueda del capitan Ahab para cazar la ballena blanca que le arranco la pierna.', genre: ['Aventura', 'Clasico', 'Filosofia'], duration_label: '24h 10min', cover_gradient_from: '#1E40AF', cover_gradient_to: '#030712', featured: false, translation_slug: 'moby-dick', alt_titles: ['La ballena blanca'] },
  { slug: 'alice-in-wonderland', title: 'Alice in Wonderland', type: 'book', author_id: bySlug['lewis-carroll'], language: 'en', year: 1865, description: 'Young Alice falls through a rabbit hole into a fantastical world of talking animals and strange creatures.', genre: ['Fantasy', 'Adventure', 'Classic'], duration_label: '3h 45min', cover_gradient_from: '#6D28D9', cover_gradient_to: '#0D0520', featured: false, translation_slug: null, alt_titles: ['Alicia en el pais de las maravillas'] },
  { slug: 'the-great-gatsby', title: 'The Great Gatsby', type: 'book', author_id: bySlug['f-scott-fitzgerald'], language: 'en', year: 1925, description: 'The story of Jay Gatsby and his obsession with Daisy Buchanan. A portrait of the American Dream in the Jazz Age.', genre: ['Classic', 'Drama', 'Social critique'], duration_label: '5h 30min', cover_gradient_from: '#92400E', cover_gradient_to: '#0C0804', featured: false, translation_slug: null, alt_titles: ['El gran Gatsby'] },
];

const { error } = await supabase.from('works').upsert(books, { onConflict: 'slug' });
if (error) { console.error('Error:', error.message); process.exit(1); }
console.log(`OK — ${books.length} libros cargados.`);
