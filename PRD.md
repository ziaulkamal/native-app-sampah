# PRD: Aplikasi Persampahan & Retribusi — React Native Mobile App

Dokumen hidup. Keluaran **Tahap 7** master prompt migrasi (`../api-app-sampah/master-prompt-migrasi-react-native.md`).
Berisi seluruh temuan Tahap 1–6. Keputusan baru di tengah pengembangan ditambahkan ke sini,
bukan disimpan di kepala.

|                |                                                                 |
| -------------- | --------------------------------------------------------------- |
| Versi          | 0.1 — 31 Juli 2026                                              |
| Repo           | `D:\Projects\native-app-sampah`                                 |
| FE web acuan   | `D:\Projects\design-app-sampah` (**tidak disentuh**)            |
| Backend        | `D:\Projects\api-app-sampah` (Laravel 13.8 + Octane/RoadRunner) |
| Platform rilis | Android saja                                                    |

---

## 1. Ringkasan Eksekutif

Aplikasi ini adalah versi Android dari layanan persampahan dan retribusi Kabupaten Aceh
Barat Daya yang selama ini dipakai lewat peramban. Dua orang yang memakainya setiap hari
dilayani di sini: **pelanggan**, yang ingin melihat tagihan, membayar, mengajukan titik
layanan, dan mengadu bila sampahnya tak terangkut; dan **operator lapangan**, yang menagih
dari rumah ke rumah, mencatat setoran, dan mengikuti rute hariannya. Keduanya bekerja
sambil berdiri di jalan dengan satu tangan memegang ponsel — bukan di depan meja.

Yang dikerjakan aplikasi ini dan tidak bisa dikerjakan versi web: memotret KTP dan membaca
NIK-nya langsung di ponsel saat mendaftar, membuka peta yang responsif dengan jari, dan
tetap bisa dibuka dari layar utama tanpa mengetik alamat. Konsol Admin Dinas dan Super
Admin **tetap di web** — pekerjaannya berupa tabel lebar dan pengaturan, yang tak menjadi
lebih baik di layar 6 inci.

Tampilannya sengaja tidak dirancang ulang. Warna, jarak, huruf, dan bentuk komponennya
diambil dari FE web yang sudah berjalan, supaya orang yang berpindah dari web ke ponsel
tidak merasa sedang belajar aplikasi baru.

## 2. Latar Belakang & Tujuan

### Konteks

FE web (`design-app-sampah`) sudah berjalan penuh: 5 role, ±40 layar, dan kontrak API yang
stabil dengan backend Laravel Octane. Aplikasi ini bukan penggantinya, melainkan **klien
kedua** untuk backend yang sama. Tidak ada endpoint yang dibuat khusus untuk mobile
(lihat §6.4 — temuan T1).

### Tujuan

1. **Konsistensi visual dan perilaku dengan web.** Token warna/radius/tipografi berasal dari
   satu sumber, dan penyimpangannya bisa dideteksi otomatis (`pnpm check:drift`), bukan
   dinilai dengan mata.
2. **Nama dan bentuk props komponen dipertahankan** semirip mungkin, supaya orang yang
   pernah membaca kode web mengenali kode ini tanpa penerjemahan.
3. **Kemampuan native yang benar-benar dipakai**, bukan yang sekadar bisa: OCR KTP untuk
   mengisi NIK dan biodata (keputusan pengguna, §3).
4. **Backend tidak berubah.** Migrasi ini tidak boleh menuntut perubahan skema, endpoint,
   atau format respons.

### Batasan yang mengikat sejak awal

- FE web tidak boleh diubah atau dihapus. Proyek ini folder terpisah (bukan monorepo).
- Setiap keputusan arsitektur signifikan disertai alasan singkat — itu sebabnya dokumen ini
  dan `docs/MAPPING.md` menyebut "kenapa", bukan hanya "apa".

## 3. Lingkup (Scope)

### In scope — rilis pertama

| Modul       | Isi                                                                                                                                                                  |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Autentikasi | Masuk pelanggan (identitas + OTP WA/email), masuk petugas (email + sandi), daftar mandiri pelanggan + unggah KTP, pulihkan sesi dari token tersimpan, keluar.        |
| Pelanggan   | Beranda, Tagihan + sheet pembayaran, Riwayat pembayaran, Jadwal sepekan, Aduan, Tambah/ubah titik layanan (peta), pemilih titik aktif.                               |
| Operator    | Beranda, Rute (peta sebaran), Penagihan per pelanggan, Verifikasi pembayaran, Setor kas + pengajuan tunai.                                                           |
| Bersama     | Profil, biodata & identitas akun, ganti sandi, foto profil (ambil/pilih/hapus), mode gelap, notifikasi (lonceng + sheet + tandai/bersihkan), pratinjau KTP terkunci. |
| Native      | **OCR KTP on-device** → mengisi NIK, nama, jenis kelamin di formulir pendaftaran.                                                                                    |
| Peta        | MapLibre + ubin OSM: pemilih titik, sebaran titik, pencarian tempat, legenda golongan, layar penuh.                                                                  |

### Out of scope — sengaja ditunda, dengan alasan

| Yang tidak dibangun                                                                         | Alasan                                                                                                                                        |
| ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Konsol **Admin Dinas** & **Super Admin** (seluruh `features/admin` + `features/superadmin`) | Keputusan pengguna. Pekerjaannya tabel lebar, pengaturan, dan laporan — tetap di web.                                                         |
| **Pindai QR**                                                                               | Keputusan pengguna: fitur native dibatasi pada OCR KTP saja. Kamera dan izinnya sudah ada bila kelak dibuka.                                  |
| **Klasifikasi sampah dengan AI**                                                            | Idem. Master prompt menyebut "modul AI" dan memerintahkan bertanya dulu; jawabannya: tidak ada modul AI di rilis ini.                         |
| **OCR struk/kuitansi**                                                                      | Idem.                                                                                                                                         |
| **Ekspor rekap CSV** (`downloadRecap`)                                                      | Butuh DOM `download()` dan hanya dipakai role admin — fungsinya dilepas dari `api/reports.ts`.                                                |
| **Unggah aset branding** (`uploadBrandingAsset`)                                            | Hanya Super Admin. Dilepas dari `api/branding.ts`.                                                                                            |
| **iOS**                                                                                     | Tidak diminta. `app.json` menyetel `platforms: ["android"]` agar tak ada yang mengira dukungannya ada tapi rusak.                             |
| **Mode offline penuh** (antrean tulis, basis data lokal)                                    | Tak ada padanannya di web dan menuntut resolusi konflik. Yang ada: pull-to-refresh, `DataBanner`, dan galat jaringan yang jelas. Lihat §11.3. |
| **Notifikasi push (FCM)**                                                                   | Backend belum punya kanal push; lonceng memakai denyut data `GET /sync/pulse` yang sama dengan web. Lihat §11.4.                              |

## 4. Kebutuhan Fungsional

Nomor **KF** dipakai sebagai rujukan di milestone (§8) dan metrik (§10).

### 4.1 Autentikasi & sesi

- **KF-1** Pelanggan masuk dengan nomor telepon/email → memilih kanal OTP (WA atau email) →
  memasukkan 6 digit. Kotak OTP memakai `autoComplete="sms-otp"` supaya Android bisa mengisinya
  sendiri.
- **KF-2** Petugas (operator) masuk dengan email + sandi. Akun ber-role admin/superadmin
  **ditolak di layar masuk** dengan pesan yang menyebut konsolnya ada di web — bukan dibiarkan
  masuk lalu menemukan aplikasi kosong.
- **KF-3** Token bearer disimpan di `expo-secure-store` (Keystore Android), bukan
  AsyncStorage. Cache di memori supaya perakitan header tetap sinkron.
- **KF-4** Saat aplikasi dibuka, token dipulihkan lalu diverifikasi dengan `GET /me`. Selama
  itu tampil layar tunggu, bukan layar masuk yang berkedip.
- **KF-5** Sesi kedaluwarsa (401) memicu keluar otomatis + pesan sekali, lewat
  `setSessionExpiredHandler` yang sama dengan web.
- **KF-6** Daftar mandiri pelanggan: nama, NIK, jenis kelamin, telepon, email, sandi, dan
  **foto KTP**. Foto berasal dari kamera atau galeri, dikecilkan di klien sebelum dikirim (§6.4).

### 4.2 OCR KTP (native)

- **KF-7** Dari formulir pendaftaran, pengguna membuka pemindai, menaruh KTP di dalam bingkai
  berrasio 1,585 (85,6 × 54 mm), lalu menekan **Pindai**.
