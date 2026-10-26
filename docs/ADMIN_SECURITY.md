# Maksimum tiga Admin dan pemulihan akun

Setiap tenant maksimal tiga akun Admin: satu utama dan dua tambahan. Admin utama mengisi Pengurus Masjid beserta email di Profile Masjid, membuka Kelola Admin, memilih Pengurus dan membuat undangan. Pengurus membuat akun dengan email yang sama, memverifikasi email, lalu menerima undangan melalui tautan. Undangan dibagikan sendiri; tidak ada email atau pesan yang dikirim otomatis. Undangan pending mencadangkan tempat. Hanya Admin utama boleh menambah, membatalkan, atau mencabut Admin tambahan.

Batas diterapkan pada RPC undangan/penerimaan dan trigger penetapan Admin. Semua perubahan mengambil lock baris tenant yang sama agar pemeriksaan kursi tidak berlomba. Penetapan Admin utama oleh operator tetap memakai alur yang sudah ada dan tidak menambah jumlah total di atas tiga. Ketentuan email Admin historis tidak dipakai ulang tetap berlaku.

Setting tenant menyediakan Ubah Kata Sandi Aplikasi dan Kelola Admin. Kata sandi aplikasi berbeda dari kata sandi Gmail. Lupa kata sandi menggunakan /forgot-password, bukan mengambil kata sandi lama dari platform.

Admin platform dapat membuka /platform/admin melalui Manajemen Tenant. Daftar memuat email login, nama, tenant, peran, status, waktu penetapan, undangan, dan 200 catatan keamanan terbaru. Daftar Admin dapat diunduh sebagai CSV. Seluruh riwayat tetap tersimpan di AuditLog; antarmuka membatasi tampilan 200 terbaru. Pemantauan diperbarui otomatis 30 detik saat halaman terlihat.

Trigger Auth merekam kejadian perubahan password dan email bagi Admin yang masih terdaftar. Yang disalin ke audit hanya identitas email dan waktu kejadian. Tidak ada kata sandi, hash password, token, OTP atau tautan reset di audit/CSV. Trigger tidak merekam ulang saat hash tetap sama, dan tidak mencatat akun non-Admin. Catatan kredensial dimulai sejak penerapan fitur ini; tidak ada rekonstruksi rahasia lama. Data keamanan hanya untuk operator terverifikasi, tidak untuk Admin tenant atau publik.

Migrasi: supabase/admin-security.sql. Uji tests/admin-security.sql memakai akun dan hash sintetis di dalam transaksi ROLLBACK, tanpa aktivasi operator palsu dan tanpa mengubah akun nyata. Pemeriksaan mencakup kursi pending, batas penerimaan, guard penetapan langsung, pembatasan lintas tenant, pencabutan/penggantian, audit tanpa hash, dan akses operator. Perubahan password nyata atau email reset tidak dilakukan dalam pengujian.
