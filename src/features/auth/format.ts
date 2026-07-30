/** Buang selain angka lalu potong ke panjang maksimum — dipakai kolom NIK & kode. */
export const digitsOnly = (value: string, max: number): string =>
  value.replace(/\D/g, '').slice(0, max);
