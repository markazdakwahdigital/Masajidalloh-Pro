# Zona waktu dan lokasi jadwal sholat

Jam/tanggal bilah atas memakai zona waktu IANA perangkat secara otomatis melalui Intl. Bila koordinat sudah dipakai untuk jadwal, zona waktu yang dikembalikan AlAdhan menjadi acuan lokasi pengguna. Pilihan kota manual menentukan zona jadwal kota tersebut, tanpa mengganti jam pengguna secara paksa.

Untuk izin geolokasi berstatus granted, koordinat dideteksi otomatis saat aplikasi dibuka; lokasi diperbarui saat kembali ke halaman setelah lima menit. Jika izin belum diberikan, pengunjung memilih Gunakan lokasi saya. Kontrol menjelaskan bahwa lokasi dipakai menghitung jadwal melalui AlAdhan. Permintaan menggunakan high accuracy dengan batas 12 detik dan maksimum usia koordinat satu menit. Koordinat tidak disimpan di database atau localStorage, hanya dibulatkan empat desimal dan dipakai selama sesi halaman. Preferensi kota boleh tersimpan lokal.

Toolbar dan kartu Jadwal Sholat memakai satu provider bersama. Kota cadangan dari pilihan pengunjung atau pengaturan Masjid tetap tersedia jika izin ditolak, perangkat tidak mendukung lokasi, atau deteksi gagal. Zona waktu saja tidak dianggap cukup untuk menentukan jam sholat. Jadwal tidak diisi angka simulasi ketika layanan gagal.

API memvalidasi rentang koordinat, membatasi penyedia ke endpoint HTTPS AlAdhan yang tetap, menggunakan metode Kemenag (20), dan mengambil zona waktu dari metadata penyedia. Bila tanggal lokal penyedia berbeda dari tanggal zona perangkat, permintaan diperbaiki untuk hari lokal yang sesuai. Respons koordinat tidak diberi cache publik. Nama waktu dan format jam diperiksa sebelum ditampilkan.

Batas hari laporan keuangan tetap memakai zona waktu Masjid; preferensi lokasi pengunjung tidak mengubah data atau perhitungan laporan tenant.

Keterangan paket/sumber ringkasan di Dashboard Utama dan kalimat akses membaca di laporan menu dihapus.

Validasi: typecheck/ESLint/Cloudflare build; unit test koordinat nol/invalid, WIB-WITA-WIT saat pergantian hari, zona perangkat yang salah, metadata penyedia, kegagalan layanan, serta kota manual. Koordinat pengujian adalah koordinat pusat kota publik, bukan lokasi perangkat pengguna.
