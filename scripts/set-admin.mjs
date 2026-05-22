/**
 * Marca a un usuario como admin en Lectoria.
 * Uso: node scripts/set-admin.mjs tu@email.com
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

const email = process.argv[2];
if (!email) {
  console.error('Uso: node scripts/set-admin.mjs tu@email.com');
  process.exit(1);
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

// Buscar el usuario por email en auth.users
const { data: users, error: listError } = await supabase.auth.admin.listUsers();
if (listError) { console.error('Error listando usuarios:', listError.message); process.exit(1); }

const user = users.users.find(u => u.email === email);
if (!user) {
  console.error(`No se encontró usuario con email: ${email}`);
  console.log('Usuarios registrados:', users.users.map(u => u.email).join(', '));
  process.exit(1);
}

// Actualizar el perfil
const { error } = await supabase
  .from('profiles')
  .update({ is_admin: true })
  .eq('id', user.id);

if (error) {
  console.error('Error actualizando perfil:', error.message);
  process.exit(1);
}

console.log(`✓ ${email} ahora es admin (id: ${user.id})`);
