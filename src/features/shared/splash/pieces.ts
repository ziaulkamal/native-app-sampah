/**
 * Geometri & waktu kepingan lambang untuk splash sinematik.
 *
 * Angkanya disalin apa adanya dari desain `Splash Abdya Cinematic.dc.html` (kanvas
 * 1080×1920, kotak lambang 720×720) supaya perbandingan visualnya tetap bisa dilacak
 * ke sumbernya. Yang diterjemahkan hanya dua hal yang tak ada di RN: `clip-path`
 * persen jadi titik poligon SVG, dan sumbu Z jadi pengali translasi + skala.
 */

/** Sisi kotak lambang dalam satuan kanvas desain; juga viewBox tiap kepingan. */
export const RIG = 720;

/** Sama dengan `perspective:1400px` di desain. */
const PERSPEKTIF = 1400;

export interface Keping {
  /** Titik poligon SVG dalam satuan `RIG`. */
  points: string;
  /** Geser awal (satuan kanvas), sudah dilipat dari Z. */
  tx: number;
  ty: number;
  /** Putaran awal (derajat). */
  rot: number;
  /** Skala awal, sudah dilipat dari Z. */
  sc: number;
  /** Lama & jeda animasi masuk (ms, pada tempo 1). */
  dur: number;
  delay: number;
}

const titik = (pts: readonly (readonly [number, number])[]) =>
  pts.map(([x, y]) => `${(x / 100) * RIG},${(y / 100) * RIG}`).join(' ');

// RN tak punya sumbu Z: jarak kamera dilipat jadi faktor `k` yang mengalikan translasi
// dan skala — persis yang dilakukan pembagian perspektif CSS.
const keping = (
  pts: readonly (readonly [number, number])[],
  tx: number,
  ty: number,
  tz: number,
  rot: number,
  sc: number,
  dur: number,
  delay: number,
): Keping => {
  const k = PERSPEKTIF / (PERSPEKTIF - tz);
  return { points: titik(pts), tx: tx * k, ty: ty * k, rot, sc: sc * k, dur, delay };
};

/** Titik pusat kotak; tiap kepingan adalah juring yang berpangkal di sini. */
const P: readonly [number, number] = [50, 50];

/** 14 juring yang menutup penuh kotak lambang, searah jarum jam dari atas-tengah. */
export const KEPINGAN: readonly Keping[] = [
  keping([P, [50, 0], [66.2, 0]], -980, -760, -320, -46, 2.1, 1350, 150),
  keping([P, [66.2, 0], [100, 0], [100, 3.4]], 760, -880, -140, 38, 1.55, 1300, 320),
  keping([P, [100, 3.4], [100, 33.7]], 0, 0, -1500, -72, 0.25, 1600, 440),
  keping([P, [100, 33.7], [100, 55.3]], 1080, -180, 120, 24, 1.85, 1250, 600),
  keping([P, [100, 55.3], [100, 89.1]], 620, 900, -260, -31, 0.72, 1550, 780),
  keping([P, [100, 89.1], [100, 100], [77.7, 100]], 840, 640, 60, 52, 0.85, 1500, 940),
  keping([P, [77.7, 100], [56.1, 100]], 180, 1120, -80, -18, 0.9, 1450, 1100),
  keping([P, [56.1, 100], [32.8, 100]], -120, 1020, -480, 29, 0.6, 1500, 1260),
  keping([P, [32.8, 100], [5, 100]], -720, 820, 200, -44, 1.7, 1300, 1420),
  keping([P, [5, 100], [0, 100], [0, 72.3]], -1120, 420, -60, 33, 1.25, 1400, 1600),
  keping([P, [0, 72.3], [0, 49.1]], 0, 0, -1900, 96, 0.2, 1700, 1740),
  keping([P, [0, 49.1], [0, 23.4]], -1240, -260, 140, -27, 1.95, 1350, 1900),
  keping([P, [0, 23.4], [0, 0], [21.1, 0]], -880, -980, -200, 41, 1.4, 1400, 2060),
  keping([P, [21.1, 0], [50, 0]], -240, -1180, -420, -15, 0.8, 1320, 2260),
];

/**
 * Papan waktu (ms, tempo 1). Nama `delay` mengikuti urutan tampil, bukan urutan tulis,
 * supaya mudah dicocokkan dengan keterangan di kaki desain: blok 0–2.5s, kunci + kilat
 * 2.5–4.0s, teks 4.0–5.5s, tahan sampai 6.0s.
 */
export const WAKTU = {
  /** Dorongan kamera menyelimuti seluruh adegan. */
  kamera: 6000,
  grid: 2200,
  goyang: 3600,
  kilat: { dur: 1500, delay: 3350 },
  /** Empat percikan di sekeliling lambang saat kepingan mengunci. */
  percik: [
    { x: 64, y: 16, d: 120, warna: '150,255,220', delay: 1500 },
    { x: 22, y: 70, d: 150, warna: '255,214,140', delay: 2350 },
    { x: 80, y: 58, d: 110, warna: '120,220,255', delay: 2900 },
    { x: 34, y: 24, d: 130, warna: '150,255,220', delay: 3300 },
  ],
  percikDur: 600,
  /** Debu yang naik terus-menerus; `dur` panjang dan berbeda supaya tak pernah seirama. */
  debu: [
    { x: 14, y: 78, d: 26, warna: '160,255,225', op: 0.55, dur: 7000, delay: 0 },
    { x: 31, y: 86, d: 16, warna: '255,214,140', op: 0.5, dur: 9000, delay: 1200 },
    { x: 58, y: 82, d: 34, warna: '120,220,255', op: 0.4, dur: 8000, delay: 600 },
    { x: 76, y: 90, d: 20, warna: '160,255,225', op: 0.45, dur: 10000, delay: 2100 },
    { x: 88, y: 74, d: 14, warna: '255,214,140', op: 0.45, dur: 8500, delay: 3400 },
    { x: 46, y: 94, d: 22, warna: '120,255,214', op: 0.4, dur: 11000, delay: 4200 },
  ],
  naik: [
    { delay: 3950, dur: 850 },
    { delay: 4180, dur: 850 },
    { delay: 4420, dur: 900 },
  ],
  sapu: [
    { delay: 4050, dur: 1100 },
    { delay: 4280, dur: 1100 },
    { delay: 4550, dur: 1200 },
  ],
  garis: { delay: 4950, dur: 700 },
  moto: { delay: 5050, dur: 900 },
  jejak: { delay: 5400, dur: 800 },
  /** Kapan adegan dianggap habis dan layar mulai memudar ke aplikasi. */
  akhir: 6300,
} as const;

/**
 * Goyangan rig saat kepingan berbenturan. Pasangan `stop`/`x`/`y` adalah keyframe
 * `rigShake` desain yang diratakan jadi tiga larik sejajar untuk `interpolate`.
 */
export const GOYANG: { stop: number[]; x: number[]; y: number[] } = {
  stop: [
    0, 0.26, 0.28, 0.31, 0.34, 0.47, 0.49, 0.52, 0.56, 0.68, 0.7, 0.73, 0.78, 0.9, 0.92, 0.95, 1,
  ],
  x: [0, 0, -5, 4, 0, 0, 6, -4, 0, 0, -7, 5, 0, 0, 0, 0, 0],
  y: [0, 0, 3, -3, 0, 0, 4, -2, 0, 0, -5, 3, 0, 0, 8, -4, 0],
};
