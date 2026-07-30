import { get, getPage, post } from './client';
import type { Page } from './envelope';
import type { BillDto } from './types';

/** Filter daftar tagihan yang didukung server. */
export interface BillFilter {
  status?: string;
  location?: string;
  /** Periode `YYYY-MM`. */
  period?: string;
  overdue?: boolean;
  page?: number;
  per_page?: number;
}

/** Seluruh tagihan (admin & petugas). */
export const listBills = (filter: BillFilter = {}): Promise<Page<BillDto>> =>
  getPage<BillDto>('/bills', { query: { ...filter, per_page: filter.per_page ?? 100 } });

/** Tagihan milik pelanggan yang sedang masuk. */
export const listMyBills = (filter: BillFilter = {}): Promise<Page<BillDto>> =>
  getPage<BillDto>('/my/bills', { query: { ...filter, per_page: filter.per_page ?? 100 } });

/** Tagihan satu titik layanan — dipakai layar penagihan petugas. */
export const listLocationBills = (locationId: string): Promise<BillDto[]> =>
  get<BillDto[]>(`/locations/${locationId}/bills`);

/** Terbitkan tagihan satu periode (`YYYY-MM`). Idempoten: dijalankan dua kali tidak menggandakan. */
export const generateBills = (period: string): Promise<{ created: number }> =>
  post<{ created: number }>('/bills/generate', { period });
