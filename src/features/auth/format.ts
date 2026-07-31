import type { OtpChannel } from '@/api/types';

/** Buang selain angka lalu potong ke panjang maksimum — dipakai kolom NIK & kode. */
export const digitsOnly = (value: string, max: number): string =>
  value.replace(/\D/g, '').slice(0, max);

/**
 * Kanal OTP yang disimpulkan dari bentuk identitas: angka → WhatsApp, ada `@` → email.
 * `null` berarti identitas itu username petugas, yang tak punya tujuan kirim.
 */
export function otpChannelFor(identity: string): OtpChannel | null {
  const value = identity.trim();
  if (value === '') return null;
  if (value.includes('@')) return 'email';
  return /^[+0-9 ()-]+$/.test(value) && digitsOnly(value, 20).length >= 8 ? 'wa' : null;
}
