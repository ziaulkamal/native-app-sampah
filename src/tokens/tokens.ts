/**
 * Design token lintas platform — Tahap 2 migrasi.
 *
 * Nilainya diekstrak dari FE web (`../design-app-sampah`): `src/index.css` untuk
 * palet light/dark dan `tailwind.config.ts` untuk radius, bayangan, dan tipografi.
 * Warna sendiri tinggal di `palette.json` supaya `scripts/gen-theme.mjs` bisa
 * membangkitkan `global.css` tanpa harus mengurai TypeScript.
 *
 * Cara pakai di layar: JANGAN impor file ini. Pakai kelas NativeWind (`bg-surface`,
 * `text-ink`) seperti di web — kelas itu resolve ke CSS variable yang ikut berganti
 * saat tema berubah. File ini untuk yang tak bisa memakai className: prop warna
 * library pihak ketiga (MapLibre, VisionCamera), `StatusBar`, dan `shadow` RN.
 */
import palette from './palette.json';

export type ThemeMode = 'light' | 'dark';

/** Nama token warna bertema, mengikuti nama CSS variable di web. */
export type ColorToken = keyof (typeof palette)['light'];

/** Palet per mode, kunci = nama CSS variable. */
export const colors: Record<ThemeMode, Record<ColorToken, string>> = {
  light: palette.light,
  dark: palette.dark,
};

/**
 * Warna status. Tidak bertema dengan sengaja — sama seperti di web: "lunas" harus
 * terbaca hijau yang sama di terang maupun gelap, kalau tidak artinya ikut bergeser.
 */
export const semantic = palette.semantic;

/**
 * Skala spacing (dp). Tailwind memakai kelipatan 4px dan web mengandalkan skala
 * bawaan itu, jadi angkanya di sini hanya untuk pemakaian di luar className.
 */
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 } as const;

/**
 * Border radius. `xl2`/`xl3` sengaja memakai nama Tailwind dari web (18px/22px)
 * supaya `rounded-xl2` di sana dan di sini berarti hal yang sama.
 */
export const radii = { sm: 8, md: 12, lg: 14, xl2: 18, xl3: 22, pill: 999 } as const;

export const typography = {
  /** Nama keluarga font setelah dimuat `expo-font` — harus sama persis dengan kunci di `useFonts`. */
  sans: 'PlusJakartaSans',
  mono: 'JetBrainsMono',
  sizes: { caption: 11, small: 12.5, body: 14, title: 17, h2: 22, h1: 27 },
  weights: { regular: '400', medium: '500', semibold: '600', bold: '700', extrabold: '800' },
  /**
   * Batas ikut-membesarnya teks saat pengguna menaikkan "Ukuran font" sistem
   * (`maxFontSizeMultiplier`). Hanya untuk teks di dalam chrome yang ukurannya
   * dijaga — kepala beranda, label menu, badge; teks isi biarkan mengikuti sistem.
   * Tanpa batas ini, perangkat berskala font besar merobek kotak-kotak tetapnya.
   */
  maxScale: 1.2,
} as const;

/**
 * Bayangan. Web memakai `box-shadow`; RN menuntut properti terpisah plus `elevation`
 * untuk Android, jadi tokennya diterjemahkan sekali di sini, bukan di tiap komponen.
 * Nilai diturunkan dari `boxShadow` di tailwind.config.ts web.
 */
export const shadows = {
  /** `0 1px 4px rgba(0,0,0,.05)` — kartu biasa. */
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  /** `0 2px 10px rgba(0,0,0,.08)` — elemen melayang (sheet, dropdown, toast). */
  pop: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
} as const;

/** Warna mentah satu token pada mode tertentu — untuk prop library yang tak menerima className. */
export function color(mode: ThemeMode, token: ColorToken): string {
  return colors[mode][token];
}
