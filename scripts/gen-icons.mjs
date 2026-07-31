// @ts-check
/**
 * Membangkitkan aset ikon & splash dari lambang Pemkab Aceh Barat Daya.
 *
 * Sumbernya satu berkas — `assets/brand/logo-abdya.png`, lambang resmi yang juga dipakai
 * layar pembuka — supaya ikon peluncur, ikon splash native, dan splash JS tak pernah
 * berbeda gambar. Yang dikerjakan skrip ini hanya menyusutkan dan memberi bantalan;
 * tanpa dependensi apa pun (dekoder + encoder PNG zlib, keduanya di bawah).
 *
 * Jalankan: pnpm gen:icons
 */
import { deflateSync, inflateSync } from 'node:zlib';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const assets = join(root, 'assets');

const BG_LIGHT = '#EDEBE4';

function parseHex(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// --- Dekoder PNG -------------------------------------------------------------

/** Membaca PNG 8-bit non-interlace (RGB/RGBA) jadi buffer RGBA lurus. */
function decode(buf) {
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (!sig.every((b, i) => buf[i] === b)) throw new Error('bukan berkas PNG');

  let pos = 8;
  let w = 0;
  let h = 0;
  let bpp = 0;
  const parts = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    pos += 12 + len;
    if (type === 'IHDR') {
      w = data.readUInt32BE(0);
      h = data.readUInt32BE(4);
      const depth = data[8];
      const kind = data[9];
      if (depth !== 8 || (kind !== 2 && kind !== 6) || data[12] !== 0) {
        throw new Error(`PNG ${depth}-bit tipe ${kind} interlace ${data[12]} tak didukung`);
      }
      bpp = kind === 6 ? 4 : 3;
    } else if (type === 'IDAT') {
      parts.push(data);
    } else if (type === 'IEND') {
      break;
    }
  }

  const raw = inflateSync(Buffer.concat(parts));
  const stride = w * bpp;
  const lines = Buffer.alloc(h * stride);

  // Pembalikan filter PNG (0–4); tiap baris didahului satu byte penanda filter.
  let r = 0;
  for (let y = 0; y < h; y += 1) {
    const ft = raw[r];
    r += 1;
    for (let i = 0; i < stride; i += 1) {
      const a = i >= bpp ? lines[y * stride + i - bpp] : 0;
      const b = y > 0 ? lines[(y - 1) * stride + i] : 0;
      const c = y > 0 && i >= bpp ? lines[(y - 1) * stride + i - bpp] : 0;
      let v = raw[r + i];
      if (ft === 1) v += a;
      else if (ft === 2) v += b;
      else if (ft === 3) v += (a + b) >> 1;
      else if (ft === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      } else if (ft !== 0) throw new Error(`filter PNG ${ft} tak dikenal`);
      lines[y * stride + i] = v & 255;
    }
    r += stride;
  }

  if (bpp === 4) return { w, h, px: lines };
  const px = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i += 1) {
    px[i * 4] = lines[i * 3];
    px[i * 4 + 1] = lines[i * 3 + 1];
    px[i * 4 + 2] = lines[i * 3 + 2];
    px[i * 4 + 3] = 255;
  }
  return { w, h, px };
}

// --- Penyusutan & penyusunan -------------------------------------------------

/**
 * Menyusutkan dengan rata-rata kotak. Warnanya dirata-ratakan setelah dikali alfa —
 * tanpa itu piksel transparan yang warnanya sembarang ikut mengotori tepi lambang.
 */
function resize(src, sw, sh, dw, dh) {
  const out = Buffer.alloc(dw * dh * 4);
  for (let y = 0; y < dh; y += 1) {
    const y0 = Math.floor((y * sh) / dh);
    const y1 = Math.max(y0 + 1, Math.floor(((y + 1) * sh) / dh));
    for (let x = 0; x < dw; x += 1) {
      const x0 = Math.floor((x * sw) / dw);
      const x1 = Math.max(x0 + 1, Math.floor(((x + 1) * sw) / dw));
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      let n = 0;
      for (let sy = y0; sy < y1; sy += 1) {
        for (let sx = x0; sx < x1; sx += 1) {
          const i = (sy * sw + sx) * 4;
          const al = src[i + 3] / 255;
          r += src[i] * al;
          g += src[i + 1] * al;
          b += src[i + 2] * al;
          a += al;
          n += 1;
        }
      }
      const o = (y * dw + x) * 4;
      if (a > 0) {
        out[o] = Math.round(r / a);
        out[o + 1] = Math.round(g / a);
        out[o + 2] = Math.round(b / a);
      }
      out[o + 3] = Math.round((a / n) * 255);
    }
  }
  return out;
}

/**
 * Menempel lambang berukuran `box` di tengah kanvas persegi `size`.
 *
 * @param {number} size    sisi kanvas dalam piksel
 * @param {number} box     sisi lambang setelah disusutkan, dalam piksel
 * @param {{w:number,h:number,px:Buffer}} logo sumber lambang
 * @param {string|null} bg warna latar; `null` berarti transparan
 */
function compose(size, box, logo, bg) {
  const scale = box / Math.max(logo.w, logo.h);
  const lw = Math.round(logo.w * scale);
  const lh = Math.round(logo.h * scale);
  const small = resize(logo.px, logo.w, logo.h, lw, lh);
  const back = bg === null ? null : parseHex(bg);

  const px = Buffer.alloc(size * size * 4);
  if (back !== null) {
    for (let i = 0; i < size * size; i += 1) {
      px[i * 4] = back[0];
      px[i * 4 + 1] = back[1];
      px[i * 4 + 2] = back[2];
      px[i * 4 + 3] = 255;
    }
  }

  const ox = Math.round((size - lw) / 2);
  const oy = Math.round((size - lh) / 2);
  for (let y = 0; y < lh; y += 1) {
    for (let x = 0; x < lw; x += 1) {
      const s = (y * lw + x) * 4;
      const d = ((y + oy) * size + x + ox) * 4;
      const a = small[s + 3] / 255;
      if (a === 0) continue;
      for (let k = 0; k < 3; k += 1) {
        px[d + k] = Math.round(px[d + k] + (small[s + k] - px[d + k]) * a);
      }
      px[d + 3] = Math.max(px[d + 3], small[s + 3]);
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
 *   boleh memotongnya jadi lingkaran; 640 menyisakan sedikit napas di dalam 676 itu.
 * - `icon.png` (peluncur lawas & notifikasi) berlatar, jadi bantalannya boleh lebih rapat.
 * - splash digambar 512 supaya tetap tajam saat expo-splash-screen menskalanya ke 160dp.
 */
const files = [
  { name: 'icon.png', size: 1024, box: 780, bg: BG_LIGHT },
  { name: 'adaptive-icon.png', size: 1024, box: 640, bg: null },
  // Terang dan gelap sama isinya: lambang berwarna sudah terbaca di kedua latar, dan
  // app.json tetap menunjuk dua berkas.
  { name: 'splash-icon.png', size: 512, box: 460, bg: null },
  { name: 'splash-icon-dark.png', size: 512, box: 460, bg: null },
];

const logo = decode(readFileSync(join(assets, 'brand', 'logo-abdya.png')));
mkdirSync(assets, { recursive: true });
for (const f of files) {
  writeFileSync(join(assets, f.name), png(f.size, compose(f.size, f.box, logo, f.bg)));
  console.log(`assets/${f.name}  ${f.size}×${f.size}`);
}
console.log(`sumber: assets/brand/logo-abdya.png ${logo.w}×${logo.h}`);
console.log(`latar icon & adaptive: ${BG_LIGHT}`);
