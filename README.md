# native-app-sampah

Aplikasi Android untuk **Pelanggan** dan **Operator** layanan persampahan & retribusi
Kabupaten Aceh Barat Daya. React Native + Expo Dev Client, berbagi backend Laravel Octane
dan design token dengan FE web `../design-app-sampah`.

Konsol **Admin Dinas & Super Admin tetap di web** (keputusan pengguna, lihat `PRD.md` §3).

- Spesifikasi lengkap: [`PRD.md`](PRD.md)
- Peta komponen web → native: [`docs/MAPPING.md`](docs/MAPPING.md)

## Prasyarat

| Kebutuhan                       | Catatan                                                                                      |
| ------------------------------- | -------------------------------------------------------------------------------------------- |
| Node 20+ dan pnpm 10            | `packageManager` sudah dikunci di `package.json`.                                            |
| Android Studio + SDK 36, JDK 17 | Wajib: proyek ini memakai **Dev Client**, bukan Expo Go.                                     |
| Backend berjalan                | Laravel Octane di `../api-app-sampah` (atau server dinas).                                   |
| Enam berkas font                | Lihat [`assets/fonts/README.md`](assets/fonts/README.md) — harus ada **sebelum** `prebuild`. |

Expo Go tidak bisa dipakai: aplikasi ini memuat modul native yang tak ada di dalamnya
(MapLibre, expo-camera, ML Kit, SecureStore-Keystore).

## Menyiapkan

```bash
cd D:/Projects/native-app-sampah
cp .env.example .env      # isi API_BASE_URL
pnpm install
pnpm check:drift          # pastikan token warna masih sama dengan FE web
pnpm prebuild             # generate folder android/ dari app.json + app.config.js
```

`API_BASE_URL` **ikut tersegel di dalam APK** — mengganti alamat backend berarti build ulang.
Tanpa `.env`, build memakai bawaan `app.json`: **`https://simudah.acehbaratdayakab.go.id`**
(produksi). Isi `.env` bila Anda ingin menunjuk emulator (`http://10.0.2.2:8000`) atau server
lokal — nilainya **origin saja**, tanpa `/api/v1`, yang dipasang klien sendiri.

## Menjalankan

```bash
pnpm android              # build + pasang Dev Client ke emulator/perangkat
pnpm start                # setelah terpasang, cukup ini untuk sesi berikutnya
```

## Membangun APK tanpa Android SDK

Bila mesin Anda tak punya JDK/Android SDK, Gradle bisa dijalankan di GitHub Actions:
**Actions → Android APK → Run workflow**. APK-nya turun sebagai artefak (`sampah-release-<n>`).

| Input             | Guna                                                                           |
| ----------------- | ------------------------------------------------------------------------------ |
| `variant`         | `release` (JS ikut dibundel — jalan sendiri) atau `debug` (butuh Metro).       |
| `api_base_url`    | Alamat backend yang **disegel** ke APK. Kosong = nilai `app.json`.             |
| `allow_cleartext` | Nyalakan hanya bila backend masih `http://` — Android memblokirnya di release. |

APK-nya ditandatangani **debug keystore**: cukup untuk uji lapangan, **tidak** untuk Play
Store. Lihat `PRD.md` §6.6 dan §11.8.

## Perintah lain

| Perintah            | Guna                                                                           |
| ------------------- | ------------------------------------------------------------------------------ |
| `pnpm typecheck`    | `tsc --noEmit`.                                                                |
| `pnpm format`       | Prettier (aturan sama dengan FE web).                                          |
| `pnpm gen:theme`    | Bangkitkan `global.css` dari `src/tokens/palette.json`.                        |
| `pnpm check:theme`  | Gagal bila `global.css` tak sesuai palet (untuk CI).                           |
| `pnpm check:drift`  | Bandingkan palet dengan `../design-app-sampah`; deteksi token yang menyimpang. |
| `pnpm check:bundle` | Metro yang sama dengan build release, ~70 detik — jalankan sebelum antre CI.   |
| `pnpm doctor`       | `expo-doctor` — periksa kecocokan versi paket.                                 |
| `pnpm fix:versions` | `expo install --fix` — samakan versi paket dengan SDK.                         |

## Struktur

```
src/
  api/         klien HTTP + endpoint per domain (cermin ../design-app-sampah/src/api)
  components/  ui/ (primitif) + layout/ (ScreenScaffold)
  features/    auth, pelanggan, operator, shared, notifikasi, dokumen, map, ocr
  lib/         fungsi murni: format, tanggal, label, izin, unggahan
  navigation/  React Navigation: root, tab pelanggan/operator, tema
  store/       AppContext + actions (cermin store web, tanpa state layar)
  theme/       ThemeProvider (terang/gelap, mengikuti sistem sampai dipilih)
  tokens/      palette.json (SSOT) + tokens.ts
```

## Hubungan dengan repo lain

- `../design-app-sampah` — FE web. **Tidak disentuh** oleh proyek ini. Sumber design token
  dan pola komponen; `pnpm check:drift` yang menjaga keduanya tak menyimpang diam-diam.
- `../api-app-sampah` — backend Laravel. Kontrak API sama persis, termasuk envelope
  `{success, message, data, meta}` dan token bearer Sanctum.
