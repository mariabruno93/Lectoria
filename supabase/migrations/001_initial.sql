-- ============================================================
-- LECTORIA — Schema inicial
-- Correr en: Supabase Dashboard > SQL Editor
-- ============================================================

-- AUTORES
CREATE TABLE IF NOT EXISTS authors (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text UNIQUE NOT NULL,
  name          text NOT NULL,
  bio           text,
  nationality   text,
  born_year     int,
  died_year     int,
  photo_url     text,
  created_at    timestamptz DEFAULT now()
);

-- OBRAS (libros Y cuentos cortos)
CREATE TABLE IF NOT EXISTS works (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                 text UNIQUE NOT NULL,
  title                text NOT NULL,
  type                 text NOT NULL CHECK (type IN ('book', 'story')),
  author_id            uuid REFERENCES authors(id) ON DELETE SET NULL,
  language             text NOT NULL CHECK (language IN ('es', 'en')),
  year                 int,
  description          text,
  genre                text[] DEFAULT '{}',
  duration_label       text,
  cover_gradient_from  text NOT NULL DEFAULT '#1a1a2e',
  cover_gradient_to    text NOT NULL DEFAULT '#0d0d0d',
  featured             boolean DEFAULT false,
  translation_slug     text,
  alt_titles           text[] DEFAULT '{}',
  created_at           timestamptz DEFAULT now()
);

-- CAPITULOS (solo para libros; cuentos no tienen)
CREATE TABLE IF NOT EXISTS chapters (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id         uuid REFERENCES works(id) ON DELETE CASCADE,
  chapter_number  int NOT NULL,
  title           text NOT NULL,
  audio_url       text,
  duration_label  text,
  created_at      timestamptz DEFAULT now(),
  UNIQUE (work_id, chapter_number)
);

-- REPRODUCCIONES (stats)
CREATE TABLE IF NOT EXISTS plays (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id          uuid REFERENCES works(id) ON DELETE CASCADE,
  chapter_id       uuid REFERENCES chapters(id) ON DELETE SET NULL,
  played_at        timestamptz DEFAULT now(),
  duration_seconds int
);

-- INDICES
CREATE INDEX IF NOT EXISTS idx_works_author    ON works(author_id);
CREATE INDEX IF NOT EXISTS idx_works_type      ON works(type);
CREATE INDEX IF NOT EXISTS idx_works_language  ON works(language);
CREATE INDEX IF NOT EXISTS idx_works_featured  ON works(featured);
CREATE INDEX IF NOT EXISTS idx_chapters_work   ON chapters(work_id);
CREATE INDEX IF NOT EXISTS idx_plays_work      ON plays(work_id);

-- STORAGE: bucket para audios (ejecutar por separado si es necesario)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('audio', 'audio', true)
-- ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED: Autores
-- ============================================================
INSERT INTO authors (slug, name, bio, nationality, born_year, died_year) VALUES
('miguel-de-cervantes', 'Miguel de Cervantes', 'Novelista, poeta y dramaturgo español. Autor de Don Quijote de la Mancha, considerada la primera novela moderna de la literatura occidental.', 'Español', 1547, 1616),
('horacio-quiroga', 'Horacio Quiroga', 'Escritor uruguayo considerado el maestro del cuento latinoamericano. Sus relatos exploran el drama humano en la selva misionera con una prosa precisa e implacable.', 'Uruguayo', 1878, 1937),
('edgar-allan-poe', 'Edgar Allan Poe', 'Escritor, poeta y crítico literario estadounidense. Pionero del cuento moderno y padre del relato de terror psicológico y la ciencia ficción.', 'Estadounidense', 1809, 1849),
('bram-stoker', 'Bram Stoker', 'Escritor irlandés autor de Drácula (1897), novela epistolar que definió el género gótico y creó el arquetipo moderno del vampiro.', 'Irlandés', 1847, 1912),
('mary-shelley', 'Mary Shelley', 'Escritora inglesa autora de Frankenstein (1818), considerada la primera novela de ciencia ficción de la historia. Hija de la filósofa Mary Wollstonecraft.', 'Inglesa', 1797, 1851),
('franz-kafka', 'Franz Kafka', 'Escritor checo de lengua alemana. Sus obras exploran temas de alienación, burocracia absurda y culpa existencial con un estilo único que dio origen al adjetivo kafkiano.', 'Checo', 1883, 1924),
('herman-melville', 'Herman Melville', 'Novelista estadounidense. Moby Dick (1851), su obra cumbre, es considerada una de las mayores novelas de la literatura universal.', 'Estadounidense', 1819, 1891),
('lewis-carroll', 'Lewis Carroll', 'Escritor, matemático y fotógrafo británico. Creador de Alicia en el país de las maravillas, una obra maestra de la literatura nonsense y la fantasía.', 'Inglés', 1832, 1898),
('f-scott-fitzgerald', 'F. Scott Fitzgerald', 'Novelista estadounidense y cronista de la Era del Jazz. El gran Gatsby (1925) es su obra más célebre y un retrato implacable del Sueño Americano.', 'Estadounidense', 1896, 1940)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- SEED: Obras — Libros
-- ============================================================
INSERT INTO works (slug, title, type, author_id, language, year, description, genre, duration_label, cover_gradient_from, cover_gradient_to, featured, translation_slug, alt_titles) VALUES

