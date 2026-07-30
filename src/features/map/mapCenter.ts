import * as misc from '@/api/misc';
import type { LatLng } from './MapPicker';

/**
 * Titik awal peta. Diambil dari pengaturan dinas `map_center` (§16.1) — Super Admin
 * menetapkannya sekali agar seluruh dinas mulai dari daerahnya, bukan dari tengah
 * Indonesia. Bila belum diisi, jatuh ke pusat wilayah kerja bawaan: Blangpidie,
 * ibu kota Kabupaten Aceh Barat Daya.
 */
export const DEFAULT_CENTER: LatLng = { lat: 3.7522, lng: 96.8306 };

/**
 * Baca `map_center` dari pengaturan. Bentuknya toleran: objek `{lat, lng}` atau
 * string `"lat,lng"` — keduanya mungkin tersimpan tergantung bagaimana ia diisi.
 * Apa pun yang tak terbaca dikembalikan sebagai pusat bawaan, bukan galat: peta
 * yang meleset sedikit jauh lebih baik daripada form yang gagal tampil.
 */
export async function readMapCenter(): Promise<LatLng> {
  const settings = await misc.readSettings().catch(() => ({}) as Record<string, unknown>);

  return parseCenter(settings.map_center) ?? DEFAULT_CENTER;
}

function parseCenter(raw: unknown): LatLng | null {
  if (raw && typeof raw === 'object' && 'lat' in raw && 'lng' in raw) {
    const lat = Number((raw as Record<string, unknown>).lat);
    const lng = Number((raw as Record<string, unknown>).lng);

    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  }
  if (typeof raw === 'string' && raw.includes(',')) {
    const [lat, lng] = raw.split(',').map((n) => Number(n.trim()));

    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  }

  return null;
}
