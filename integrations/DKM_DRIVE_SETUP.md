# Aktivasi foto DKM di Google Drive

Tujuan: folder **Foto DKM Masjidalloh** milik **markazdakwahdigital.01@gmail.com**. Foto tetap privat, disusun per ID Masjid. Tidak ada pemberian akses publik atau pengiriman kredensial Google ke browser aplikasi.

1. Masuk Google Apps Script menggunakan akun tersebut, buat proyek “Foto DKM Masjidalloh”, dan salin `integrations/dkm-drive.gs` ke Code.gs.
2. Jalankan `setupDkmDrive`. Pemilik akun perlu meninjau dan memberikan izin Drive. Fungsi membuat folder bila belum ada dan kunci acak di Script Properties.
3. Deploy sebagai Web app: Execute as **Me**, akses **Anyone**. Endpoint hanya menerima permintaan bertanda tangan HMAC dari server aplikasi. Jangan membagikan signing key.
4. Masukkan URL deployment `/exec` ke Cloudflare Build secret `DKM_DRIVE_WEB_APP_URL`. Salin Script Property `DKM_DRIVE_SIGNING_KEY` ke secret Build dengan nama sama. Simpan sebagai secret, bukan NEXT_PUBLIC. Jalankan build ulang; skrip deployment meneruskannya sebagai secret runtime.
5. Masuk sebagai Admin Masjid, buka Profile Masjid, isi biodata Pengurus DKM dan pilih JPG/PNG/WebP maksimum 2 MiB (2.097.152 byte). Simpan lalu periksa file di folder Drive dan tautan pada daftar DKM.

Koneksi Google Drive di ChatGPT tidak memberikan kredensial runtime kepada aplikasi. Aktivasi ini terpisah. Biodata juga memerlukan DATABASE_URL aplikasi yang valid. Pratinjau `/enterprise` hanya menyimpan data dan foto di memori halaman, tidak mengunggah ke Drive.

Jika foto gagal diunggah setelah biodata tersimpan, biodata tetap disimpan dan hasilnya menjelaskan bahwa foto gagal; tidak ada klaim upload berhasil. Menyimpan ulang merupakan penambahan biodata baru; jangan mengirim formulir berulang sebelum memeriksa daftar.