('don-quijote', 'Don Quijote de la Mancha', 'book',
  (SELECT id FROM authors WHERE slug='miguel-de-cervantes'),
  'es', 1605,
  'La primera novela moderna de la literatura occidental. Las aventuras del ingenioso hidalgo Don Quijote y su fiel escudero Sancho Panza a través de los campos de La Mancha.',
  ARRAY['Clásico','Aventura','Sátira'], '34h 15min', '#7C2D12', '#1C0A00', true, 'don-quixote',
  ARRAY['Don Quixote','El Quijote','The Ingenious Gentleman']),

('don-quixote', 'Don Quixote', 'book',
  (SELECT id FROM authors WHERE slug='miguel-de-cervantes'),
  'en', 1605,
  'The first modern novel in Western literature. The adventures of the ingenious gentleman Don Quixote and his faithful squire Sancho Panza across the plains of La Mancha.',
  ARRAY['Classic','Adventure','Satire'], '34h 15min', '#7C2D12', '#1C0A00', false, 'don-quijote',
  ARRAY['Don Quijote de la Mancha','El Quijote']),

('dracula', 'Drácula', 'book',
  (SELECT id FROM authors WHERE slug='bram-stoker'),
  'es', 1897,
  'La novela gótica más famosa de todos los tiempos. Jonathan Harker viaja a Transilvania y descubre el oscuro secreto del Conde Drácula.',
  ARRAY['Terror','Gótico','Misterio'], '15h 40min', '#7F1D1D', '#0D0806', true, 'dracula-en',
  ARRAY['Dracula']),

('dracula-en', 'Dracula', 'book',
  (SELECT id FROM authors WHERE slug='bram-stoker'),
  'en', 1897,
  'The most famous gothic novel of all time. Jonathan Harker travels to Transylvania and discovers the dark secret of Count Dracula.',
  ARRAY['Horror','Gothic','Mystery'], '15h 40min', '#7F1D1D', '#0D0806', false, 'dracula',
  ARRAY['Drácula']),

('frankenstein', 'Frankenstein', 'book',
  (SELECT id FROM authors WHERE slug='mary-shelley'),
  'es', 1818,
  'El científico Víctor Frankenstein da vida a una criatura que desafía las leyes de la naturaleza. Una reflexión sobre la ambición, la responsabilidad y lo que nos hace humanos.',
  ARRAY['Ciencia ficción','Terror','Filosofía'], '9h 20min', '#1E3A5F', '#050B14', true, 'frankenstein-en',
  ARRAY['Frankenstein or the Modern Prometheus']),

('frankenstein-en', 'Frankenstein', 'book',
  (SELECT id FROM authors WHERE slug='mary-shelley'),
  'en', 1818,
  'Scientist Victor Frankenstein creates a creature that defies the laws of nature. A reflection on ambition, responsibility, and what makes us human.',
  ARRAY['Science fiction','Horror','Philosophy'], '9h 20min', '#1E3A5F', '#050B14', false, 'frankenstein',
  ARRAY['Frankenstein or the Modern Prometheus']),