- **KF-8** Pengenalan teks berjalan **on-device** (ML Kit). Tak ada gambar yang dikirim ke mana pun.
- **KF-9** Hasilnya mengisi NIK, nama, dan jenis kelamin di formulir — **selalu bisa dikoreksi**
  sebelum dikirim. Tak ada yang tersimpan otomatis.
- **KF-10** Bila NIK tak terbaca, pemindaian **dibatalkan dengan pesan**, bukan mengisi
  sebagian. Isian separuh lebih menyesatkan daripada kosong.
- **KF-11** Penyaringan bentuk NIK: kode provinsi 11–94, tanggal lahir masuk akal (hari −40
  untuk perempuan, bulan 1–12) — supaya nomor KK yang juga 16 digit tak lolos sebagai NIK.
- **KF-12** Hasil pindai **tidak** lewat parameter navigasi (yang bisa diserialkan dan
  dipulihkan setelah aplikasi dimatikan sistem), melainkan variabel modul sekali-pakai.

### 4.3 Peta

- **KF-13** Pemilih titik: peta dengan pin yang bisa **digeser**; **tekan-tahan** untuk
  memindahkannya (bukan tap — di ponsel tap terlalu mudah terpicu di akhir gerakan menggeser).
- **KF-14** Tanpa `onChange`, peta jadi pratinjau: pin terkunci, kotak cari hilang.
- **KF-15** Memilih kecamatan/desa di formulir menggeser peta ke area itu (`fitBounds` lalu
  diperdalam ke zoom minimum: kecamatan 14, desa 16).
- **KF-16** Pencarian tempat di dalam peta (Nominatim, dibatasi Indonesia, debounce 500 ms,
  gagal-diam). Di pemilih titik, memilih hasil sekaligus memindahkan pin.
- **KF-17** Peta sebaran (operator): satu pin per titik pelanggan, berwarna menurut golongan
  tarif; menyentuh pin membuka kartu keterangan di bawah peta.
- **KF-18** Legenda golongan diturunkan dari data tarif, bukan daftar tetap.
- **KF-19** Layar penuh untuk kedua peta, keluar dengan tombol Back.
- **KF-20** Izin lokasi **tidak** diminta sama sekali: peta hanya menampilkan dan menerima titik
  yang ditaruh manual, sama seperti web. Tombol "pakai lokasi saya" adalah fitur baru di luar
  keputusan lingkup fitur native (OCR KTP saja) — lihat §11. Karena itu `android.permissions` di
  `app.json` hanya berisi `CAMERA` dan `INTERNET`; alasan ini dicatat di sini sebab skema Expo
  SDK 57 menolak kunci komentar `"//"` di dalam blok `android`.

### 4.4 Tagihan, pembayaran, penagihan

- **KF-20** Pelanggan melihat tagihan per titik layanan beserta status dan denda.
- **KF-21** Sheet pembayaran menampilkan rekening bank daerah dan mencatat pembayaran.
- **KF-22** Riwayat pembayaran dengan penomoran halaman (`3/14` + maju/mundur, bukan deretan
  nomor — lihat §6.3).
- **KF-23** Operator menagih per pelanggan, melihat kas di tangan, dan mengajukan setoran.
- **KF-24** Operator memverifikasi pembayaran yang menunggu (terima/tolak dengan alasan).

### 4.5 Titik layanan & aduan

- **KF-25** Pelanggan mengajukan titik baru: alamat, wilayah, jenis, **usulan golongan**
  (tanpa tarif — tarif ditetapkan admin), dan koordinat dari peta.
- **KF-26** Titik yang ditolak admin memunculkan notifikasi ke pelanggan.
- **KF-27** Aduan dibuat pelanggan dan terbit ke lonceng dinas.

### 4.6 Notifikasi

- **KF-28** Lonceng di header menampilkan jumlah belum dibaca; sheet menampilkan 8 pertama
  lalu 5 per muat berikutnya (sama dengan web).
- **KF-29** Menyentuh notifikasi membuka layar tujuannya (`notificationTarget` → tab + layar).
- **KF-30** Tandai semua terbaca, hapus satu, dan kosongkan kotak per akun.
- **KF-31** Denyut data `GET /sync/pulse` menyegarkan data yang terlihat tanpa muat ulang —
  **berhenti saat aplikasi di latar** (`AppState`), padanan `document.hidden` di web.

### 4.7 Profil & akun

- **KF-32** Lihat/ubah biodata & identitas, ganti sandi, mode gelap yang bertahan.
- **KF-33** Foto profil: ambil dari kamera, pilih dari galeri, atau **hapus** (semua role).
- **KF-34** Pratinjau KTP **terkunci**: hanya bisa dilihat, tak bisa disimpan. Di native
  jaminannya lebih kuat daripada web — tak ada menu "Save image as".

## 5. Kebutuhan Non-Fungsional

### 5.1 Perangkat & kompatibilitas

- **Android 8.0 (API 26)** ke atas (`minSdkVersion: 26`), target/compile SDK 36.
- Arsitektur Baru (New Architecture) menyala; RN 0.86 + React 19.
- Layar acuan 390 × 844 dp (sama dengan `PhoneFrame` web), tapi tak ada ukuran yang dipaku:
  seluruh tata letak memakai flex dan `useSafeAreaInsets()`.
- **Expo Go tidak didukung** — modul native custom (MapLibre, expo-camera, ML Kit,
  SecureStore-Keystore) hanya ada di Dev Client/build sendiri.

### 5.2 Performa

- **OCR**: satu foto → satu pengenalan, bukan frame processor. Mengenali tiap frame berarti
  membaca puluhan kali per detik untuk kartu yang diam; foto tunggal juga memberi pengguna
  momen jelas untuk menahan kartunya. Target: hasil muncul < 2 detik setelah tombol ditekan
  pada perangkat kelas menengah.
- **Peta**: tiap titik digambar sebagai `ViewAnnotation` (satu View asli per pin) karena
  warnanya datang dari golongan tarif yang bisa ditambah admin kapan saja. Konsekuensinya peta
  ini untuk satu rute/wilayah — bukan ribuan titik sekaligus. Ambang aman yang diasumsikan:
  **≤ 300 pin per layar**; di atas itu perlu klasterisasi (§9.2).
- **Daftar panjang** memakai `FlatList`, bukan `map()` di dalam ScrollView.
- **Denyut data** berhenti saat aplikasi di latar — baterai dan kuota tak habis di saku.

### 5.3 Keamanan

- Token bearer di **Keystore** (`expo-secure-store`), bukan penyimpanan biasa.
- NIK hasil pindai **tak pernah masuk state navigasi** yang bisa dipulihkan sistem (KF-12).
- Foto KTP dan foto profil **dialirkan backend di balik bearer token**, bukan URL bertanda
  tangan. Setiap `<Image>` yang menampilkannya wajib membawa `fileHeaders()`; tanpa itu
  gambarnya kosong dan gagalnya sunyi.
- Tak ada kunci API pihak ketiga di dalam APK. Nominatim dan ubin OSM tak memerlukannya.
- Alamat backend dibekukan saat build (§6.4) — bukan rahasia, tapi berarti satu APK terikat
  satu lingkungan.

### 5.4 Jaringan lemah / luring

- Setiap layar bermuatan data punya tiga keadaan yang terlihat: memuat, galat + "Coba lagi",
  dan kosong. `DataBanner` + **pull-to-refresh**.
- Unggahan gambar dikecilkan ke sisi terpanjang 1600 px dan JPEG mutu 0,7 sebelum dikirim.
  Di sinyal seadanya, mengunggah 8 MB lalu ditolak 422 terbaca sebagai aplikasi rusak.
- Galat jaringan punya kode sintetis sendiri (`ERR_NETWORK`), terpisah dari galat server,
  supaya pesannya bisa berbeda.
- Yang **tidak** dijanjikan: bekerja tanpa sinyal. Lihat §11.3.

### 5.5 Aksesibilitas

- Target sentuh ≥ 44 dp (kontrol web 32 px dinaikkan atau diberi `hitSlop`).
- `accessibilityRole`/`accessibilityLabel` pada seluruh kontrol; `accessibilityLiveRegion`
  pada bar keadaan data; `accessibilityViewIsModal` pada dialog.
- Mode gelap mengikuti sistem sampai pengguna memilih sendiri.

### 5.6 Octane (backend)

Tidak ada penyesuaian yang dibutuhkan. Autentikasi bearer **stateless** — tak ada sesi yang
bisa bocor antar-request di worker yang dipakai ulang, yang justru merupakan jebakan utama
Octane. Klien ini juga tidak menambah beban jenis baru: pola permintaannya sama dengan web.

