# Revisi akses publik dan Admin tambahan

Penerapan: jalankan public-admin-revision.sql sesudah multitenant-launch.sql dan tenant-management.sql. SQL ini menggantikan akses pembaca berbasis keanggotaan dengan proyeksi laporan publik. Jangan jalankan ulang skrip awal sesudah revisi ini tanpa menerapkan revisi kembali.

- Akun Admin mencatat WhatsApp di metadata dan profil User. Nilai metadata hanya untuk biodata, tidak menentukan izin.
- Email Admin dan identitas User dicatat dalam AdminEmailRegistry; pencabutan akses tidak menghapus riwayat. Trigger memblokir pembuatan ulang akun historis. Operator email pengembang dikecualikan. Auth tetap mempertahankan satu akun per email.
- Admin historis dan akun dengan permohonan pending tidak dapat mendaftarkan Masjid baru.
- Admin utama mengundang Pengurus DKM berdasarkan email yang diinput. Pengurus harus memverifikasi email sendiri lalu menerima undangan. Admin tambahan memperoleh izin input pada tenant tersebut. Admin utama dapat mencabutnya. Undangan tidak dikirim sebagai email otomatis; tersedia tautan untuk dibagikan.
- Laporan publik tidak memberikan akses tabel atau formulir. DB menyeleksi kolom, menghilangkan kontak pribadi, alamat rumah, tanggal lahir, catatan bebas, dan kebutuhan pribadi. Privasi data lengkap dipertahankan hanya untuk Admin tenant.
- Tenant arsip/ditangguhkan tidak memberikan laporan publik atau izin input.
- Foto DKM tetap JPG/PNG/WebP maksimum 2 MB, divalidasi tipe dan signature. Pemilihan file aktif. Penyimpanan Drive memerlukan deployment Apps Script dan kunci privat server Cloudflare; jangan memasukkan kunci ke repo atau browser publik.

Pengujian: tests/public-admin-revision.sql berisi 45 tenant sementara (15 tiap paket) dan 766 pemeriksaan; transaksi ditutup ROLLBACK. Pengujian lama multitenant-database.sql mendokumentasikan model satu Admin sebelum revisi dan tidak lagi menjadi kontrak pembaca.
