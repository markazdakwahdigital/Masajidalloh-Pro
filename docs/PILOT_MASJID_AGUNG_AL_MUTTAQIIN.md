# Pilot pertama — Masjid Agung Al Muttaqiin

**Ditunjuk oleh pemilik proyek pada 21 Oktober 2026.**

## Identitas yang dikonfirmasi
- Nama resmi untuk tampilan: **Masjid Agung Al Muttaqiin**
- Kandidat slug teknis: `masjid-agung-al-muttaqiin` (belum didaftarkan, perlu konfirmasi tidak bentrok)
- Status: **Calon pilot** — belum diaktifkan di database
- Lokasi, alamat, kontak, logo masjid, dan penanggung jawab: **belum dikonfirmasi**. Jangan menebak atau menyalin informasi masjid lain yang namanya mirip.

## Kondisi backend saat penetapan pilot
- Supabase project `vsbvyhghggvzoanozvvw` (PostgreSQL) aktif.
- Kueri baca terakhir memastikan `public."Mosque"`, `public."User"`, dan `auth.users` masing-masing berisi 0 data.
- **Jangan** menambahkan akun auth pengguna secara fiktif, atau mengaktifkan status masjid tanpa verifikasi pengurus.

## Langkah aktivasi yang aman
1. Minta email administrator/pengurus resmi yang akan menjadi Ketua Takmir pilot; jangan meminta password atau OTP.
2. Buat/invite akun lewat Supabase Authentication > Users dan selesaikan verifikasi email.
3. Setelah identitas terverifikasi, jalankan `scripts/bootstrap-first-mosque.sql` dari komputer admin yang aman menggunakan nama masjid persis dan kandidat slug di atas; script gagal tanpa syarat yang benar.
4. Verifikasi keanggotaan dan peran `ketua_takmir`, login, serta isolasi data dengan masjid kedua di staging.
5. Jangan masukkan data keuangan/jamaah riil sampai backup, audit, kontrol akses, deployment, dan pengujian end-to-end selesai.

## Arah pilot yang diprioritaskan
- Dashboard pengurus dengan profil dan agenda kegiatan
- Pencatatan kegiatan draft, terbit, dan dibatalkan
- Pengembangan lanjut: jamaah, ZISWAF, keuangan, dakwah, dan laporan transparansi

**Biaya pengembangan:** target Rp0 melalui layanan gratis sesuai batas dan ketentuan masing-masing.