## 6. Arsitektur Teknis

### 6.1 Tech Stack

| Lapis       | Pilihan                                                   | Alasan                                                                                                                                                                                                                                                                                     |
| ----------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Runtime     | Expo SDK 57 + **Dev Client** (bukan Expo Go)              | ML Kit dan MapLibre adalah modul native custom; Expo Go tak memuatnya. Dev Client memberi alur Expo (prebuild, plugin, OTA config) tanpa kehilangan modul custom.                                                                                                                          |
| RN / React  | 0.86.2 / 19.2.3, New Architecture                         | Versi yang dipatok SDK 57. New Architecture selalu menyala di SDK 57, jadi `newArchEnabled` tak lagi ada di `app.json` — kuncinya ditolak skema.                                                                                                                                           |
| Styling     | **NativeWind 4.2** + Tailwind **3.4**                     | Satu-satunya cara memakai kembali `className` dari web apa adanya. Tailwind v3, bukan v4: NativeWind 4 menargetkan v3, dan v4 akan gagal diam-diam pada `rgb(var(--x) / <alpha-value>)`.                                                                                                   |
| Navigasi    | **React Navigation 7** (bottom-tabs + native-stack)       | Keputusan pengguna. Memberi tombol Back Android, gestur geser, dan tumpukan per tab — yang di web disimulasikan dengan `screen`+`stack` di store.                                                                                                                                          |
| Peta        | **MapLibre RN 11**                                        | Keputusan pengguna. `react-native-maps` membawa ubin Google: gaya peta, atribusi, dan warna pin akan berbeda dari web pada layar yang sama. MapLibre memakai ubin OSM yang sama dengan Leaflet di web.                                                                                     |
| Kamera      | **expo-camera 57**                                        | Alur OCR hanya butuh satu jepretan diam. Nilai VisionCamera ada di frame processor yang sengaja tak dipakai, dan versi 5-nya tak lagi menyertakan config plugin Expo sehingga `prebuild` gagal; expo-camera versi-cocok dengan SDK 57 dan menghapus dua paket nitro dari pohon dependensi. |
| OCR         | `@react-native-ml-kit/text-recognition` 2                 | On-device, gratis, tanpa kunci. API-nya berbasis berkas — cocok dengan keputusan "potret lalu kenali".                                                                                                                                                                                     |
| Ikon        | react-native-svg 15                                       | Data `d` dari 37 ikon web dipakai **persis**, jadi bentuknya tak bergeser antar platform.                                                                                                                                                                                                  |
| Animasi     | react-native-reanimated 4 + **react-native-worklets**     | Reanimated 4 menuntut `react-native-worklets` (0.10–0.11), **bukan** `react-native-worklets-core` — paket yang namanya mirip dan sering tertukar.                                                                                                                                          |
| Penyimpanan | expo-secure-store (token), AsyncStorage (preferensi tema) | Token butuh Keystore; preferensi tema tidak, dan menaruhnya di Keystore hanya memperlambat boot.                                                                                                                                                                                           |
| Gambar      | expo-image-picker + expo-image-manipulator                | Memilih/memotret lalu mengecilkan sebelum unggah (§5.4).                                                                                                                                                                                                                                   |
| State       | Context + reducer + modul action                          | **Sama persis dengan web** — platform-agnostic, jadi dipakai ulang, bukan diganti. Tidak ada Redux/Zustand yang ditambahkan hanya karena ini proyek baru.                                                                                                                                  |

### 6.2 Design Token

Sumber kebenaran: **`src/tokens/palette.json`** (13 warna bertema × 2 mode + 4 warna semantik),
diekstrak dari `src/index.css` dan `tailwind.config.ts` milik FE web — bukan diketik ulang dari
mata. Turunannya:

- `global.css` — **dibangkitkan** oleh `scripts/gen-theme.mjs`. Jangan disunting tangan.
- `tailwind.config.js` — nama kelas dipertahankan persis dari web (`bg-surface`, `text-ink`,
  `border-line`, `rounded-xl2`), sehingga JSX web bisa dipindahkan dengan mengganti elemennya
  saja, bukan gaya-nya.
- `src/tokens/tokens.ts` — spacing, radius, tipografi, bayangan, dan pembaca warna mentah untuk
  yang **tak bisa** memakai `className`: prop library pihak ketiga (MapLibre, expo-camera),
  `StatusBar`, dan tema React Navigation.

Tiga hal yang tidak ikut dari `tailwind.config.ts` web, beserta penggantinya:

| Tidak ikut              | Alasan                       | Pengganti                                                      |
| ----------------------- | ---------------------------- | -------------------------------------------------------------- |
| `boxShadow`             | RN tak punya box-shadow      | `shadows.card` / `shadows.pop` (shadow* + `elevation` Android) |
| `keyframes`/`animation` | Tak ada CSS animation        | Reanimated                                                     |
| `screens` (breakpoint)  | Tak ada breakpoint di ponsel | —                                                              |

**Penjaga penyimpangan.** `pnpm check:drift` membandingkan `palette.json` dengan FE web dan
menyebut token yang berbeda. Dijalankan saat kompilasi PRD ini: **palet sinkron dengan FE web**.
Ini penting karena token di sini adalah **salinan lintas repo** (bukan paket bersama) —
konsekuensi dari keputusan "folder terpisah, bukan monorepo" (temuan T6, §6.4).

Font: Plus Jakarta Sans (400–800) + JetBrains Mono (400). Di web keduanya dimuat dari Google
Fonts CDN, jadi **tak ada salinan lokal yang bisa disalin** — enam berkas TTF harus diunduh
sebelum `expo prebuild` (`assets/fonts/README.md`). Di Android font didaftarkan dalam bentuk
berkelompok (`fontDefinitions` + `weight`); dengan daftar path datar, `font-bold` akan
menebalkan Regular secara sintetis dan huruf tebalnya terlihat berbeda dari web.

### 6.3 Mapping Komponen Web → RN

Tabel lengkap (60+ baris, termasuk layar dan modul non-komponen): **`docs/MAPPING.md`**.
Di bawah ini seluruh komponen dan keputusannya, dengan kolom yang diminta master prompt.

Status: **Port** = 1:1 (props sama, elemen diganti) · **Re-pattern** = pola diganti, alasan
dicatat · **Dilepas** = tak punya makna di native · **Di luar lingkup** = role admin.

Tiga aturan berlaku di hampir semua baris, jadi tak diulang per sel: (1) `onClick` → `onPress`;
(2) **warna teks tidak diwariskan** di RN, jadi setiap peta varian dipecah `box`/`label`;
(3) `children: ReactNode` → `label: string` pada komponen yang di web hanya pernah diisi teks,
karena RN menuntut teks dibungkus `<Text>` dan pemanggil yang lupa akan membuat aplikasi crash.

