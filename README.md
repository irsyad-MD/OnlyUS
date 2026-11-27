# OnlyUS — aplikasi pasangan privat

React Native + Expo Router + TypeScript + Supabase. Tidak menggunakan akun, lokasi, kenangan, atau penghitung dummy.

## Fitur yang diimplementasikan

- Autentikasi email, pemulihan kode, restorasi sesi aman, nama serta foto profil dari galeri/kamera.
- Couple Space dua anggota, kode undangan, tanggal bersama, disconnect dengan konfirmasi. Semua akses bersama bergantung RLS dan RPC server.
- Tema preset/custom berubah tanpa restart dan tersimpan per pengguna.
- Love Me: RPC idempoten, counter terkonfirmasi server, riwayat 50 terbaru, animasi, antrean UUID tersimpan lokal saat gagal jaringan. Retry tidak menambahkan Love yang sama dua kali. Rate limit server tetap berlaku.
- OurDays: upload Storage privat, EXIF dari gambar asli (termasuk pembacaan bytes via exifr), tanggal file jika tersedia, input manual bila tidak tersedia, preview, judul/deskripsi, edit/hapus milik sendiri, favorit, reaksi hati, anniversary, pencarian, bulan/tahun dan kalender.
- I Love U: upload/riwayat/favorit artwork privat, desain kartu classic/polaroid/minimal, penerimaan oleh pasangan, dan Activate lokal pada sesi video nyata. Foto, judul, dan deskripsi dimasukkan ke metadata media expo-video.
- Maps: GPS foreground opt-in, berbagi baterai/riwayat opsional, lokasi/nama/foto pasangan, kontrol fokus/zoom, marker terakhir bertanda Mode Penyamaran, akurasi maksimal 100 m, timer dari session_started_at server. Aplikasi ditutup/restart tidak mereset timestamp sesi.
- Our Widget: canvas SVG, warna preset/custom HEX, ukuran pen, brush, eraser, undo/redo, clear dengan konfirmasi, draft lokal, preview PNG, simpan ke galeri native, send privat dan tanda diterima. Payload goresan dibatasi dan divalidasi.
- Notifikasi dalam aplikasi, preferensi per kategori, pendaftaran token Expo, worker outbox untuk pengiriman push.
- Provider bersama memastikan CRUD tampil lintas halaman. Realtime digabung dengan rekonsiliasi 30 detik, dan akun/Couple Space diperiksa setiap 15 detik serta saat kembali aktif.

Daftar foto menampilkan 200 terbaru per jenis, gambar 100 terbaru, riwayat Love/lokasi 50 terbaru dan notifikasi 100 terbaru. Pencarian/kalender menggunakan data yang sudah dimuat, bukan pencarian arsip tanpa batas. Pagination arsip masih dapat dikembangkan.

## Status backend dan migration koreksi

Schema tahap 1 dan 2 telah disetujui melalui OnSpace. Migration `supabase/migrations/202611270001_onlyus_media_validation.sql` perlu diterapkan melalui dialog SQL untuk memperbaiki trigger generik: tabel artwork/gambar tidak memiliki field captured_at. Migration juga memvalidasi bentuk stroke pada server, memeriksa tanggal saat edit, memberi notifikasi perubahan artwork/kenangan/koneksi, dan menyediakan konfigurasi lokasi untuk akun baru.

Tidak menjalankan SQL dari aplikasi. Migration koreksi tidak menghapus akun atau media. Seluruh tabel dan bucket tetap privat dengan RLS. Akun pengujian menggunakan konfigurasi onlyus_location_config, bukan kredensial/email hardcoded pada aplikasi. Administrator backend dapat mengubah konfigurasi baris akun terkait; password hanya dikelola Supabase Auth.

## Batas native yang penting

### Artwork lock screen

Activate memerlukan video milik pengguna yang dipilih dari galeri. Video benar-benar diputar oleh expo-video, bukan audio diam atau sesi media palsu. Metadata foto diteruskan ke Now Playing/media notification; desain kartu tidak memaksa desain UI milik OS.

- Plugin expo-video mengaktifkan background playback pada build baru.
- Browser hanya memutar video dalam aplikasi, tidak memverifikasi Android MediaSession/iOS lock screen.
- Sesi dapat dijeda/dihentikan dengan tombol nyata. Video tidak di-loop diam-diam dan tidak otomatis diputar setelah restart.
- OS menentukan ukuran/foto/visibilitas artwork; tidak mengganti wallpaper dan tidak menjanjikan tampil permanen.
- Implementasi memakai modul native yang disediakan expo-video, bukan Kotlin/Swift khusus. Tidak ada implementasi Live Activities pada versi ini.

### Widget Android

