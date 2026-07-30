import { getPage } from './client';
import type { Page } from './envelope';
import type { AuditActivityDto } from './types';

/**
 * Penyaring jejak audit. Semuanya opsional — tanpa satu pun, yang dipulangkan
 * adalah halaman pertama seluruh kejadian, terbaru dulu.
 */
export interface ActivityFilter {
  /** Cocokkan nama peristiwa **atau** nama pelakunya. */
  q?: string;
  /** Satu peristiwa persis, mis. `people.identity_revealed`. */
  event?: string;
  /** Awalan kelompok, mis. `people` mencakup seluruh `people.*`. */
  group?: string;
  causer_id?: string;
  /** Tanggal `YYYY-MM-DD`, inklusif di kedua ujung. */
  from?: string;
  to?: string;
  page?: number;
  per_page?: number;
}

/**
 * Jejak audit seluruh sistem. Hanya Super Admin yang dilayani — akun lain
 * menerima 403 dari server, jadi layar pemanggilnya tak perlu menebak-nebak.
 */
export const listActivities = (filter: ActivityFilter = {}): Promise<Page<AuditActivityDto>> =>
  getPage<AuditActivityDto>('/activities', { query: { ...filter } });