| Nama Komponen                               | Versi Web                                       | Versi RN                                    | Status          | Catatan                                                                                                                                                                                                          |
| ------------------------------------------- | ----------------------------------------------- | ------------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Icon                                        | `ui/Icon.tsx` (37 ikon)                         | `ui/Icon.tsx` (react-native-svg)            | Re-pattern      | Data `d` sama persis. `className` → `size` + `color`; bawaan `color` = warna teks tema (padanan `currentColor`). Ditambah `style` untuk transform.                                                               |
| Button                                      | `ui/Button.tsx`                                 | `ui/Button.tsx`                             | Re-pattern      | `children` → `label`; varian dipecah `box`/`label`; opasitas 0,85 saat ditekan menggantikan `hover:`.                                                                                                            |
| Badge                                       | `ui/Badge.tsx`                                  | `ui/Badge.tsx`                              | Re-pattern      | `children` → `label`; peta `bg`/`fg` terpisah.                                                                                                                                                                   |
| Chip                                        | `ui/Chip.tsx`                                   | `ui/Chip.tsx`                               | Re-pattern      | `children` → `label`.                                                                                                                                                                                            |
| ProgressBar                                 | `ui/ProgressBar.tsx`                            | `ui/ProgressBar.tsx`                        | Port            | Lebar isian lewat `style` inline — NativeWind tak bisa membangkitkan class dari nilai runtime.                                                                                                                   |
| SectionHeader                               | `ui/SectionHeader.tsx`                          | `ui/SectionHeader.tsx`                      | Port            | —                                                                                                                                                                                                                |
| EmptyState                                  | `ui/EmptyState.tsx`                             | `ui/EmptyState.tsx`                         | Port            | Warna ikon lewat token mentah.                                                                                                                                                                                   |
| StatCard                                    | `ui/StatCard.tsx`                               | `ui/StatCard.tsx`                           | Port            | —                                                                                                                                                                                                                |
| IconButton                                  | `ui/IconButton.tsx`                             | `ui/IconButton.tsx`                         | Re-pattern      | 32 dp → **40 dp** + `hitSlop`. `title` (tooltip hover) → `label` pembaca layar; tooltip tak punya padanan di ponsel.                                                                                             |
| Toggle                                      | `ui/Toggle.tsx`                                 | `ui/Toggle.tsx`                             | Re-pattern      | Sengaja **tidak** memakai `Switch` bawaan RN: warnanya diatur platform dan mengabaikan token — hijau Android akan muncul di tengah palet olive.                                                                  |
| Avatar                                      | `ui/Avatar.tsx`                                 | `ui/Avatar.tsx`                             | Re-pattern      | `<Image>` wajib membawa `headers: fileHeaders()`; backend mengalirkan foto di balik bearer token.                                                                                                                |
| TextField                                   | `ui/FormField.tsx`                              | `ui/FormField.tsx`                          | Re-pattern      | `InputHTMLAttributes` → `TextInputProps`; `focus:` jadi state `focused` eksplisit; `placeholderTextColor`/`selectionColor` disuapi dari token. **Ditambah prop `error`** untuk galat per-field 422.              |
| SelectField                                 | `ui/FormField.tsx`                              | `ui/FormField.tsx`                          | Re-pattern      | **RN tak punya `<select>`** → kotak beridentitas sama yang membuka **bottom sheet** opsi. Prop `options` dipertahankan persis.                                                                                   |
| TextareaField                               | `ui/FormField.tsx`                              | `ui/FormField.tsx`                          | Port            | `rows` → `multiline` + `textAlignVertical="top"`.                                                                                                                                                                |
| Modal                                       | `ui/Modal.tsx`                                  | `ui/Modal.tsx`                              | Re-pattern      | Dua wajah web (kartu ≥sm / sheet) tersisa **sheet saja**. Memakai `Modal` bawaan RN — hanya itu yang menangkap **tombol Back Android**. Prop `wide` dipertahankan tapi tak berefek.                              |
| DayPicker                                   | `ui/DayPicker.tsx`                              | `ui/DayPicker.tsx`                          | Port            | `role` → `accessibilityRole`.                                                                                                                                                                                    |
| Pagination                                  | `ui/Pagination.tsx`                             | `ui/Pagination.tsx`                         | Re-pattern      | Deretan nomor halaman dilepas: tujuh target 32 dp berdempetan di lebar 390 dp. Diganti penunjuk `3/14` + maju/mundur; pemilih jumlah baris pindah ke sheet. `PaginationBind` utuh.                               |
| AlertHost                                   | `ui/Alert.tsx`                                  | `ui/Alert.tsx`                              | Re-pattern      | `useEscape` dilepas (tak ada papan ketik); `focus()` → `accessibilityViewIsModal`.                                                                                                                               |
| ToastHost                                   | `ui/Toast.tsx`                                  | `ui/Toast.tsx`                              | Re-pattern      | `position: fixed` → overlay absolut di akar; offset bawah dari `useSafeAreaInsets()` + tinggi tab bar.                                                                                                           |
| DataBanner                                  | `ui/DataBanner.tsx`                             | `ui/DataBanner.tsx`                         | Re-pattern      | Ditambah **pull-to-refresh** sebagai jalur ulang yang lebih wajar di ponsel.                                                                                                                                     |
| PhoneFrame                                  | `ui/PhoneFrame.tsx`                             | —                                           | Dilepas         | Bezel 390×844 + status bar palsu adalah alat pratinjau desktop; padanannya `expo-status-bar` + `SafeAreaProvider`.                                                                                               |
| MobileShell                                 | `layout/MobileShell.tsx`                        | `navigation/RootNavigator.tsx`              | Re-pattern      | Shell web memilih layar dari `screen` di store; diganti React Navigation. Navigasi berbasis store **dipensiunkan** (keputusan pengguna).                                                                         |
| BottomNav                                   | `layout/BottomNav.tsx`                          | `navigation/tabs.tsx`                       | Re-pattern      | Item nav → `Tab.Screen`; ikon dari `ui/Icon` yang sama; warna dari token, bukan bawaan platform. `PARENT_TAB` dipertahankan sebagai tumpukan per tab.                                                            |
| MobileTopBar                                | `layout/MobileTopBar.tsx`                       | `header` native-stack + `headerRight`       | Re-pattern      | Back manual → back native (sekaligus gestur geser & tombol Back).                                                                                                                                                |
| DesktopShell, Sidebar, TopBar, AccountMenu  | `layout/*`                                      | —                                           | Di luar lingkup | Perabot konsol admin.                                                                                                                                                                                            |
| BaseTiles                                   | `map/BaseTiles.tsx`                             | `map/BaseTiles.ts`                          | Re-pattern      | MapLibre menuntut satu style utuh → ubin OSM disusun sebagai **style JSON**, bukan komponen anak. `{s}` Leaflet tak dikenal → host a/b/c ditulis apa adanya. Latar di bawah ubin ikut tema.                      |
| MapPicker                                   | `map/MapPicker.tsx`                             | `map/MapPicker.tsx`                         | Re-pattern      | Klik-untuk-menaruh-pin → **tekan-tahan**; geser pin tetap ada.                                                                                                                                                   |
| CustomerMap                                 | `map/CustomerMap.tsx`                           | `map/CustomerMap.tsx`                       | Re-pattern      | `<Marker>` → `ViewAnnotation` (bukan `SymbolLayer`: warna pin datang dari golongan tarif yang bisa ditambah admin, jadi gambarnya tak bisa didaftarkan di muka). `<Popup>` → kartu di bawah peta.                |
| MapSearch                                   | `map/MapSearch.tsx`                             | `map/MapSearch.tsx`                         | Re-pattern      | Alur & debounce sama. Navigasi panah + Enter dilepas (papan ketik). `useMap()` tak ada padanannya → ref kamera dioper dari pemanggil.                                                                            |
| MapLegend                                   | `map/MapLegend.tsx`                             | `map/MapLegend.tsx`                         | Re-pattern      | `grid-cols-2` → `flex-wrap`; posisinya kini tetap di dalam komponen.                                                                                                                                             |
| MapFullscreen                               | `map/MapFullscreen.tsx` + `useMapFullscreen.ts` | `map/MapFullscreen.tsx`                     | Re-pattern      | Fullscreen API tak ada → `Modal` RN **di dalam komponen peta**, bukan layar navigasi: peta pemilih titik harus tetap menyunting `value`/`onChange` yang sama saat dibesarkan.                                    |
| pinIcon                                     | `map/pinIcon.ts` (`L.divIcon` + HTML)           | `map/pinIcon.tsx` (`<Pin>` SVG)             | Re-pattern      | Path SVG meniru persis geometri web (kotak 22×22, tiga sudut membulat, diputar −45°). Warna dari `golonganColor()` yang sama.                                                                                    |
| geocode                                     | `map/geocode.ts`                                | `map/geocode.ts`                            | Re-pattern      | Disalin apa adanya (murni `fetch`), **satu tambahan**: header `User-Agent` — di RN tak diisi sendiri, dan tanpanya Nominatim menolak.                                                                            |
| mapCenter                                   | `map/mapCenter.ts`                              | `map/mapCenter.ts`                          | Port            | Aritmetika murni.                                                                                                                                                                                                |
| —                                           | —                                               | `map/camera.ts`                             | Baru            | `useMap()` react-leaflet memberi `fitBounds`/`setView` di dalam komponen; MapLibre RN tidak. Gerakan kamera dikumpulkan di satu modul agar kedua peta bergerak dengan aturan sama.                               |
| NotificationBell                            | `notifications/NotificationBell.tsx`            | `features/notifikasi/NotificationBell.tsx`  | Re-pattern      | Dipasang sebagai `headerRight` navigator, bukan elemen di dalam layar.                                                                                                                                           |
| NotificationSheet                           | `notifications/NotificationSheet.tsx`           | `features/notifikasi/NotificationSheet.tsx` | Port            | Sudah sheet di web; paging 8+5 dipertahankan.                                                                                                                                                                    |
| NotificationList                            | `notifications/NotificationList.tsx`            | `features/notifikasi/NotificationList.tsx`  | Re-pattern      | `map()` → `FlatList`.                                                                                                                                                                                            |
| notificationTarget                          | `notifications/notificationTarget.ts`           | `features/notifikasi/notificationTarget.ts` | Re-pattern      | Kembalian `ScreenId` → `{tab, screen}`; tujuan khusus admin dibuang.                                                                                                                                             |
| DocumentViewer                              | `documents/DocumentViewer.tsx`                  | `features/dokumen/DocumentViewer.tsx`       | Re-pattern      | `<img>` → `<Image>` + `fileHeaders()`; zoom `transform` → gestur cubit.                                                                                                                                          |
| AvatarPicker                                | `shared/AvatarPicker.tsx`                       | `features/shared/AvatarPicker.tsx`          | Re-pattern      | `<input type=file>` + crop DOM → `expo-image-picker`/kamera + `expo-image-manipulator`.                                                                                                                          |
| upload                                      | `lib/upload.ts`                                 | `lib/upload.ts`                             | Re-pattern      | `oversizeReason(File)` → `oversizeReason(bytes)` (tak ada `File` di RN) + `prepareImage()` yang mengecilkan alih-alih menolak — di ponsel tak ada "pilih berkas lain", yang ada hanya kamera yang baru memotret. |
| ThemeProvider                               | `App.tsx` (efek class `dark`)                   | `theme/ThemeProvider.tsx`                   | Re-pattern      | `localStorage` sinkron → `AsyncStorage` asinkron; "belum pernah memilih" dibedakan dari "memilih terang" supaya tema sistem bisa diikuti.                                                                        |
| tokenStore                                  | `api/tokenStore.ts`                             | `api/tokenStore.ts`                         | Re-pattern      | `localStorage` → `expo-secure-store` + cache memori agar header tetap sinkron.                                                                                                                                   |
| usePulse                                    | `store/usePulse.ts`                             | `store/usePulse.ts`                         | Re-pattern      | `document.hidden` → `AppState`.                                                                                                                                                                                  |
| ScanKtp                                     | —                                               | `features/ocr/`                             | Baru            | Satu-satunya fitur tanpa asal di web (§4.2).                                                                                                                                                                     |
| Layar Pelanggan (8)                         | `features/pelanggan/*`                          | `features/pelanggan/*`                      | Direncanakan    | 6 layar + `PaymentSheet` + `LocationSwitcher`. Kerangka + navigasi berdiri; isi layar milestone M6.                                                                                                              |
| Layar Operator (6)                          | `features/operator/*`                           | `features/operator/*`                       | Direncanakan    | 5 layar + `PengajuanTunai`. Milestone M7.                                                                                                                                                                        |
| Layar Auth (5)                              | `features/auth/*`                               | `features/auth/*`                           | Direncanakan    | `LoginPelanggan`, `LoginPetugas`, `OtpForm`, `RegisterPelanggan`, `BootSplash`. `LoginAdmin` di luar lingkup; `AuthRoutes` digantikan navigator. Milestone M3.                                                   |
| Layar Shared (4)                            | `features/shared/*`                             | `features/shared/*`                         | Direncanakan    | `ProfilScreen`, `AkunIdentitasForm`, `GantiPasswordModal`, `AvatarPicker`. Milestone M8.                                                                                                                         |
| `features/admin/*`, `features/superadmin/*` | seluruh folder                                  | —                                           | Di luar lingkup | Konsol tetap di web.                                                                                                                                                                                             |

