-- ================================================================
-- user_library: listas personales por usuario
-- Ejecutar en Supabase SQL Editor
-- ================================================================

CREATE TABLE IF NOT EXISTS user_library (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  work_id      UUID        REFERENCES works(id) ON DELETE CASCADE NOT NULL,
  is_following BOOLEAN     DEFAULT false NOT NULL,
  is_playing   BOOLEAN     DEFAULT false NOT NULL,
  is_finished  BOOLEAN     DEFAULT false NOT NULL,
  updated_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT user_library_unique UNIQUE (user_id, work_id)
);

-- RLS
ALTER TABLE user_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_library_all_own"
  ON user_library
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Índices
CREATE INDEX IF NOT EXISTS user_library_user_idx ON user_library(user_id);
CREATE INDEX IF NOT EXISTS user_library_work_idx ON user_library(work_id);