('la-metamorfosis', 'La Metamorfosis', 'book',
  (SELECT id FROM authors WHERE slug='franz-kafka'),
  'es', 1915,
  'Gregor Samsa se despierta una mañana convertido en un insecto monstruoso. Una exploración del alienamiento, la identidad y las relaciones familiares.',
  ARRAY['Clásico','Absurdismo','Drama'], '2h 50min', '#14532D', '#030D07', false, null,
  ARRAY['The Metamorphosis','Die Verwandlung']),

('moby-dick', 'Moby Dick', 'book',
  (SELECT id FROM authors WHERE slug='herman-melville'),
  'en', 1851,
  'Captain Ahab''s obsessive quest to hunt the white whale that took his leg. A meditation on fate, obsession, and the human struggle against nature.',
  ARRAY['Adventure','Classic','Philosophy'], '24h 10min', '#1E40AF', '#030712', true, 'moby-dick-es',
  ARRAY['Moby-Dick','The White Whale','La ballena blanca']),

('moby-dick-es', 'Moby Dick', 'book',
  (SELECT id FROM authors WHERE slug='herman-melville'),
  'es', 1851,
  'La obsesiva búsqueda del capitán Ahab por el mar para cazar a la ballena blanca que le arrancó la pierna.',
  ARRAY['Aventura','Clásico','Filosofía'], '24h 10min', '#1E40AF', '#030712', false, 'moby-dick',
  ARRAY['Moby-Dick','The White Whale','La ballena blanca']),

('alice-in-wonderland', 'Alice''s Adventures in Wonderland', 'book',
  (SELECT id FROM authors WHERE slug='lewis-carroll'),
  'en', 1865,
  'Young Alice falls through a rabbit hole into a fantastical world of talking animals, strange creatures, and an absurd logic all its own.',
  ARRAY['Fantasy','Adventure','Classic'], '3h 45min', '#6D28D9', '#0D0520', false, null,
  ARRAY['Alice in Wonderland','Alicia en el país de las maravillas']),

('the-great-gatsby', 'The Great Gatsby', 'book',
  (SELECT id FROM authors WHERE slug='f-scott-fitzgerald'),
  'en', 1925,
  'Set in the Jazz Age, the story of the mysterious millionaire Jay Gatsby and his obsession with the beautiful Daisy Buchanan.',
  ARRAY['Classic','Drama','Social critique'], '5h 30min', '#92400E', '#0C0804', false, null,
  ARRAY['El gran Gatsby','Gatsby el magnífico'])

ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- SEED: Obras — Cuentos cortos
-- ============================================================
INSERT INTO works (slug, title, type, author_id, language, year, description, genre, duration_label, cover_gradient_from, cover_gradient_to, featured, translation_slug, alt_titles) VALUES

('el-almohadon-de-plumas', 'El almohadón de plumas', 'story',
  (SELECT id FROM authors WHERE slug='horacio-quiroga'),
  'es', 1907,
  'Una joven recién casada enferma misteriosamente. El horror se esconde en lo cotidiano en este cuento magistral de Quiroga.',
  ARRAY['Terror','Cuento','Gótico'], '18min', '#7C2D12', '#1C0A00', true, 'the-feather-pillow',
  ARRAY['The Feather Pillow']),

('the-feather-pillow', 'The Feather Pillow', 'story',
  (SELECT id FROM authors WHERE slug='horacio-quiroga'),
  'en', 1907,
  'A newlywed woman falls mysteriously ill. Horror lurks in the ordinary in this masterful story by Quiroga.',
  ARRAY['Horror','Short story','Gothic'], '18min', '#7C2D12', '#1C0A00', false, 'el-almohadon-de-plumas',
  ARRAY['El almohadón de plumas']),

('a-la-deriva', 'A la deriva', 'story',
  (SELECT id FROM authors WHERE slug='horacio-quiroga'),
  'es', 1912,
  'Un hombre mordido por una serpiente venenosa lucha contra la muerte mientras deriva por el río Paraná. La naturaleza, indiferente y letal.',
  ARRAY['Drama','Cuento','Selva'], '12min', '#14532D', '#030D07', true, 'adrift',
  ARRAY['Adrift','Drifting']),