### 6.4 Integrasi API

#### Temuan T1 — premis Tahap 5 keliru, dan itu menghemat pekerjaan

Master prompt memerintahkan _"tambahkan endpoint auth token-based di Laravel, terpisah dari
sesi cookie SPA yang dipakai FE web"_. Audit Tahap 1 menemukan **FE web tidak memakai sesi
cookie sama sekali**: ia sudah memakai Sanctum **Personal Access Token** bearer, disimpan di
`localStorage`, dikirim sebagai `Authorization: Bearer …`.

Akibatnya: **tidak ada endpoint baru, tidak ada perubahan backend.** Yang berubah hanya
tempat token disimpan — `localStorage` → `expo-secure-store`. Seluruh `src/api/*` disalin dari
web dengan perubahan yang bisa dihitung jari (lihat tabel di bawah).

#### Kontrak yang dipakai ulang apa adanya

- Base URL: `<origin>/api/v1`; header `Accept-Language: id`, `X-Client-Key` opsional.
- Envelope tunggal: `{ success, message, data, meta }`. Galat membawa `code` mesin yang stabil
  (dipakai untuk percabangan) dan `message` yang sudah dilokalkan server (dipakai untuk
  ditampilkan). Validasi 422 membawa `errors` per-field.
- 401 memicu keluar otomatis lewat handler sesi yang sama dengan web.

#### Endpoint yang dipakai aplikasi ini

| Modul          | Endpoint                                                                                                                                                                            |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth           | `POST /auth/login`, `POST /auth/logout`, `POST /auth/register`, `POST /auth/otp/request`, `POST /auth/otp/verify`, `GET /me`                                                        |
| Akun           | `PUT /my/account`, `PUT /my/password`, `POST /my/avatar`, `DELETE /my/avatar`, `GET /my/profile`                                                                                    |
| Pelanggan      | `GET/POST /my/locations`, `GET /my/bills`, `GET /my/payments`, `GET /my/complaints`, `POST /complaints`                                                                             |
| Operator       | `GET /people`, `GET /people/{id}`, `GET /people/{id}/locations`, `GET /bills`, `GET /locations/{id}/bills`, `POST /payments`, `GET /payments`, `POST /payments/{id}/accept          | reject`, `GET /deposits`, `GET /deposits/cash-on-hand`, `POST /deposits` |
| Peta & wilayah | `GET /map/points`, `GET /map/legend`, `GET /zones`, `GET /zones/{id}/route-points`, `GET /wilayah`, `GET /wilayah/{kode}/children`                                                  |
| Notifikasi     | `GET /notifications`, `GET /notifications/unread-count`, `POST /notifications/read-all`, `POST /notifications/{id}/read`, `DELETE /notifications/{id}`, `POST /notifications/clear` |
| Lain           | `GET /sync/pulse`, `GET /branding`, `GET /settings`, `GET /bank-accounts`, `GET /categories/options`, `GET /documents/{id}/content`, `GET /media/avatar/{name}`                     |

Tidak ada satu pun endpoint di daftar itu yang baru. Modul API khusus admin ikut disalin
tetapi **tidak dipanggil** dari layar mana pun; dua fungsi yang mustahil di RN dilepas.

#### Perubahan pada lapisan API dibanding web

| Berkas                               | Perubahan                                                | Alasan                                                                           |
| ------------------------------------ | -------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `api/tokenStore.ts`                  | `localStorage` → `expo-secure-store` + cache memori      | Keystore; cache agar perakitan header tetap sinkron.                             |
| `api/config.ts`                      | `env.js` runtime → `expo-constants` (`extra.apiBaseUrl`) | APK tersegel saat dipasang; tak ada berkas yang bisa ditulis ulang saat menyala. |
| `api/account.ts`, `api/customers.ts` | `File` → `LocalFile { uri, name, type }`                 | Tak ada objek `File` di RN; `FormData` menerima bentuk ini.                      |
| `api/customers.ts`                   | `fetchDocument()` → `documentSource()`                   | Mengembalikan `{ uri, headers }` untuk `<Image>`, bukan blob.                    |
| `api/reports.ts`                     | `downloadRecap()` dilepas                                | Butuh DOM `download()`; hanya admin.                                             |
| `api/branding.ts`                    | `uploadBrandingAsset()` dilepas                          | Butuh `File`; hanya Super Admin.                                                 |

#### Temuan T2 — satu APK terikat satu backend

Web membaca alamat backend dari `env.js` yang ditulis ulang tiap container menyala, sehingga
satu image bisa dipindah antar lingkungan. APK tak punya kemewahan itu. Alamatnya masuk lewat
`extra.apiBaseUrl` (diisi `app.config.js` dari `.env`/env CI) dan **dibekukan saat build**.
Konsekuensi yang harus disadari: **build staging dan produksi adalah dua artefak berbeda**,
dan mengganti alamat backend berarti membangun ulang, bukan menyunting berkas di server.

#### Strategi OCR/AI: on-device, tanpa cadangan awan

