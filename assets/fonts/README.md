# Berkas font

Keenam TTF di bawah **ikut di-commit**, bukan diunduh saat build: `app.json` merujuknya
satu per satu dan `expo prebuild` gagal bila salah satunya tak ada.

Web memuat font yang sama dari Google Fonts CDN (`index.html`), jadi tak punya salinan
lokal yang bisa disalin. APK tak bisa bergantung pada CDN: aplikasi harus terbaca saat
sinyal buruk, dan font yang gagal diunduh membuat seluruh teks jatuh ke Roboto.

Diambil dari repo hulu masing-masing, bukan dari `fonts.google.com`: yang di Google Fonts
hanya menyediakan berkas **variable** (`PlusJakartaSans[wght].ttf`), sedangkan pemetaan
bobot di `app.json` menuntut satu berkas statis per bobot.

| Berkas                          | usWeightClass | Sumber                                    |
| ------------------------------- | ------------- | ----------------------------------------- |
| `PlusJakartaSans-Regular.ttf`   | 400           | `tokotype/PlusJakartaSans` › `fonts/ttf/` |
| `PlusJakartaSans-Medium.ttf`    | 500           | idem                                      |
| `PlusJakartaSans-SemiBold.ttf`  | 600           | idem                                      |
| `PlusJakartaSans-Bold.ttf`      | 700           | idem                                      |
| `PlusJakartaSans-ExtraBold.ttf` | 800           | idem                                      |
| `JetBrainsMono-Regular.ttf`     | 400           | `JetBrains/JetBrainsMono` › `fonts/ttf/`  |

Nama berkas harus persis seperti di tabel — `app.json` menyebutnya satu per satu berikut
bobotnya, dan pemetaan bobot itulah yang membuat `font-bold` memakai berkas Bold alih-alih
menebalkan Regular secara sintetis.

Keduanya berlisensi SIL Open Font License 1.1, bebas didistribusikan dalam aplikasi.
