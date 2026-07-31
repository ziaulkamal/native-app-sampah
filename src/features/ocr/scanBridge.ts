import type { KtpScan } from './ktpParser';

/** Hasil pindai beserta foto yang dibacanya — foto itu pula yang nanti diunggah. */
export interface ScanHandoff extends KtpScan {
  photoUri: string;
}

/**
 * Titipan hasil pindai antara layar pemindai dan formulir pendaftaran.
 *
 * Tidak lewat `navigation.navigate(..., params)`: React Navigation menyimpan params
 * di state navigasi yang bisa diserialkan dan dipulihkan setelah aplikasi dimatikan
 * sistem — NIK hasil pindai tak boleh ikut bertahan di sana. Variabel modul ini mati
 * bersama prosesnya, dan `takeLastScan` mengosongkannya begitu dibaca.
 */
let last: ScanHandoff | null = null;

export function setLastScan(scan: KtpScan, photoUri: string): void {
  last = { ...scan, photoUri };
}

/** Ambil sekali pakai; pemanggil berikutnya mendapat `null`. */
export function takeLastScan(): ScanHandoff | null {
  const value = last;
  last = null;
  return value;
}