| Kasus                                           | Keputusan                  | Alasan                                                                                                                                                                                                 |
| ----------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Baca NIK & biodata dari KTP                     | **On-device** (ML Kit)     | NIK adalah data kependudukan yang tak perlu meninggalkan ponsel hanya untuk dibaca. Hasilnya juga selalu dikoreksi manusia sebelum dikirim, jadi akurasi sempurna bukan syarat.                        |
| "Fallback cloud OCR" yang disebut master prompt | **Tidak ada**              | **Temuan T3:** backend **nihil kode OCR/AI** — diverifikasi dengan penelusuran menyeluruh di `api-app-sampah`. Tak ada endpoint untuk dituju. Membangunnya adalah pekerjaan backend baru; lihat §11.5. |
| Modul AI (klasifikasi sampah, dll)              | **Tidak ada di rilis ini** | Master prompt memerintahkan bertanya dulu; jawaban pengguna: fitur native dibatasi OCR KTP.                                                                                                            |
| Kompresi gambar sebelum unggah                  | **Ya, selalu**             | Sisi terpanjang 1600 px, JPEG 0,7 (`lib/upload.ts`). Batas server 5 MB tetap diperiksa sebagai jaring terakhir.                                                                                        |

### 6.5 Temuan audit lain yang mengubah rencana

Empat temuan Tahap 1 yang belum muncul di atas, dicatat agar tidak hilang:

- **T4 — `packages/tokens/tokens.ts` di repo web adalah yatim.** Tak diimpor siapa pun,
  disinkronkan tangan, dan asimetris dengan `tailwind.config.ts`. Karena itu token di sini
  tidak disalin dari berkas itu, melainkan diekstrak ulang dari `index.css` +
  `tailwind.config.ts`, lalu dijaga dengan `check:drift` (§6.2).
- **T5 — tak ada skema validasi yang bisa dipakai ulang.** Master prompt berasumsi ada
  Zod/Yup; kenyataannya validasi sepenuhnya di server (422 + `errors` per-field). Itu sebabnya
  komponen field di sini **ditambah prop `error`** yang di web belum ada slotnya.
- **T6 — `mobile/README.md` di repo web merencanakan monorepo pnpm.** Bertentangan dengan
  instruksi pengguna (folder bersebelahan). Instruksi pengguna diikuti; risiko token
  menyimpang diakui dan dimitigasi dengan `check:drift`.
- **T7 — tiga dokumen FE web sudah basi** (`ARCHITECTURE.md`, `API-CONTRACT.md`,
  `COMPONENTS.md`): isinya menyebut struktur dan endpoint yang tak lagi cocok dengan kode.
  Seluruh audit memperlakukan **kode sebagai kebenaran**, bukan dokumen-dokumen itu.

### 6.6 Membangun APK di GitHub Actions

Mesin pengembang tidak punya JDK maupun Android SDK, jadi Gradle dijalankan di runner
`ubuntu-latest` yang sudah membawa keduanya: `.github/workflows/android.yml`.

Alurnya: `pnpm install --frozen-lockfile` → `typecheck` + `check:drift` → `expo prebuild
--platform android --no-install` → `./gradlew assembleRelease` → APK diunggah sebagai artefak.
Pemeriksaan tipe dan token dijalankan **sebelum** Gradle karena keduanya < 1 menit sementara
build native belasan menit; gagal di langkah murah selalu lebih baik.

`android/` tetap di `.gitignore` dan dicetak ulang tiap kali. Itu keputusan sadar: sumber
kebenaran proyek native adalah `app.json` + `app.config.js`, dan folder hasil generate yang
ikut ter-commit akan diam-diam menyimpang darinya.

Tiga hal yang dibekukan saat build dan karenanya disuntik lewat env di `app.config.js`:

| Variabel                  | Sumber di CI                       | Kalau kosong                                                           |
| ------------------------- | ---------------------------------- | ---------------------------------------------------------------------- |
| `API_BASE_URL`            | input workflow, atau repo variable | nilai `app.json` — `https://simudah.acehbaratdayakab.go.id` (produksi) |
| `API_CLIENT_KEY`          | repo secret                        | kosong; gerbang klien backend nonaktif                                 |
| `ANDROID_ALLOW_CLEARTEXT` | input workflow                     | HTTP polos **diblokir** di varian release                              |
| `ANDROID_VERSION_CODE`    | `github.run_number`                | `1`                                                                    |

`ANDROID_ALLOW_CLEARTEXT` ada karena template Expo hanya membuka HTTP polos untuk varian
**debug**. Tanpa sakelar ini, APK release yang menunjuk backend `http://` gagal total tanpa
pesan yang menyebut sebabnya — kegagalan yang mahal dilacak. Ia sengaja bukan bawaan:
menyalakannya berarti token bearer melintas terbuka, jadi hanya pantas untuk uji lapangan
sebelum backend punya TLS. **Untuk produksi ia tidak diperlukan**: backend sudah HTTPS.

Bawaan `extra.apiBaseUrl` di `app.json` adalah **produksi**, bukan alamat emulator. Alasannya:
APK yang keluar dari CI adalah artefak yang dibagikan, dan yang paling berbahaya di sana bukan
"lupa menyetel variabel" melainkan "APK beredar sambil menunjuk `10.0.2.2` dan gagal diam-diam
di setiap ponsel". Pengembang lokal yang ingin menunjuk emulator menyatakannya lewat `.env` —
lihat `.env.example`.

**Batas yang harus disadari:** APK release dari workflow ini ditandatangani dengan
**debug keystore** — itu bawaan template Expo, dan APK-nya memang bisa dipasang serta berjalan
penuh (JS ikut dibundel, tak butuh Metro). Tapi ia **tak bisa** diunggah ke Play Store, dan
pemasangan di atasnya kelak dengan kunci sungguhan akan ditolak Android sampai aplikasi lama
dicopot. Keystore rilis menunggu keputusan §11.8.

## 7. Alur Pengguna (User Journey)

### 7.1 Pelanggan baru mendaftar (titik gesekan terbanyak)

1. Buka aplikasi → **Pilih Masuk** → "Daftar".
2. Isi nama, telepon, email, sandi.
3. Tekan **Pindai KTP** → izin kamera diminta sekali, dengan penjelasan bahwa pemindaian
   berjalan di ponsel dan fotonya tak dikirim ke mana pun.
4. Taruh KTP di bingkai → **Pindai** → NIK, nama, jenis kelamin terisi otomatis; pengguna
   memeriksa dan mengoreksi.
5. Foto KTP dilampirkan (dikecilkan otomatis), lalu **Daftar**.
6. Menunggu verifikasi admin.

**Gesekan:**

- _Izin kamera ditolak_ → layar menjelaskan dan menawarkan izin lagi; formulir tetap bisa
  diisi manual. Tak ada jalan buntu.
- _NIK tak terbaca_ (kartu kusam, pantulan plastik, cahaya kurang) → pemindaian dibatalkan
  dengan saran konkret ("pastikan kartu terang, rata, penuh di kotak"), bukan mengisi separuh.
- _Foto KTP besar_ → dikecilkan di klien; tanpa itu, di sinyal desa, unggahan gagal setelah
  menunggu lama dan terbaca sebagai aplikasi rusak.
- _Menunggu verifikasi_ adalah gesekan yang tak bisa dihapus aplikasi — yang bisa dilakukan
  hanya menyatakan statusnya dengan jelas.

### 7.2 Pelanggan membayar tagihan

1. Buka aplikasi → sesi pulih dari Keystore, langsung ke **Beranda** (tanpa masuk ulang).
2. Tab **Tagihan** → pilih titik layanan bila punya lebih dari satu.
3. Menyentuh tagihan → sheet pembayaran: nominal, denda bila ada, rekening bank daerah.
4. Konfirmasi → pembayaran tercatat menunggu verifikasi operator.
5. Notifikasi masuk ke lonceng saat operator memverifikasi.

**Gesekan:**

- _Punya banyak titik_ → pemilih titik harus terlihat, bukan tersembunyi di menu.
- _Denda_ harus dijelaskan asalnya, bukan hanya angka yang membuat total tak cocok.
- _Menunggu verifikasi_ — status "menunggu" harus terbaca sebagai keadaan normal, bukan galat.

### 7.3 Operator menagih di lapangan

1. Masuk sebagai petugas → **Beranda** (kas di tangan, ringkasan hari ini).
2. Tab **Rute** → peta sebaran titik, berwarna per golongan; menyentuh pin membuka kartu
   keterangan.
3. Tab **Tagih** → catat pembayaran per pelanggan.
4. Akhir hari: **Setor** → ajukan setoran tunai.

**Gesekan:**

- _Sinyal putus-putus di lapangan_ → gesekan terbesar dan **belum terselesaikan**: aplikasi
  menampilkan galat + "Coba lagi", tapi tak bisa mencatat luring. Lihat §9.3 dan §11.3.
