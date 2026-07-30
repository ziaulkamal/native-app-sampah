import type { CameraRef, LngLatBounds, MapRef } from '@maplibre/maplibre-react-native';
import type { GeoBounds, GeoPlace, MapFocus } from './geocode';

/**
 * Gerakan kamera peta. Di web hal ini tersebar di dalam komponen lewat `useMap()`
 * (`map.fitBounds`, `map.setView`); MapLibre RN tak punya hook semacam itu, jadi
 * logikanya dikumpulkan di sini supaya `MapPicker` dan `CustomerMap` bergerak dengan
 * aturan yang sama persis, bukan dua salinan yang lambat laun berbeda.
 */

/** MapLibre memakai urutan [bujur, lintang]; Leaflet [lintang, bujur]. */
export type LngLat = [number, number];

export const toLngLat = (p: { lat: number; lng: number }): LngLat => [p.lng, p.lat];

/**
 * `GeoBounds` Nominatim = `[[selatan, barat], [utara, timur]]`; MapLibre menuntutnya
 * datar dalam urutan `[barat, selatan, timur, utara]`.
 */
export function toBounds(bounds: GeoBounds): LngLatBounds {
  const [[south, west], [north, east]] = bounds;

  return [west, south, east, north];
}

/** Zoom terdalam saat hasil pencarian dimuat — sama dengan `MAX_RESULT_ZOOM` web. */
export const MAX_RESULT_ZOOM = 18;

const FIT_MS = 400;

/** Muat hasil pencarian: seluas kotak batasnya, tapi tak lebih dekat dari batas wajar. */
export function focusPlace(cam: CameraRef | null, map: MapRef | null, place: GeoPlace): void {
  if (cam === null) return;
  if (place.bounds === null) {
    cam.easeTo({ center: [place.lng, place.lat], zoom: MAX_RESULT_ZOOM, duration: FIT_MS });

    return;
  }
  cam.fitBounds(toBounds(place.bounds), { padding: pad(24), duration: FIT_MS });
  void capZoom(cam, map, MAX_RESULT_ZOOM);
}

/** Fokus ke kecamatan/desa: muat areanya, lalu perdalam sampai sekurangnya `minZoom`. */
export function focusArea(cam: CameraRef | null, map: MapRef | null, focus: MapFocus): void {
  if (cam === null) return;
  cam.fitBounds(toBounds(focus.bounds), { padding: pad(20), duration: FIT_MS });
  void deepenZoom(cam, map, focus.minZoom);
}

const pad = (value: number) => ({ top: value, right: value, bottom: value, left: value });

/**
 * Web bisa membaca `map.getZoom()` seketika setelah `fitBounds`; di RN nilainya baru
 * benar setelah animasi selesai, jadi keduanya menunggu dulu. Diam-diam gagal bila
 * peta sudah tak terpasang — pengguna tetap melihat hasil `fitBounds`-nya.
 */
async function readZoom(map: MapRef | null): Promise<number | null> {
  if (map === null) return null;
  await new Promise((resolve) => setTimeout(resolve, FIT_MS + 60));
  try {
    return await map.getZoom();
  } catch {
    return null;
  }
}

/** Terlalu dekat (kotak batas setipis satu bangunan): tarik mundur ke batas wajar. */
async function capZoom(cam: CameraRef, map: MapRef | null, max: number): Promise<void> {
  const zoom = await readZoom(map);
  if (zoom !== null && zoom > max) cam.zoomTo(max, { duration: 200 });
}

/** Terlalu jauh (kecamatan luas): dekatkan tanpa menggeser pusatnya. */
async function deepenZoom(cam: CameraRef, map: MapRef | null, min: number): Promise<void> {
  const zoom = await readZoom(map);
  if (zoom !== null && zoom < min) cam.zoomTo(min, { duration: 200 });
}
