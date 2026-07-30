/**
 * Konfigurasi NativeWind — cermin `tailwind.config.ts` milik FE web.
 *
 * Nama kelas sengaja dipertahankan persis (`bg-surface`, `text-ink`, `border-line`,
 * `rounded-xl2`): itulah yang membuat JSX web bisa dipindahkan ke sini dengan
 * mengganti elemennya saja, bukan gaya-nya. Warna resolve ke CSS variable dari
 * `global.css`, jadi ganti tema cukup satu sakelar seperti di web.
 *
 * Bentuk `rgb(var(--x) / <alpha-value>)` wajib — lihat catatan di global.css.
 *
 * Yang TIDAK ikut dari web dan alasannya:
 * - `boxShadow`  → RN tak punya box-shadow; dipindah ke `shadows` di src/tokens/tokens.ts.
 * - `keyframes`/`animation` → dijalankan Reanimated, bukan CSS.
 * - `screens`    → tak ada breakpoint; satu ukuran layar per perangkat.
 */
const palette = require('./src/tokens/palette.json');

/** Warna bertema: nilainya datang dari CSS variable, bukan dari palette.json langsung. */
const themed = (cssVar) => `rgb(var(--${cssVar}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: themed('bg'),
        surface: themed('surface'),
        surface2: themed('surface-2'),
        // `ink`/`dim`/`line` adalah nama kelas web untuk --text/--text-dim/--border.
        // Namanya dipertahankan supaya `text-ink` berarti hal yang sama di dua repo.
        ink: themed('text'),
        dim: themed('text-dim'),
        line: themed('border'),
        olive: themed('olive'),
        oliveDeep: themed('olive-deep'),
        lime: themed('lime'),
        pill: themed('pill'),
        ph: themed('ph'),
        ph2: themed('ph2'),
        nav: themed('nav'),
        ...palette.semantic,
      },
      fontFamily: {
        sans: ['PlusJakartaSans'],
        mono: ['JetBrainsMono'],
      },
      borderRadius: {
        xl2: '18px',
        xl3: '22px',
      },
    },
  },
  plugins: [],
};
