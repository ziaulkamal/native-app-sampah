import type { DataState, Session } from '@/types';

/** Bagian state yang menyangkut sesi pengguna dan proses masuknya. */
export interface SessionSlice {
  /** Pengguna aktif; null berarti belum masuk. */
  session: Session | null;
  /** Keadaan permintaan auth terakhir (memuat / gagal / normal). */
  authState: DataState;
  /** Pesan galat auth terakhir, sudah ter-lokalisasi server. */
  authError: string | null;
  /** Galat per-field dari validasi 422, mis. `{ identity_number: ['NIK sudah terdaftar.'] }`. */
  authFieldErrors: Record<string, string[]> | null;
  /** Token tersimpan sudah selesai diperiksa; sebelum ini UI menampilkan splash. */
  booted: boolean;
}

export const initialSession: SessionSlice = {
  session: null,
  authState: 'normal',
  authError: null,
  authFieldErrors: null,
  booted: false,
};

// `homeForRole` milik web tidak ikut: layar awal tiap role kini ditentukan
// `navigation/RootNavigator.tsx` lewat navigator mana yang dipasang.
