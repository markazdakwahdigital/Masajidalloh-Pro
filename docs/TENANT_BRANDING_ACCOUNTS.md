# Identitas dan tujuan donasi tenant

Profile Masjid mempunyai kolom Visi Masjid (opsional), Upload Logo (JPG/PNG/WebP maksimum 2 MB), serta formulir berulang Rekening Bank & E-wallet Masjid. Rekening memuat jenis, nama penyedia, nomor, atas nama, dan peruntukan opsional. Admin dapat mengubah dan mengarsipkan setiap rekening. Nomor tetap berupa teks agar angka nol awal tidak hilang.

Visi tampil di bawah nama Masjid pada Dashboard Utama. Logo pojok kiri atas disembunyikan untuk dashboard tenant. Navigasi menggunakan logo tenant; sebelum logo diunggah atau saat gambar gagal dimuat, navigasi menggunakan logo Masajidalloh Pro. Logo menggunakan gateway Drive bertanda tangan yang sudah aktif, dengan folder tenant dan awalan record UUID tenant; akses langsung ke file Drive tetap privat. Endpoint gambar hanya melayani logo yang sedang ditautkan pada tenant aktif, dan tidak menerima file ID arbitrer dari parameter URL.

Rekening ditampilkan di Dashboard Utama bagi Admin dan publik, termasuk tombol Salin Nomor. Ini adalah tujuan transfer yang diisi Admin, bukan bukti transaksi atau pencatatan pemasukan. Daftar tidak mengubah saldo kas. Form rekening dan logo hanya dapat disimpan oleh Admin terdaftar pada tenant aktif; pembaca tidak diberi form.

Sumber Penerimaan Infaq & Shodaqoh mencakup Takmir Masjid dan Aplikasi di samping pilihan sebelumnya.

Perubahan database: `supabase/tenant-branding-accounts.sql`, diterapkan setelah public-admin-revision dan public-directory. Mengubah validator dan batas jenis catatan, memperluas proyeksi publik hanya dengan rekening dan visi/logo, serta menambahkan RPC terbatas `mp_set_mosque_logo` / `mp_mosque_logo`. Tidak membuka akses langsung tabel.

Validasi: typecheck, ESLint, Cloudflare build/output check; pengujian unit laporan/validasi/gateway Drive; `tests/tenant-branding-accounts.sql` memakai fixture tiga paket di dalam transaksi ROLLBACK (67 pemeriksaan). Tidak mengubah rekening, logo, atau visi tenant nyata untuk pengujian.
