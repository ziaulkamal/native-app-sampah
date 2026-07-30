/**
 * Membangkitkan `global.css` dari `src/tokens/palette.json`.
 *
 * Kenapa digenerate, bukan ditulis tangan seperti di web: repo ini terpisah dari
 * `design-app-sampah`, jadi paletnya adalah SALINAN. Salinan yang disunting di dua
 * tempat akan menyimpang diam-diam — dan penyimpangan warna tidak pernah muncul
 * sebagai galat, hanya sebagai "kok mobile-nya beda sedikit". Dengan digenerate,
 * satu-satunya tempat yang boleh disunting adalah palette.json.
 *
 * Pakai:
 *   node scripts/gen-theme.mjs            tulis global.css
 *   node scripts/gen-theme.mjs --check    hanya periksa, keluar 1 bila basi (untuk CI)
 *   node scripts/gen-theme.mjs --drift    bandingkan dengan src/index.css milik FE web
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const palette = JSON.parse(readFileSync(resolve(root, 'src/tokens/palette.json'), 'utf8'));
const target = resolve(root, 'global.css');

/** Lokasi FE web; dipakai mode --drift saja, jadi ketidakhadirannya bukan galat. */
const WEB_CSS = resolve(root, '../design-app-sampah/src/index.css');

/** `#EDEBE4` → `237 235 228`. Bentuk kanal wajib agar Tailwind bisa menyisipkan alpha. */
function channels(hex) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (m === null) throw new Error(`Nilai warna bukan hex 6 digit: ${hex}`);
  const n = parseInt(m[1], 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

function block(vars) {
  return Object.entries(vars)
    .map(([name, hex]) => `  --${name}: ${channels(hex)};`)
    .join('\n');
}

const css = `@tailwind base;
@tailwind components;
@tailwind utilities;

/*
 * DIGENERATE oleh scripts/gen-theme.mjs — jangan sunting berkas ini.
 * Sunting src/tokens/palette.json lalu jalankan \`pnpm gen:theme\`.
 *
 * Ditulis sebagai kanal RGB ("237 235 228"), BUKAN hex, dengan alasan yang sama
 * seperti di web: Tailwind hanya bisa menyisipkan alpha (\`bg-surface/95\`) ke warna
 * berbentuk \`rgb(<kanal> / <alpha-value>)\`. Dengan hex di dalam var(), kelas
 * ber-alpha tertulis di komponen tapi tidak menghasilkan aturan apa pun — gagal
 * dalam diam. NativeWind v4 mewarisi perilaku ini persis.
 */
@layer base {
  :root {
${block(palette.light)}
  }

  .dark:root {
${block(palette.dark)}
  }
}
`;

if (process.argv.includes('--drift')) {
  reportDrift();
} else if (process.argv.includes('--check')) {
  const current = readFileSync(target, 'utf8');
  if (current !== css) {
    console.error('global.css basi terhadap palette.json — jalankan `pnpm gen:theme`.');
    process.exit(1);
  }
  console.log('global.css sinkron dengan palette.json.');
} else {
  writeFileSync(target, css);
  console.log(`global.css ditulis (${Object.keys(palette.light).length} token × 2 mode).`);
}

/**
 * Bandingkan palet dengan FE web. Hanya melaporkan token yang NILAINYA bentrok;
 * token yang cuma ada di sini (mis. olive-deep, yang di web hidup di tokens.ts tapi
 * tak pernah masuk index.css) bukan penyimpangan, melainkan tambahan yang disengaja.
 */
function reportDrift() {
  let web;
  try {
    web = readFileSync(WEB_CSS, 'utf8');
  } catch {
    console.log(`FE web tak ditemukan di ${WEB_CSS} — lewati pemeriksaan drift.`);
    return;
  }

  const scopes = {
    light: /:root\s*\{([^}]*)\}/.exec(web)?.[1] ?? '',
    dark: /\.dark\s*\{([^}]*)\}/.exec(web)?.[1] ?? '',
  };

  const conflicts = [];
  for (const [mode, body] of Object.entries(scopes)) {
    for (const [name, hex] of Object.entries(palette[mode])) {
      const found = new RegExp(`--${name}:\\s*([^;]+);`).exec(body)?.[1]?.trim();
      if (found !== undefined && found !== channels(hex)) {
        conflicts.push(`  ${mode}/--${name}: web "${found}" ≠ sini "${channels(hex)}" (${hex})`);
      }
    }
  }

  if (conflicts.length === 0) {
    console.log('Palet sinkron dengan FE web.');
    return;
  }
  console.error(`Palet menyimpang dari FE web pada ${conflicts.length} token:`);
  console.error(conflicts.join('\n'));
  process.exit(1);
}
