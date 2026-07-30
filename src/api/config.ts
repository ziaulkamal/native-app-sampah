/**
 * Konfigurasi klien API. Padanan `src/api/config.ts` web, dengan satu beda: sumber
 * nilainya.
 *
 * Web membacanya dari `env.js` yang ditulis ulang tiap container menyala, supaya satu
 * image bisa dipindah antar lingkungan. APK tidak punya kemewahan itu — berkasnya
 * sudah tersegel saat dipasang di ponsel. Jadi alamat backend masuk lewat `extra`
 * di app.json (dibekukan saat build) dan dibaca di sini via expo-constants.
 *
 * Akibatnya nyata dan harus disadari: satu APK terikat pada satu backend. Build
 * staging dan produksi adalah dua artefak berbeda — lihat PRD §6.4 dan §11.
 */
import Constants from 'expo-constants';

interface Extra {
  apiBaseUrl?: string;
  apiClientKey?: string;
}

const extra: Extra = (Constants.expoConfig?.extra as Extra | undefined) ?? {};

/** Origin backend tanpa garis miring penutup, mis. `http://10.0.2.2:8000`. */
export const API_ORIGIN = readOrigin();

/** Prefix versi API; dipasang klien, sama seperti web. */
export const API_PREFIX = '/api/v1';

/** Kunci klien opsional (`X-Client-Key`). Kosong = gerbang klien backend nonaktif. */
export const API_CLIENT_KEY = extra.apiClientKey ?? '';

/** Bahasa pesan galat yang diminta ke server (`Accept-Language`). */
export const API_LOCALE = 'id';

/** URL absolut satu endpoint, mis. `apiUrl('/auth/login')`. */
export function apiUrl(path: string): string {
  return `${API_ORIGIN}${API_PREFIX}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Gagal keras saat boot bila origin belum disetel — sama seperti web. Layar putih
 * dengan pesan jelas lebih mudah dilacak daripada seluruh permintaan 404 ke `/api/v1`
 * relatif yang tak pernah ada di ponsel.
 */
function readOrigin(): string {
  const raw = extra.apiBaseUrl ?? '';
  if (raw === '') {
    throw new Error(
      'apiBaseUrl belum disetel — isi `expo.extra.apiBaseUrl` di app.json ' +
        '(emulator Android memakai http://10.0.2.2:8000 untuk localhost host).',
    );
  }
  return raw.replace(/\/+$/, '');
}
