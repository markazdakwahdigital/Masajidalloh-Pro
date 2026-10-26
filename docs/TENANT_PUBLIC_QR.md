# QR Code aplikasi tenant

Dashboard Utama setiap tenant aktif menampilkan QR Code yang dihasilkan di server, tanpa layanan QR pihak ketiga. Payload adalah URL HTTPS kanonis `/dashboard/masjid/<UUID>` yang dapat dibuka publik, tanpa token akun, sesi, hash menu, ataupun parameter login. Margin putih empat modul dipertahankan dan gambar hitam-putih PNG dibuat dengan koreksi kesalahan M.

Pengunjung dapat mengunduh PNG atau menggunakan Bagikan QR Code. Perangkat yang mendukung berbagi file menggunakan gambar PNG; perangkat lain membagikan URL dashboard. Bila API berbagi tidak tersedia, tautan disalin, dan gambar tetap dapat diunduh. Tidak ada pesan yang dikirim otomatis.

Endpoint QR dan manifest memeriksa direktori publik tenant aktif/nonarsip melalui RPC yang sudah tersedia; tenant tidak tersedia memberikan 404. Perubahan hak akses database tidak diperlukan. Respons publik boleh disimpan browser selama 60 detik.

Manifest tiap tenant mempunyai `id`, `name`, `start_url`, dan `scope` sendiri. Pemindaian membuka dashboard; pemasangan tetap memerlukan tindakan pengunjung melalui pilihan perangkat/browser. Panduan Safari iOS dan Chrome/Edge tersedia di kartu QR. Ikon bawaan tetap dipakai oleh manifest pemasangan. Service worker yang sudah ada hanya menyimpan halaman offline, bukan data tenant.

Validasi: typecheck, ESLint, Cloudflare build/output; pengujian QR PNG dibaca oleh decoder independen jsQR untuk dua UUID dan pemeriksaan identitas aplikasi; verifikasi PNG/manifest pada produksi tanpa cookie dan tampilan browser. Pengujian tidak memasang aplikasi pada perangkat pengguna dan tidak mengirim pesan berbagi.
