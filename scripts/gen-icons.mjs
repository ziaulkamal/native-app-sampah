// @ts-check
/**
 * Membangkitkan aset ikon & splash dari lambang yang sama dengan `BrandMark`.
 *
 * Kenapa digambar, bukan disimpan sebagai PNG jadi: lambangnya sudah hidup sebagai path
 * SVG di `src/components/ui/Icon.tsx` (`trash`) dan warnanya di `palette.json`. Menyalin
 * hasil ekspor ke repo membuat dua sumber kebenaran yang diam-diam bisa berbeda; skrip
 * ini menurunkan keduanya dari sumber yang sama, dan tak menambah dependensi apa pun
 * (rasterizer kecil + encoder PNG zlib, keduanya di bawah).
 *
 * Jalankan: pnpm gen:icons
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const assets = join(root, 'assets');

const OLIVE_DEEP = '#3C4715';
const LIME = '#C9E24A';
const OLIVE = '#5A6A1E';
const BG_LIGHT = '#EDEBE4';
const BG_DARK = '#141410';

// --- Lambang -----------------------------------------------------------------

/** Tebal garis pada viewBox 24 — sama dengan `strokeWidth` di komponen Icon. */
const STROKE = 1.8;

/** Busur seperempat lingkaran jadi rangkaian tali; 8 potong sudah mulus di 1024px. */
function arc(cx, cy, r, from, to, steps = 8) {
  const pts = [];
  for (let i = 0; i <= steps; i += 1) {
    const a = from + ((to - from) * i) / steps;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return pts;
}

/**
 * Path `trash` diterjemahkan jadi polyline pada viewBox 24×24.
 * Sudut bawah tong yang di SVG berupa `a1 1 0 001 1` diganti busur bersudut sama.
 */
function glyph() {
  const P = Math.PI;
  const body = [
    [6.5, 7],
    [7.4, 19],
    ...arc(8.4, 19, 1, P, P / 2),
    [15.6, 20],
    ...arc(15.6, 19, 1, P / 2, 0),
    [17.5, 7],
  ];
  return [
    [
      [4, 7],
      [20, 7],
    ],
    body,
    [
      [9, 7],
      [9, 4],
      [15, 4],
      [15, 7],
    ],
    [
      [10, 11],
      [10, 17],
    ],
    [
      [14, 11],
      [14, 17],
    ],
  ];
}

/** Jarak titik ke ruas garis — kapsulnya yang memberi ujung & sambungan bulat gratis. */
function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

// --- Raster ------------------------------------------------------------------

function parseHex(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * Menggambar lambang di tengah kanvas persegi.
 *
 * @param {number} size    sisi kanvas dalam piksel
 * @param {number} box     sisi viewBox 24 setelah diskalakan, dalam piksel
 * @param {string} ink     warna garis
 * @param {string|null} bg warna latar; `null` berarti transparan
 */
function render(size, box, ink, bg) {
  const strokes = glyph();
  const [ir, ig, ib] = parseHex(ink);
  const back = bg === null ? null : parseHex(bg);
  const half = STROKE / 2;
  const scale = box / 24;
  const offset = (size - box) / 2;
  const SS = 4; // 4×4 supersample: cukup untuk tepi bersih tanpa bikin skrip lambat

  // Cakupan dikumpulkan per kapsul di dalam kotak batasnya saja. Menyapu seluruh kanvas
  // untuk tiap ruas membuat skripnya berjalan menit-menitan tanpa hasil yang berbeda.
  const cover = new Float32Array(size * size);
  const mark = (ax, ay, bx, by) => {
    const x0 = Math.max(0, Math.floor((Math.min(ax, bx) - half) * scale + offset));
    const x1 = Math.min(size - 1, Math.ceil((Math.max(ax, bx) + half) * scale + offset));
    const y0 = Math.max(0, Math.floor((Math.min(ay, by) - half) * scale + offset));
    const y1 = Math.min(size - 1, Math.ceil((Math.max(ay, by) + half) * scale + offset));
    for (let y = y0; y <= y1; y += 1) {
      for (let x = x0; x <= x1; x += 1) {
        let hits = 0;
        for (let sy = 0; sy < SS; sy += 1) {
          for (let sx = 0; sx < SS; sx += 1) {
            const ux = (x + (sx + 0.5) / SS - offset) / scale;
            const uy = (y + (sy + 0.5) / SS - offset) / scale;
            if (distToSegment(ux, uy, ax, ay, bx, by) <= half) hits += 1;
          }
        }
        const i = y * size + x;
        const a = hits / (SS * SS);
        if (a > cover[i]) cover[i] = a;
      }
    }
  };

  for (const line of strokes) {
    for (let i = 1; i < line.length; i += 1) {
      mark(line[i - 1][0], line[i - 1][1], line[i][0], line[i][1]);
    }
  }

  const px = Buffer.alloc(size * size * 4);
  for (let i = 0; i < cover.length; i += 1) {
    const a = cover[i];
    const o = i * 4;
    if (back === null) {
      px[o] = ir;
      px[o + 1] = ig;
      px[o + 2] = ib;
      px[o + 3] = Math.round(a * 255);
    } else {
      px[o] = Math.round(back[0] + (ir - back[0]) * a);
      px[o + 1] = Math.round(back[1] + (ig - back[1]) * a);
      px[o + 2] = Math.round(back[2] + (ib - back[2]) * a);
      px[o + 3] = 255;
    }
  }
  return px;
}

// --- Encoder PNG -------------------------------------------------------------

const CRC = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (const b of buf) c = CRC[(c ^ b) & 255] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function png(size, pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // truecolour + alpha
  // Tiap baris didahului byte filter 0 (None) — kompresi zlib sudah cukup di sini.
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y += 1) {
    pixels.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// --- Aset --------------------------------------------------------------------

/**
 * `box` per aset bukan angka selera:
 * - adaptive foreground harus muat di lingkaran aman 66% kanvas, karena peluncur Android
 *   boleh memotongnya jadi lingkaran; 780 menempatkan titik terjauh lambang tepat di dalamnya.
 * - `icon.png` (peluncur lawas & notifikasi) memakai padding lebih longgar, 620.
 * - splash digambar 512 supaya tetap tajam saat expo-splash-screen menskalanya ke 200dp.
 */
const files = [
  { name: 'icon.png', size: 1024, box: 620, ink: LIME, bg: OLIVE_DEEP },
  { name: 'adaptive-icon.png', size: 1024, box: 780, ink: LIME, bg: null },
  { name: 'splash-icon.png', size: 512, box: 340, ink: OLIVE, bg: null },
  { name: 'splash-icon-dark.png', size: 512, box: 340, ink: LIME, bg: null },
];

mkdirSync(assets, { recursive: true });
for (const f of files) {
  writeFileSync(join(assets, f.name), png(f.size, render(f.size, f.box, f.ink, f.bg)));
  console.log(`assets/${f.name}  ${f.size}×${f.size}`);
}
console.log(`latar adaptive: ${BG_LIGHT} · splash gelap: ${BG_DARK}`);
