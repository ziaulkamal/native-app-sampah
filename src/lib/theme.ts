import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Preferensi tema. Padanan `lib/theme.ts` di web, dengan dua beda yang disengaja:
 * penyimpanannya asinkron, dan "belum pernah memilih" dibedakan dari "memilih terang".
 *
 * Web selalu punya nilai (terang jadi bawaan), sedangkan di ponsel ada tema sistem
 * yang pantas diikuti sampai orangnya benar-benar memilih sendiri. Karena itu
 * kembaliannya `null`, bukan `false`.
 */

const KEY = 'sampah.dark';

/** `true`/`false` bila sudah pernah memilih, `null` bila masih ikut tema sistem. */
export async function readDarkPref(): Promise<boolean | null> {
  try {
    const value = await AsyncStorage.getItem(KEY);
    return value === null ? null : value === '1';
  } catch {
    // Penyimpanan bermasalah bukan alasan menahan aplikasi; ikut tema sistem saja.
    return null;
  }
}

export async function writeDarkPref(dark: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, dark ? '1' : '0');
  } catch {
    // Pilihannya tetap berlaku di sesi ini, hanya tidak bertahan setelah app ditutup.
  }
}
