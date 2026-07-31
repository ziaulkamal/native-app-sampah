import { useApp } from '@/store/AppContext';
import type { Bill, Customer } from '@/types';

interface ActiveLocation {
  /** Titik layanan yang sedang dilihat; `undefined` bila pelanggan belum punya titik. */
  active: Customer | undefined;
  /** Seluruh titik milik pelanggan ini. */
  locations: Customer[];
  /** Pemilih lokasi hanya perlu muncul bila titiknya lebih dari satu. */
  multi: boolean;
  /** Tagihan milik titik aktif saja. */
  billsForActive: Bill[];
  select: (id: string) => void;
}

/**
 * Titik layanan aktif sisi pelanggan — porting `features/pelanggan/useActiveLocation.ts` web.
 *
 * Tagihan menempel ke **titik**, bukan ke orang, jadi beranda dan layar tagihan wajib
 * menyaring per titik. Pembayaran & aduan menempel ke orang, sehingga riwayat dan aduan
 * sengaja TIDAK ikut disaring di sini.
 */
export function useActiveLocation(): ActiveLocation {
  const { customers, bills, activeLocationId, setActiveLocation } = useApp();

  // Pilihan yang tak lagi ada (titik ditolak / data dimuat ulang) jangan menyisakan
  // layar kosong — jatuhkan kembali ke titik pertama.
  const active = customers.find((c) => c.id === activeLocationId) ?? customers[0];

  return {
    active,
    locations: customers,
    multi: customers.length > 1,
    billsForActive: active === undefined ? [] : bills.filter((b) => b.customerId === active.id),
    select: (id: string) => setActiveLocation(id),
  };
}
