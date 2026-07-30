import type { KtpScan } from './ktpParser';

/**
 * Titipan hasil pindai antara layar pemindai dan formulir pendaftaran.
 *
 * Tidak lewat `navigation.navigate(..., params)`: React Navigation menyimpan params
 * di state navigasi yang bisa diserialkan dan dipulihkan setelah aplikasi dimatikan
 * sistem — NIK hasil pindai tak boleh ikut bertahan di sana. Variabel modul ini mati
 * bersama prosesnya, dan `takeLastScan` mengosongkannya begitu dibaca.
 */
let last: KtpScan | null = null;

export function setLastScan(scan: KtpScan): void {
  last = scan;
}

/** Ambil sekali pakai; pemanggil berikutnya mendapat `null`. */
export function takeLastScan(): KtpScan | null {
  const value = last;
  last = null;
  return value;
}
