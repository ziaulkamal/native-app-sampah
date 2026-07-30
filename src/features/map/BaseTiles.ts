import { useMemo } from 'react';
import { useTheme } from '@/theme/ThemeProvider';
import { colors } from '@/tokens/tokens';

/**
 * Peta dasar — padanan `BaseTiles.tsx` web, dengan bentuk yang berbeda: di web ia
 * komponen `<TileLayer>`, di sini sebuah **style JSON** yang diberikan ke `MapView`.
 * MapLibre selalu menuntut satu style utuh untuk berjalan, jadi menyusunnya sekali di
 * sini lebih jujur daripada memberi style kosong lalu menempelkan lapisan sebagai anak.
 *
 * Dua beda teknis dari web yang perlu diketahui:
 *
 * 1. `{s}` (subdomain acak Leaflet) tak dikenal MapLibre. Ketiga host a/b/c ditulis
 *    apa adanya sebagai daftar ubin — efeknya sama: beban terbagi tiga.
 * 2. Warna latar di bawah ubin ikut tema. Di web bidang itu tak pernah terlihat karena
 *    ubin selalu menutup penuh; di ponsel ia sempat tampak saat peta digeser cepat,
 *    dan putih polos di mode gelap terlihat seperti kanvas rusak.
 *
 * Kredit peta: sama seperti web, logo dan atribusi bawaan dimatikan atas permintaan
 * pengguna (`logoEnabled`/`attributionEnabled` di `MapView`). Ubin openstreetmap.org
 * tetap terikat ODbL yang menuntut kredit "© OpenStreetMap contributors" terlihat —
 * kewajiban itu harus dipenuhi di luar kanvas (halaman Tentang). Lihat PRD §9 & §11:
 * kebijakan ubin OSM juga tak mengizinkan aplikasi massal memakai ubinnya, jadi
 * penyedia ubin produksi masih harus ditentukan.
 */

const OSM_TILES = [
  'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
  'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
  'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
];

/** Style peta dasar sebagai string JSON — bentuk yang diterima semua versi `mapStyle`. */
export function useBaseStyle(): string {
  const { mode } = useTheme();

  return useMemo(
    () =>
      JSON.stringify({
        version: 8,
        sources: {
          osm: { type: 'raster', tiles: OSM_TILES, tileSize: 256, maxzoom: 19 },
        },
        layers: [
          { id: 'bg', type: 'background', paint: { 'background-color': colors[mode].bg } },
          { id: 'osm', type: 'raster', source: 'osm' },
        ],
      }),
    [mode],
  );
}

/** Zoom terdalam yang punya ubin di openstreetmap.org. */
export const MAX_ZOOM = 19;
