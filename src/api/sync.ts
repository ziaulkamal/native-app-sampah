import { get } from './client';

/**
 * Cap keadaan tiap kumpulan data, plus lencana lonceng. Nilai capnya **buram** —
 * hanya dibandingkan dengan yang tersimpan, tak pernah ditafsirkan atau ditampilkan.
 */
export interface Pulse {
  /** Antrean pendaftar mandiri; hanya untuk dinas & petugas. */
  registrations?: string;
  locations?: string;
  people?: string;
  bills?: string;
  payments?: string;
  complaints?: string;
  deposits?: string;
  /** Ikut bergeser saat notifikasi ditandai terbaca, bukan hanya saat ada yang baru. */
  notifications?: string;
  /** Notifikasi belum terbaca — satu-satunya bidang yang selalu ada. */
  unread: number;
}

/** Satu permintaan kecil; server hanya menjalankan kueri agregat, tanpa memuat baris. */
export const readPulse = (): Promise<Pulse> => get<Pulse>('/sync/pulse');
