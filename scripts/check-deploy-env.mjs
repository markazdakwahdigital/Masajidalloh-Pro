/**
 * Secret-safe Netlify preflight. This intentionally does not connect to the DB,
 * and must NEVER print the value or full connection URL of any environment variable.
 */
const faults = [];
const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
const database = process.env.DATABASE_URL?.trim();
if (!publicUrl) {
  faults.push('NEXT_PUBLIC_SUPABASE_URL belum dikonfigurasi.');
} else {
  try {
    const url = new URL(publicUrl);
    if (url.protocol !== 'https:' || url.hostname !== 'vsbvyhghggvzoanozvvw.supabase.co' || url.pathname !== '/') {
      faults.push('NEXT_PUBLIC_SUPABASE_URL harus berupa URL HTTPS proyek Supabase yang benar.');
    }
  } catch {
    faults.push('NEXT_PUBLIC_SUPABASE_URL bukan URL yang valid.');
  }
}
if (!publishable) {
  faults.push('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY belum dikonfigurasi.');
} else if (!publishable.startsWith('sb_publishable_') && !publishable.startsWith('eyJ')) {
  faults.push('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY tidak terlihat seperti publishable key/anon key Supabase.');
}
if (!database) {
  faults.push('DATABASE_URL belum dikonfigurasi.');
} else {
  try {
    const url = new URL(database);
    if (!['postgresql:', 'postgres:'].includes(url.protocol) || !url.hostname || !url.username || !url.password || !url.pathname || url.password.includes('YOUR-PASSWORD')) {
      faults.push('DATABASE_URL harus berupa connection string PostgreSQL lengkap dengan username, password, host, dan database.');
    }
    if (!url.hostname.endsWith('.supabase.com')) faults.push('DATABASE_URL harus menggunakan host PostgreSQL Supabase.');
  } catch {
    faults.push('DATABASE_URL tidak memiliki format URL PostgreSQL yang valid.');
  }
}
if (faults.length) {
  console.error('\n[MASAJIDALLOH PRO] Pemeriksaan konfigurasi deployment GAGAL.');
  faults.forEach((fault, i) => console.error(`  ${i + 1}. ${fault}`));
  console.error('Nilai kredensial disembunyikan. Perbaiki variabel di Netlify → Environment variables.\n');
  process.exitCode = 1;
} else {
  console.log('[MASAJIDALLOH PRO] Format variabel lingkungan lolos pemeriksaan awal (belum menguji koneksi database).');
}