- _Satu tangan, sambil berdiri_ → target sentuh ≥ 44 dp bukan kemewahan.
- _Layar di bawah matahari_ → mode terang harus tetap kontras; token warna dipakai apa adanya
  dari web yang sudah teruji.

## 8. Milestone

Urutan berdasarkan **risiko**, bukan besar pekerjaan: yang paling mungkin memaksa perubahan
arsitektur dikerjakan lebih dulu.

| #      | Milestone                                    | Isi                                                                                                                                               | Kenapa di urutan ini                                                                                                  |
| ------ | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **M1** | Dev Client menyala dengan semua modul native | `pnpm install` → unduh font → `prebuild` → `run:android`; MapLibre, expo-camera, ML Kit, Reanimated 4 + worklets berdampingan tanpa bentrok versi | Risiko tertinggi dan paling awal terdeteksi. Bentrok versi modul native mengubah pilihan library, bukan sekadar kode. |
| **M2** | Token & tipografi terbukti                   | `check:drift` hijau, enam TTF terpasang, `font-bold` bukan tebal sintetis, mode gelap berganti benar                                              | Semua layar bergantung ini; salah di sini berarti mengulang seluruh tampilan.                                         |
| **M3** | Auth ujung ke ujung (KF-1…KF-6)              | Masuk pelanggan+petugas, OTP, pulih sesi dari Keystore, 401 → keluar otomatis, tolak role admin                                                   | Tanpa ini tak ada layar lain yang bisa diuji dengan data sungguhan.                                                   |
| **M4** | Peta berfungsi (KF-13…KF-19)                 | Pemilih titik, sebaran, pencarian, legenda, layar penuh                                                                                           | Ketergantungan eksternal (ubin OSM, Nominatim) — makin cepat terbukti, makin baik. Lihat §9.1.                        |
| **M5** | OCR KTP (KF-7…KF-12)                         | Pemindai + parser + sambungan ke formulir daftar                                                                                                  | Fitur native satu-satunya; akurasinya baru bisa dinilai dengan KTP sungguhan.                                         |
| **M6** | Layar Pelanggan (KF-20…KF-27, KF-31)         | Beranda, Tagihan, PaymentSheet, Riwayat, Jadwal, Aduan, TambahLokasi, LocationSwitcher                                                            | Volume terbesar, risiko terkecil — polanya sudah ditetapkan M1–M5.                                                    |
| **M7** | Layar Operator (KF-23, KF-24)                | Beranda, Rute, Penagihan, Verifikasi, Setor, PengajuanTunai                                                                                       | Idem.                                                                                                                 |
| **M8** | Profil & notifikasi (KF-28…KF-34)            | Profil, biodata, ganti sandi, foto profil, lonceng + sheet, pratinjau KTP                                                                         | Bergantung M3 dan M6/M7 untuk tujuan navigasi notifikasi.                                                             |
| **M9** | Pengerasan & rilis                           | Kredit ODbL terpasang, penyedia ubin produksi diputuskan, ikon & splash, keystore rilis, uji di ≥3 perangkat nyata, APK ditandatangani            | Butuh keputusan pengguna yang tercatat di §11.                                                                        |

Keadaan terkini (31 Juli 2026): **M1 separuh terbukti** — `pnpm install`, `pnpm typecheck`,
`pnpm check:drift`, `expo-doctor`, dan `expo prebuild --platform android` sudah dijalankan dan
bersih; proyek `android/` terbentuk dengan `minSdk 26`/`compileSdk 36`, enam TTF terdaftar
sebagai keluarga font Android (bukan daftar path datar), dan manifestnya hanya meminta CAMERA +
INTERNET. Yang **belum** terbukti adalah bagian terpenting M1: `pnpm android` — mesin ini tak
punya JDK maupun Android SDK, jadi Gradle belum pernah menyentuh modul-modul native.

**M2** menunggu perangkat dengan alasan yang sama (tebal sintetis dan mode gelap hanya
terlihat di layar). **M3 sudah ditulis** — kelima layar auth, `AuthLayout`, `parts.tsx`,
`useRoleGuard`, dan `lib/pickImage.ts` terisi penuh, termasuk sambungan OCR→formulir daftar
dan penolakan role admin. Kerangka M4–M8 berdiri (navigasi, store, API, komponen, peta, OCR);
isi layar M6, M7, M8 masih penanda yang menyebut berkas web asalnya (±2.400 baris).

M3 baru bisa disebut **selesai** setelah dijalankan di perangkat. Yang harus terbukti di sana:
masuk sandi & OTP, sesi bertahan setelah aplikasi ditutup, 401 menendang keluar, dan akun admin
ditolak dengan pesan yang benar.

## 9. Risiko & Mitigasi

### 9.1 Ubin peta OSM tidak layak produksi — **risiko tertinggi**

Ubin `tile.openstreetmap.org` gratis, dan kebijakan pemakaiannya **melarang aplikasi massal**
memakainya sebagai sumber ubin. Selain itu lisensi ODbL menuntut kredit "© OpenStreetMap
contributors" tetap terlihat, sementara atribusi di kanvas sengaja dimatikan atas permintaan
pengguna — di web pun kewajiban ini **belum dipenuhi di tempat lain** (utang yang diwarisi).

**Mitigasi:** (a) pasang kredit di halaman Tentang/Profil aplikasi — murah dan menutup
kewajiban lisensi; (b) putuskan penyedia ubin produksi sebelum rilis (self-host, MapTiler,
Stadia); URL ubin terkumpul di satu berkas (`BaseTiles.ts`) sehingga penggantiannya satu baris.
Keputusan menunggu pengguna — §11.1.

### 9.2 Modul native saling mengunci versi

Reanimated 4 menuntut `react-native-worklets` (bukan `-core` yang namanya mirip), MapLibre 11
dan ML Kit menarik ketergantungan Android sendiri. Satu paket yang naik versi bisa memecahkan
build native — yang gagalnya di Gradle, bukan di TypeScript, dan jauh lebih lama dilacak.

Risiko ini **sudah terbukti tiga kali** saat M1 dijalankan; dua yang pertama terbaca sebelum
Gradle, yang ketiga hanya muncul saat build sungguhan:

- **VisionCamera 5 dilepas.** Versi 5 tak lagi menyertakan config plugin Expo (`expo install`
  melaporkan "Cannot find module …/lib/VisionCamera"), jadi `prebuild` akan gagal. Diganti
  **expo-camera** — lihat §6.1. Dua paket nitro ikut hilang dari pohon dependensi.
- **`react-native-worklets` sempat ganda.** Reanimated 4.5.3 memakai 0.11.3 sementara
  `expo-modules-core` menuntut ≤ 0.10; dua salinan modul native di satu build adalah kegagalan
  Gradle yang tak menyebut sebabnya. `pnpm fix:versions` menurunkannya ke 0.10.1 dan
  menyeragamkan reanimated ke 4.5.1 — `pnpm why` kini melaporkan satu versi untuk keduanya.
- **`node_modules` pnpm yang ketat mematahkan Metro.** Build CI pertama gagal di
  `:app:createBundleReleaseJsAndAssets` setelah 20 menit. Sebabnya bukan Gradle: preset Babel
  NativeWind menunjuk `react-native-css-interop`, dependensi **transitif** milik `nativewind`
  yang karena itu tak ada di `node_modules` akar — dan Metro me-resolve dari akar proyek.
  Ditambal `.npmrc` berisi `node-linker=hoisted` (setelan yang memang disarankan dokumentasi
  Expo untuk pnpm). `pnpm-lock.yaml` tidak berubah, jadi `--frozen-lockfile` di CI tetap sah.

**Pelajaran yang mengubah cara kerja:** kegagalan ini terbaca **tanpa** Android SDK lewat
`pnpm exec expo export --platform android` — perintah itu menjalankan Metro yang sama dengan
`createBundleReleaseJsAndAssets`, tetapi selesai dalam ~70 detik alih-alih 20 menit. Jalankan
itu dulu setiap kali dependensi berubah, sebelum mengantre runner.

**Mitigasi:** versi dipatok di `package.json`; `pnpm doctor` (expo-doctor) dan
`pnpm fix:versions` disediakan sebagai perintah baku; `minSdkVersion 26` dipilih karena itu
lantai bersama semua modul di atas. Menaikkan versi paket native dilakukan satu per satu,
bukan sekaligus.

### 9.3 Lapangan tanpa sinyal, dan aplikasi yang tak punya jawabannya