Plugin react-native-android-widget mendefinisikan OnlyusSmall (2×2) dan OnlyusMedium (3×3). Widget dirender dari stroke tersanitasi; token tetap diperoleh dari sesi aman milik aplikasi, tidak ditaruh di widget/URL publik.

Build hasil ekspor membutuhkan entry point headless:
1. Pada source hasil Download, ubah `package.json` field `main` menjadi `widget-entry.ts`.
2. Workspace tidak mengubah package.json karena file ini dikelola platform. Registrasi saat aplikasi aktif sudah disediakan; cold-start headless belum dianggap berfungsi tanpa langkah entry point ini.
3. Build development/APK baru. Tekan lama layar utama → Widget → OnlyUS → pilih ukuran.
4. Gambar disinkronkan saat aplikasi aktif. Refresh background meminta jadwal OS 30 menit; OS boleh menunda atau tidak menjalankan setelah force-stop.
5. Handler mengambil data melalui RLS pada setiap pembaruan; bila tidak ada sesi/koneksi/jaringan, tampilkan instruksi, bukan berpura-pura konten masih realtime.

### Widget iOS

WidgetKit belum tersedia pada build workspace ini. Untuk versi iOS lengkap, source hasil ekspor memerlukan WidgetKit extension, App Group, penyimpanan gambar bersama, TimelineProvider, provisioning, dan WidgetCenter reload. Tidak ada file Swift atau klaim widget iOS sudah terpasang. Gambar tetap dapat dikirim dan diterima di aplikasi iOS.

### Lokasi

Pelacakan berjalan hanya saat aplikasi aktif dengan izin foreground. Tidak ada background tracking. Ketika background/ditutup, GPS baru tidak dikirim; indikator lebih dari 60 detik menggunakan lokasi terakhir, bukan status online/GPS terkini. Mode Penyamaran membekukan koordinat di server dan menampilkan status eksplisit. Timer adalah proyeksi timestamp server dengan offset server_now, bukan counter yang disimpan frontend.

Web memakai react-leaflet + OpenStreetMap. Native iOS memakai Apple Maps melalui react-native-maps. Native Android memerlukan Google Maps SDK key sebelum build:
- Tambahkan environment EAS `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` (Maps SDK for Android aktif).
- Batasi key di Google Cloud ke package Android, fingerprint SHA dan API Maps SDK. Ini key SDK publik-terbatas, bukan secret server.
- app.config.ts meneruskan key ke android.config.googleMaps.apiKey. Jangan memasukkan service role Supabase sebagai key.
- Bila key tidak tersedia, panel lokasi tetap berfungsi dan peta menampilkan petunjuk konfigurasi; tidak menampilkan koordinat dummy.

## Konfigurasi Supabase dan autentikasi

Koneksi OnSpace menyediakan EXPO_PUBLIC_SUPABASE_URL dan EXPO_PUBLIC_SUPABASE_ANON_KEY. Pertahankan variabel ini dan pastikan tersedia dalam environment EAS. Aplikasi tidak memiliki service role key di frontend.

Aktifkan Email Auth. Jika signup membutuhkan verifikasi, pengguna harus mengonfirmasi email. Template Supabase Reset Password harus menyertakan `{{ .Token }}` untuk pemulihan kode. Tidak ada login Google/Apple pada versi ini.

Sesi native memakai expo-secure-store dengan chunk untuk token panjang; web memakai localStorage. Draft canvas dan UUID pending Love menggunakan AsyncStorage, terpisah per pengguna dan Couple Space. Data pasangan tidak otomatis dipindahkan ke ruang baru.

URL foto privat ditandatangani untuk 120 detik, diperbarui berkala. Logout/disconnect membersihkan cache aplikasi dan akses baru dicabut server. URL yang sudah diterbitkan/copy lokal dapat tetap ada hingga kedaluwarsa; tidak menjanjikan pencabutan seketika dari perangkat penerima. Foto yang sudah diunduh/disimpan pengguna tidak bisa dihapus dari perangkat lain. Objek Storage yang tidak lagi direferensikan perlu pembersihan administratif berkala.

## Push notification

`supabase/functions/onlyus-notification-worker/index.ts` menggunakan secret backend bawaan SUPABASE_URL/ANON_KEY/SERVICE_ROLE_KEY. Tidak memerlukan API key provider lain.

