# Kontak pendaftaran Masjid

Email Masjid adalah kolom wajib yang dimulai kosong, dapat diedit pendaftar, dan tidak diambil otomatis dari akun login. WhatsApp Masjid ditambahkan tepat setelah WhatsApp Pengurus. Keduanya mempunyai validasi sisi server dan database.

`TenantApplication.email` tetap identitas akun terverifikasi yang mengajukan permohonan. Kolom baru `mosqueEmail` dan `mosqueWhatsapp` berisi kontak Masjid; `whatsapp` tetap nomor Pengurus. Mengisi email kontak milik akun lain tidak memberikan kepemilikan, hak Admin, atau akses status permohonan kepada akun itu. Batas pengajuan dan larangan pendaftaran Admin yang sudah terdaftar tetap berbasis akun terverifikasi.

Ketika operator menyetujui permohonan, Profile Masjid memakai email dan WhatsApp Masjid yang diinput. Permohonan lama yang belum mempunyai kedua kolom baru memakai kontak lama sebagai cadangan. Tidak ada data kontak tenant lama yang diubah massal. Operator dapat melihat nomor Pengurus dan Masjid secara terpisah saat meninjau.

Terapkan `supabase/tenant-registration-contacts.sql` setelah migrasi pendaftaran sebelumnya. Hak akses langsung tabel tidak dibuka. Helper pembuatan Profile Masjid tetap berada di schema privat.

Validasi: unit test kontak kosong/tidak valid serta pemisahan identitas; 14 pemeriksaan database dengan fixture di transaksi ROLLBACK, termasuk status permohonan, pembatasan akun, penolakan aktivasi oleh akun biasa, pemetaan kontak Profile, dan kompatibilitas data lama. Pengujian tidak mengaktifkan tenant nyata dan tidak meniru identitas operator.
