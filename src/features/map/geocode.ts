/**
 * Geocode nama wilayah → kotak batas (bounding box), untuk zoom peta ke area
 * kecamatan/desa. Sumbernya Nominatim (OpenStreetMap): tabel `wilayah` hanya
 * menyimpan kode + nama tanpa koordinat, jadi geometrinya diambil saat dibutuhkan.
 *
 * Keputusan §16.1: geocode di klien (Opsi A). Hasilnya di-cache di memori supaya
 * memilih desa yang sama dua kali tidak memanggil layanan luar dua kali, dan
 * kegagalan tidak merusak apa pun — peta hanya tetap di posisi sebelumnya.
 *
 * Batas Nominatim: ±1 permintaan/detik. Form pendaftaran dipakai sesekali, jadi
 * pemakaian wajar; pemanggil tetap men-debounce pilihan dropdown.
 */

/**
 * `[[selatan, barat], [utara, timur]]` — urutan yang dipakai web (Leaflet) dan
 * dipertahankan di sini apa adanya. MapLibre menuntut sudut [bujur, lintang];
 * penukarannya dilakukan sekali di `camera.ts`, bukan tersebar di pemanggil.
 */
export type GeoBounds = [[number, number], [number, number]];

/**
 * Nominatim menolak permintaan tanpa `User-Agent` yang mengenali aplikasinya. Di web
 * browser mengisinya sendiri; di RN nilai bawaannya hanya pustaka HTTP Android, jadi
 * harus disebut di sini — kalau tidak, pencarian tempat gagal senyap di ponsel.
 */
const HEADERS = {
  Accept: 'application/json',
  'User-Agent': 'AplikasiPersampahanABD/0.1 (Dinas Lingkungan Hidup Aceh Barat Daya)',
};

/**
 * Sasaran fokus peta: kotak batas area + zoom minimum. Peta memuat area dulu
 * (`fitBounds`), lalu diperdalam sampai sekurangnya `minZoom` bila fit-nya terlalu
 * jauh — supaya kecamatan/desa terlihat cukup dekat, bukan sekadar muat di layar.
 */
export interface MapFocus {
  bounds: GeoBounds;
  minZoom: number;
}

/**
 * Kedalaman zoom minimum per jenjang. Desa lebih dalam dari kecamatan. Angka OSM:
 * ~14 = lingkungan/blok, ~16 = tingkat jalan. Naikkan bila ingin lebih dekat lagi.
 */
export const AREA_ZOOM = { district: 14, village: 16 } as const;

/**
 * Satu hasil pencarian tempat: titiknya untuk menaruh pin, kotak batasnya untuk
 * menentukan seberapa dekat peta perlu di-zoom (desa ≠ satu bangunan).
 */
export interface GeoPlace {
  id: string;
  /** Nama panjang dari Nominatim, mis. "Blangpidie, Aceh Barat Daya, Aceh". */
  name: string;
  lat: number;
  lng: number;
  bounds: GeoBounds | null;
}

const cache = new Map<string, GeoBounds | null>();
const searchCache = new Map<string, GeoPlace[]>();

/**
 * Cari tempat berdasarkan kata bebas (nama jalan, desa, penanda) untuk kotak
 * pencarian di dalam peta. Berbeda dari `geocodeBounds` yang hanya mengambil satu
 * jawaban terbaik: di sini pengguna yang memilih, jadi beberapa kandidat
 * dikembalikan sekaligus.
 *
 * Pencarian dibatasi Indonesia dan gagal-diam: kalau layanan luar sedang tak bisa
 * dihubungi, hasilnya daftar kosong — peta tetap bisa dipakai dengan tekan-tahan/geser pin.
 */
export async function geocodeSearch(query: string, limit = 6): Promise<GeoPlace[]> {
  const key = query.trim().toLowerCase();
  if (key.length < 3) return [];
  const hit = searchCache.get(key);
  if (hit !== undefined) return hit;

  try {
    const url =
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=${limit}` +
      `&addressdetails=0&countrycodes=id&accept-language=id&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) throw new Error(String(res.status));

    const rows = (await res.json()) as Array<{
      place_id?: number;
      display_name?: string;
      lat?: string;
      lon?: string;
      boundingbox?: [string, string, string, string];
    }>;
    const places = rows.flatMap((row, i): GeoPlace[] => {
      const lat = Number(row.lat);
      const lng = Number(row.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return [];
      const bb = row.boundingbox;

      return [
        {
          id: String(row.place_id ?? `${key}-${i}`),
          name: row.display_name ?? query,
          lat,
          lng,
          // boundingbox Nominatim = [selatan, utara, barat, timur] (semuanya string).
          bounds: bb
            ? [
                [Number(bb[0]), Number(bb[2])],
                [Number(bb[1]), Number(bb[3])],
              ]
            : null,
        },
      ];
    });
    searchCache.set(key, places);

    return places;
  } catch {
    // Sama seperti `geocodeBounds`: kegagalan ikut disimpan supaya ketikan yang sama
    // tidak memukul Nominatim berulang kali.
    searchCache.set(key, []);

    return [];
  }
}

export async function geocodeBounds(query: string): Promise<GeoBounds | null> {
  const key = query.trim().toLowerCase();
  if (key === '') return null;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;

  try {
    const url =
      'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1' +
      `&countrycodes=id&accept-language=id&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) throw new Error(String(res.status));

    const rows = (await res.json()) as Array<{ boundingbox?: [string, string, string, string] }>;
    const bb = rows[0]?.boundingbox;
    // boundingbox Nominatim = [selatan, utara, barat, timur] (semuanya string).
    const bounds: GeoBounds | null = bb
      ? [
          [Number(bb[0]), Number(bb[2])],
          [Number(bb[1]), Number(bb[3])],
        ]
      : null;
    cache.set(key, bounds);

    return bounds;
  } catch {
    // Simpan kegagalan juga: jangan memborbardir Nominatim untuk nama yang memang
    // tak ketemu. Peta cukup diam di tempat.
    cache.set(key, null);

    return null;
  }
}