('adrift', 'Adrift', 'story',
  (SELECT id FROM authors WHERE slug='horacio-quiroga'),
  'en', 1912,
  'A man bitten by a venomous snake struggles against death while drifting down the Paraná river. Nature, indifferent and lethal.',
  ARRAY['Drama','Short story','Jungle'], '12min', '#14532D', '#030D07', false, 'a-la-deriva',
  ARRAY['A la deriva']),

('la-gallina-degollada', 'La gallina degollada', 'story',
  (SELECT id FROM authors WHERE slug='horacio-quiroga'),
  'es', 1909,
  'Una familia con cuatro hijos discapacitados y una niña sana. Uno de los relatos más perturbadores y perfectos de la literatura latinoamericana.',
  ARRAY['Terror','Cuento','Drama'], '20min', '#831843', '#0D0206', true, null,
  ARRAY['The Decapitated Chicken']),

('el-hijo', 'El hijo', 'story',
  (SELECT id FROM authors WHERE slug='horacio-quiroga'),
  'es', 1928,
  'Un padre espera a su hijo que fue a cazar al monte. La tensión entre la realidad y el deseo de un padre transforma este cuento en una obra maestra.',
  ARRAY['Drama','Cuento','Paternidad'], '15min', '#78350F', '#1C0A00', false, null,
  ARRAY['The Son']),

('the-tell-tale-heart', 'The Tell-Tale Heart', 'story',
  (SELECT id FROM authors WHERE slug='edgar-allan-poe'),
  'en', 1843,
  'A narrator insists on his sanity while describing how he murdered an old man, driven mad by the sound of his beating heart.',
  ARRAY['Horror','Psychological','Short story'], '25min', '#831843', '#0D0206', true, 'el-corazon-delator',
  ARRAY['El corazón delator','El corazón revelador']),

('el-corazon-delator', 'El corazón delator', 'story',
  (SELECT id FROM authors WHERE slug='edgar-allan-poe'),
  'es', 1843,
  'Un narrador insiste en su cordura mientras describe cómo asesinó a un anciano, enloquecido por el sonido de su corazón latiente.',
  ARRAY['Terror','Psicológico','Cuento'], '25min', '#831843', '#0D0206', false, 'the-tell-tale-heart',
  ARRAY['The Tell-Tale Heart'])

ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- SEED: Capítulos (Don Quijote - cap 1 con audio real)
-- ============================================================
INSERT INTO chapters (work_id, chapter_number, title, audio_url, duration_label) VALUES
((SELECT id FROM works WHERE slug='don-quijote'), 1,
 'Capítulo I — Que trata de la condición del famoso hidalgo',
 '/audio/don-quijote/1.mp3', '11:02'),
((SELECT id FROM works WHERE slug='don-quijote'), 2,
 'Capítulo II — De la primera salida que de su tierra hizo',
 null, '22:10'),
((SELECT id FROM works WHERE slug='don-quijote'), 3,
 'Capítulo III — La manera que tuvo Don Quijote en armarse caballero',
 null, '15:44'),
((SELECT id FROM works WHERE slug='dracula'), 1,
 'Capítulo I — Diario de Jonathan Harker', null, '28:15'),
((SELECT id FROM works WHERE slug='dracula'), 2,
 'Capítulo II — El castillo del Conde', null, '31:20'),
((SELECT id FROM works WHERE slug='frankenstein'), 1,
 'Carta I — A Margaret Saville', null, '12:40'),
((SELECT id FROM works WHERE slug='frankenstein'), 2,
 'Capítulo I — La infancia de Víctor', null, '22:30'),
((SELECT id FROM works WHERE slug='moby-dick'), 1,
 'Chapter I — Loomings', null, '14:20'),
((SELECT id FROM works WHERE slug='moby-dick'), 2,
 'Chapter II — The Carpet-Bag', null, '08:45'),
((SELECT id FROM works WHERE slug='la-metamorfosis'), 1,
 'Parte I', null, '42:15'),
((SELECT id FROM works WHERE slug='la-metamorfosis'), 2,
 'Parte II', null, '48:30'),
((SELECT id FROM works WHERE slug='alice-in-wonderland'), 1,
 'Chapter I — Down the Rabbit-Hole', null, '11:30'),
((SELECT id FROM works WHERE slug='the-great-gatsby'), 1,
 'Chapter I', null, '28:40')
ON CONFLICT DO NOTHING;
