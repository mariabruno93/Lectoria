-- ─────────────────────────────────────────────────────────────────────────
-- 003_profile_contact.sql — Datos de contacto y redes del perfil de autor
--
-- El perfil de autor pasa a ser una carta de presentación pública (opcional
-- por autor). Estos campos son TODOS opcionales; solo se muestran si el autor
-- los completa. Correr en el editor SQL de Supabase. Idempotente.
-- ─────────────────────────────────────────────────────────────────────────

alter table public.profiles add column if not exists phone         text;
alter table public.profiles add column if not exists contact_email text;
alter table public.profiles add column if not exists instagram     text;
alter table public.profiles add column if not exists website       text;