Operator menagih di daerah yang sinyalnya putus-putus. Aplikasi ini — seperti web —
mengandaikan jaringan ada. Yang terjadi saat tidak: pekerjaan tak bisa dicatat sampai sinyal
kembali, dan orang akan mencatat di kertas lalu memasukkannya belakangan (dua kali kerja,
dengan risiko selisih).

**Mitigasi jangka pendek:** keadaan galat yang jujur + "Coba lagi" + pull-to-refresh, dan
kompresi unggahan supaya yang berhasil terkirim lebih cepat. **Jangka panjang:** antrean tulis
luring adalah pekerjaan tersendiri yang butuh keputusan resolusi konflik di backend — bukan
sesuatu yang bisa diselundupkan ke rilis ini. §11.3.

### 9.4 (Tambahan) Ketergantungan Nominatim

Pencarian tempat memakai layanan publik Nominatim dengan batas ±1 permintaan/detik dan tanpa
jaminan ketersediaan. **Mitigasi:** debounce 500 ms, cache di memori (termasuk kegagalan),
`User-Agent` yang mengenali aplikasi, dan gagal-diam — peta tetap bisa dipakai dengan
tekan-tahan/geser pin bila pencarian mati.

### 9.5 (Tambahan) ML Kit belum teruji di New Architecture

`expo-doctor` menandai `@react-native-ml-kit/text-recognition` sebagai **"untested on New
Architecture"** — dan New Architecture wajib di SDK 57. Paket ini modul native lama; lapis
interop biasanya menanganinya, tetapi "biasanya" bukan bukti. Peringatannya **sengaja tidak
dibungkam** lewat `expo.doctor.reactNativeDirectoryCheck.exclude`: selama belum ada satu
pindaian yang berhasil di perangkat, `pnpm doctor` yang merah adalah keterangan yang jujur.

**Mitigasi:** dibuktikan di M5, bukan sebelum atau sesudahnya — pindaian pertama di perangkat
sungguhan langsung menjawabnya. Bila gagal, penggantinya sudah diketahui: `expo-ml-kit` atau
memanggil ML Kit lewat modul Expo sendiri, keduanya tanpa mengubah `parseKtp` maupun
`scanBridge` karena antarmuka OCR di kode kita hanya "URI berkas → teks".

## 10. Metrik Keberhasilan

Semuanya bisa diukur tanpa menanyakan perasaan siapa pun.

| #   | Metrik                      | Ambang                                                                                                                                                                 |
| --- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Paritas layar dalam lingkup | 23/23 berkas layar berjalan dengan data sungguhan (Pelanggan 8 + Operator 6 + Auth 5 + Shared 4, §6.3)                                                                 |
| 2   | Paritas visual token        | `pnpm check:drift` hijau di CI; nol warna hex yang ditulis tangan di luar `palette.json` (kecuali putih pada pin peta)                                                 |
| 3   | Kebersihan tipe             | `pnpm typecheck` nol galat                                                                                                                                             |
| 4   | Endpoint baru di backend    | **0** — migrasi ini tidak boleh menuntut perubahan backend                                                                                                             |
| 5   | Akurasi OCR                 | NIK terbaca benar pada **≥ 85%** dari 30 foto KTP uji (kondisi cahaya campuran); NIK **salah** yang lolos ke formulir: **0** dari 30 (penyaring bentuk §KF-11 bekerja) |
| 6   | Waktu OCR                   | < 2 detik dari tombol Pindai sampai formulir terisi, perangkat kelas menengah                                                                                          |
| 7   | Cold start                  | < 3 detik sampai layar pertama yang bisa disentuh                                                                                                                      |
| 8   | Peta                        | 300 pin dimuat < 1,5 detik; geser peta tanpa frame drop yang terlihat                                                                                                  |
| 9   | Ukuran APK                  | < 80 MB (universal); < 45 MB per-ABI                                                                                                                                   |
| 10  | Kestabilan                  | ≥ 99% sesi tanpa crash selama dua minggu uji lapangan                                                                                                                  |
| 11  | Ukuran unggahan             | Foto KTP terkirim < 800 KB pada 95% pendaftaran                                                                                                                        |
| 12  | Kembali ke web              | Nol permintaan ke endpoint khusus admin dari aplikasi ini (diperiksa di log backend)                                                                                   |

## 11. Pertanyaan Terbuka

Butuh keputusan pengguna sebelum milestone yang bersangkutan bisa ditutup.

1. **Penyedia ubin peta produksi & letak kredit ODbL.** (§9.1, blokir M9.) Pilihan: self-host
   ubin, layanan berbayar (MapTiler/Stadia), atau tetap OSM dengan menerima risikonya. Dan:
   kredit "© OpenStreetMap contributors" dipasang di mana — halaman Profil, layar Tentang,
   atau kembali ditampilkan di kanvas peta? Catatan: utang yang sama masih terbuka di FE web.
2. **Tombol "pakai lokasi saya" di peta.** Pelanggan yang menaruh titik rumahnya sendiri jelas
   terbantu oleh GPS, tapi itu **fitur baru** di luar keputusan "fitur native = OCR KTP saja".
   Sekarang izin lokasi sengaja **tidak** diminta sama sekali. Ditambahkan atau tidak?
3. **Harapan terhadap mode luring.** (§9.3.) Apakah operator diharapkan bisa mencatat
   penagihan tanpa sinyal? Bila ya, itu pekerjaan tersendiri (antrean tulis + resolusi konflik
   di backend) dan perlu masuk perencanaan sebagai fase berikutnya, bukan sisipan.
4. **Notifikasi push.** Sekarang lonceng mengandalkan denyut `GET /sync/pulse` saat aplikasi
   dibuka — artinya pemberitahuan tak muncul saat aplikasi tertutup. Perlu FCM? Itu menambah
   pekerjaan backend (penyimpanan token perangkat + pengiriman).
5. **Cadangan OCR di awan.** Bila akurasi on-device di lapangan ternyata di bawah ambang
   metrik 5, apakah dinas bersedia membangun endpoint OCR di Laravel (dan menerima bahwa foto
   KTP akan meninggalkan ponsel)? Sekarang jawabannya "tidak ada", dan itu keputusan sadar.
6. **Pembayaran QRIS.** Backend punya `POST /webhooks/qris`. Pelanggan di ponsel mungkin perlu
   **menampilkan** QR untuk dibayar — berbeda dari "pindai QR" yang sudah dinyatakan di luar
   lingkup. Apakah alur QRIS termasuk yang harus ada di mobile?
7. **Autolengkap wilayah dari NIK (Dukcapil).** Web punya alur ini (mengirim kode wilayah,
   bukan NIK). Apakah ikut ke mobile — dan bila ya, apakah setelah OCR membaca NIK, autolengkap
   dijalankan otomatis atau tetap menunggu pengguna menekan sesuatu?
8. **Distribusi & penandatanganan.** Play Store, atau APK yang dibagikan langsung? Siapa yang
   menyimpan keystore rilis? Ini menentukan alur pembaruan dan apakah perlu pemeriksa versi di
   dalam aplikasi. Keadaan sekarang (§6.6): APK dari CI ditandatangani **debug keystore** —
   cukup untuk uji lapangan, tidak untuk Play Store, dan pindah ke kunci sungguhan menuntut
   pencopotan aplikasi lama di tiap perangkat. Makin cepat diputuskan, makin sedikit perangkat
   yang harus dibersihkan. `versionCode` sudah tidak menunggu jawaban ini: ia diambil dari
   nomor jalan workflow.
9. **Alamat backend.** **Produksi terjawab 31 Jul 2026: `https://simudah.acehbaratdayakab.go.id`**
   (TLS sah; `GET /api/v1/me` membalas 401 dengan envelope `{success, message, code}` yang benar).
   Sudah jadi bawaan `app.json`. Yang **belum** terjawab: apakah ada **staging** terpisah —
   tanpa itu, tiap uji lapangan menyentuh data sungguhan (§6.4 T2 — satu APK terikat satu alamat).
10. **Nama, ikon, dan splash aplikasi.** Sekarang memakai nama sementara "Sampah App" dan ikon
    bawaan; keduanya perlu aset resmi dinas sebelum rilis.
11. ~~**Enam berkas font.**~~ **Selesai 31 Jul 2026** — keenamnya sudah diunduh dari repo hulu
    (Google Fonts hanya menyediakan variable font, sementara `app.json` menuntut satu berkas
    statis per bobot) dan ikut ter-commit. Yang tersisa hanya konfirmasi bahwa Plus Jakarta
    Sans + JetBrains Mono memang dipakai seterusnya: menggantinya setelah semua layar jadi
    berarti memeriksa ulang seluruh tata letak.