1. Deploy melalui OnSpace atau `supabase functions deploy onlyus-notification-worker` dari source ekspor.
2. Siapkan project EAS nyata: `npx eas-cli build:configure`. projectId tidak dibuat fiktif dalam source.
3. Konfigurasikan FCM/APNs dengan EAS credentials, build ulang aplikasi pada perangkat nyata, lalu aktifkan notifikasi dari halaman Notifikasi.
4. Jadwalkan HTTP POST ke Edge Function melalui Supabase Cron dashboard setiap menit. Kredensial scheduler memakai service role backend dari Vault/konfigurasi aman, bukan source atau header frontend publik.
5. Tombol kirim ulang hanya memproses job milik pengguna yang login. Endpoint scheduler memproses seluruh outbox, memeriksa kembali keanggotaan aktif/preferensi/token, menggunakan klaim atomik, retry hingga lima kali, dan menghapus token DeviceNotRegistered.
6. Outbox tidak otomatis berjalan sebelum scheduler dikonfigurasi. Riwayat notifikasi tetap realtime dalam aplikasi.

Job yang ditandai sent berarti diterima API Expo, bukan bukti perangkat menerima. Receipt tracking dan retry pengiriman push tidak menjamin exactly-once. Love tetap exactly-once berdasarkan UUID di database, terlepas dari push.

## Menjalankan / build

1. Download source; `npm install`, lalu `npx expo start`.
2. Paket yang diimpor: expo-router, expo-image, expo-image-picker, expo-media-library, expo-image-manipulator, expo-file-system, expo-crypto, expo-location, expo-battery, expo-video, expo-notifications, expo-secure-store, expo-constants, expo-sharing, react-native-svg, react-native-maps, react-native-android-widget, react-leaflet, leaflet, exifr, base64-arraybuffer, @react-native-async-storage/async-storage, @supabase/supabase-js, react-native-url-polyfill, react-native-safe-area-context dan @expo/vector-icons. Gunakan versi sesuai Expo SDK melalui npx expo install untuk paket Expo/native.
3. Tetapkan android.package/ios.bundleIdentifier unik, environment EAS dan project EAS milikmu. Untuk widget background, ubah main seperti petunjuk di atas.
4. APK: `npx eas-cli build --platform android --profile preview`.
5. Dev client: `npx eas-cli build --profile development --platform android`.
6. iOS: `npx eas-cli build --platform ios --profile production`; memerlukan Apple Developer/provisioning.
7. Android produksi: `npx eas-cli build --platform android --profile production`.
8. Jalankan TypeScript/lint dan uji build setelah konfigurasi; sesi editor ini tidak menjalankan compiler, EAS build atau uji dua perangkat.

## Checklist uji dua akun/perangkat

- A/B signup dan login; A membuat ruang, B memasukkan kode. Akun C ditolak dan satu akun tidak dapat bergabung ke dua ruang.
- Foto profil dari galeri/kamera muncul pada akun sendiri dan pasangan, tidak pada C; penghapusan dan pergantian foto jelas.
- A menekan Love lima kali: total server bertambah tepat lima, B melihat pembaruan. Putus jaringan saat kirim, retry/restart dan pastikan UUID yang sama tidak dihitung ulang.
- OurDays: uji foto EXIF, metadata kosong, manual date, foto kamera, tanggal tidak valid, edit/hapus pemilik, bookmark, reaksi B, pencarian dan kalender.
- Maps: izin ditolak/diterima, GPS buruk, perpindahan nyata vs jitter, live/stealth/off, waktu GPS terakhir, baterai dan riwayat tanpa izin. Tutup/restart perangkat: timer memakai sesi server, bukan mulai ulang; tidak ada koordinat baru ketika stealth.
- Artwork: pilih video asli dan foto, Activate; uji lock screen di Android/iOS build baru, pause/stop, akhir video, panggilan telepon, background, perubahan foto, menerima artwork dari pasangan. Browser bukan bukti MediaSession.
- Canvas: ukuran/warna/eraser/undo/redo/clear, draft setelah restart, preview PNG, simpan ke galeri, kirim/terima pada kedua akun. Widget Android: pemasangan kecil/sedang, refresh aktif/background, cold start dengan entry khusus, jaringan terputus, disconnect.
- Notifikasi: izin, token, preferensi kategori, worker/scheduler, token invalid, logout perangkat. Jangan menggunakan service role untuk pengujian RLS pengguna.
- Disconnect: kedua akun kehilangan akses baru ke semua data ruang; rekonsiliasi mendeteksi paling lambat sekitar 15 detik saat online. Lokasi server dihapus, sesi media dihentikan lokal, widget dikosongkan pada pembaruan berikutnya. Pastikan ruang baru tidak memakai data pasangan sebelumnya.

## Pengembangan tersisa

WidgetKit iOS/Live Activities, pelacakan lokasi background opsional dengan consent tambahan, pagination/search arsip lebih dari batas daftar, push receipt tracking, pembersihan objek Storage, dan verifikasi perangkat/EAS masih memerlukan pekerjaan lanjutan. Fitur inti dalam aplikasi tidak memakai simulasi untuk menggantikan pekerjaan ini.
