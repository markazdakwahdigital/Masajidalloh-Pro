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
} else if (/^(?:[\"']|sb_publishable_\s|Publishable key|somevalue)/i.test(publishable)) {
  faults.push('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY mengandung tanda kutip/teks contoh atau karakter awal tidak sesuai. Salin hanya nilai kunci mentah dari Supabase → Project Settings → API Keys.');
} else if (!publishable.startsWith('sb_publishable_') && !publishable.startsWith('eyJ')) {
  faults.push('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY harus diawali sb_publishable_ (atau JWT anon lama eyJ). Jangan masukkan label atau URL.');
}
if (!database) {
  faults.push('DATABASE_URL belum dikonfigurasi.');
} else {
  try {
    // Report only non-sensitive shape diagnostics, never a username, host, password, or full URL.
    if (!/^postgres(?:ql)?:\/\//i.test(database)) {
      faults.push('DATABASE_URL tidak diawali postgresql://. Pastikan yang ditempel adalah seluruh Connection string (URI), bukan password saja.');
    }
    if (database.includes('[YOUR-PASSWORD]')) faults.push('DATABASE_URL masih memakai placeholder [YOUR-PASSWORD].');
    if (/^https?:\/\//i.test(database)) faults.push('DATABASE_URL adalah HTTP URL, bukan PostgreSQL URI.');
    if (database.startsWith('"') || database.startsWith("'")) {
      faults.push('DATABASE_URL mengandung tanda kutip pembungkus. Hapus tanda kutip; tempel URL mentah saja.');
    }
    if (/\[YOUR-PASSWORD\]|\bConnection string PostgreSQL\b|^somevalue$/i.test(database)) {
      faults.push('DATABASE_URL masih berisi placeholder/teks contoh; harus menggunakan password database sebenarnya.');
    }
    if (/[\r\n]/.test(database)) faults.push('DATABASE_URL harus satu baris tanpa enter.');
    const url = new URL(database);
    if (!['postgresql:', 'postgres:'].includes(url.protocol) || !url.hostname || !url.username || !url.password || !url.pathname || url.password.includes('YOUR-PASSWORD')) {
      faults.push('DATABASE_URL harus berupa connection string PostgreSQL lengkap dengan username, password, host, dan database.');
    }
    if (!url.hostname.endsWith('.supabase.com')) faults.push('DATABASE_URL harus menggunakan host PostgreSQL Supabase.');
    if (!url.password) faults.push('DATABASE_URL tidak memiliki password setelah tanda titik dua (:).');
  } catch {
    faults.push('DATABASE_URL bukan URL PostgreSQL valid. Salin URI dari Supabase → Connect → Transaction pooler, hapus [YOUR-PASSWORD] beserta tanda [], masukkan password yang telah di-percent-encode, lalu simpan sebagai satu baris.');
  }
}
if (faults.length) {
  console.error('\n[MASAJIDALLOH PRO] Pemeriksaan konfigurasi deployment GAGAL.');
  faults.forEach((fault, i) => console.error(`  ${i + 1}. ${fault}`));
  console.error('Nilai kredensial disembunyikan. Jika menjalankan GitHub Actions, perbarui nilai di GitHub → Settings → Secrets and variables → Actions → Repository secrets; Netlify Environment variables tidak mengganti GitHub Secrets.\n');
  process.exitCode = 1;
} else {
  console.log('[MASAJIDALLOH PRO] Format variabel lingkungan lolos pemeriksaan awal (belum menguji koneksi database).');
}
