import * as SecureStore from 'expo-secure-store';

/**
 * Penyimpan token bearer. Padanan `tokenStore.ts` web, dengan dua beda penting.
 *
 * 1. Penyimpanannya Keystore/Keychain (expo-secure-store), bukan localStorage.
 *    Token retribusi membuka NIK dan riwayat bayar warga; di ponsel yang bisa
 *    di-root atau dipinjam, menaruhnya di penyimpanan biasa tidak sepadan.
 * 2. Bacaannya asinkron, sementara web bisa sinkron. Karena itu ada cache di memori:
 *    `readToken()` yang sinkron dipakai penyusun header tiap permintaan, dan
 *    menunggu Keystore di jalur itu akan menambah latensi ke SETIAP panggilan.
 *    `loadToken()` mengisi cache sekali saat boot; sesudahnya bacaan gratis.
 *
 * Seperti di web, HANYA token yang disimpan — role & level selalu datang dari
 * `GET /me`, supaya tidak bisa dipalsukan dengan menyunting penyimpanan perangkat.
 */

const KEY = 'sampah.token';

/** Cache memori; `undefined` = belum pernah dimuat dari Keystore. */
let cached: string | null | undefined;

/**
 * Muat token dari Keystore ke cache. Wajib di-`await` sekali saat boot sebelum
 * permintaan pertama — kalau tidak, permintaan itu terkirim tanpa Authorization
 * dan sesi yang sebenarnya masih sah akan terbaca sebagai kedaluwarsa.
 */
export async function loadToken(): Promise<string | null> {
  try {
    const value = await SecureStore.getItemAsync(KEY);
    cached = value === null || value === '' ? null : value;
  } catch {
    // Keystore bermasalah (perangkat tanpa lock screen, dsb): perlakukan seperti belum masuk.
    cached = null;
  }
  return cached;
}

/** Token tersimpan, atau null. Sinkron — membaca cache, bukan Keystore. */
export function readToken(): string | null {
  return cached ?? null;
}

/** Simpan token setelah login berhasil. Cache diisi lebih dulu agar tak ada jeda. */
export async function writeToken(token: string): Promise<void> {
  cached = token;
  try {
    await SecureStore.setItemAsync(KEY, token);
  } catch {
    // Sesi tetap jalan lewat cache; hanya tidak bertahan setelah app ditutup.
  }
}

/** Buang token (keluar, atau token ditolak server). */
export async function clearToken(): Promise<void> {
  cached = null;
  try {
    await SecureStore.deleteItemAsync(KEY);
  } catch {
    // Tak ada yang bisa dilakukan; yang penting cache sudah kosong.
  }
}
