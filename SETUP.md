# Lectoria — Setup en 4 pasos

## PASO 1 — Crear proyecto en Supabase (5 min)

1. Ir a https://supabase.com y loguearte
2. Crear nuevo proyecto: nombre "lectoria", elegir región "South America (São Paulo)"
3. Esperar que termine de crear (~2 min)
4. Ir a **Settings > API** y copiar:
   - `Project URL` → para NEXT_PUBLIC_SUPABASE_URL
   - `anon public` → para NEXT_PUBLIC_SUPABASE_ANON_KEY
   - `service_role` → para SUPABASE_SERVICE_ROLE_KEY

---

## PASO 2 — Crear el archivo .env.local

En la carpeta `D:\Documents\Desktop\lectoria`, crear un archivo llamado `.env.local` con:

```
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

(Reemplazar con los valores del Paso 1)

---

## PASO 3 — Correr el SQL en Supabase (2 min)

1. En Supabase, ir a **SQL Editor**
2. Hacer click en **New query**
3. Copiar todo el contenido de `supabase/migrations/001_initial.sql`
4. Pegar y hacer click en **Run**

Esto crea todas las tablas y carga los datos iniciales.

---

## PASO 4 — Conectar Vercel (3 min)

1. Ir a https://vercel.com y loguearte con GitHub
2. Click en **Add New Project**
3. Importar el repo `mariabruno93/Lectoria`
4. En **Environment Variables**, agregar las 3 variables del .env.local
5. Click en **Deploy**

Tu app queda en vivo en `lectoria.vercel.app` (o similar)

---

## Crear usuario admin

Después del deploy, en Supabase > **Authentication > Users**:
1. Click en **Invite user**
2. Poner tu email
3. Confirmar desde tu email
4. Entrar a `/admin` con esas credenciales

---

## URLs importantes

- App local: http://localhost:3000 (con `npm run dev`)
- Admin local: http://localhost:3000/admin
- Repo: https://github.com/mariabruno93/Lectoria
