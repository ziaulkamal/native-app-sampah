import { del, get, post, put } from './client';
import type { BillingCycleDto } from './types';

/** Payload siklus penagihan. `unit` × `interval` menggantikan enum skema lama. */
export interface BillingCycleInput {
  name: string;
  unit: 'minggu' | 'bulan';
  interval: number;
  is_default?: boolean;
  status?: 'active' | 'inactive';
  description?: string | null;
}

export const listBillingCycles = (): Promise<BillingCycleDto[]> =>
  get<BillingCycleDto[]>('/billing-cycles');

export const createBillingCycle = (input: BillingCycleInput): Promise<BillingCycleDto> =>
  post<BillingCycleDto>('/billing-cycles', input);

export const updateBillingCycle = (
  id: string,
  input: Partial<BillingCycleInput>,
): Promise<BillingCycleDto> => put<BillingCycleDto>(`/billing-cycles/${id}`, input);

/** Ditolak server bila masih dipakai golongan (`ERR_CYCLE_IN_USE`) atau jadi bawaan. */
export const deleteBillingCycle = (id: string): Promise<null> => del<null>(`/billing-cycles/${id}`);

/**
 * Menerapkan siklus ke banyak golongan sekaligus.
 *
 * `'all'` dan daftar kosong sengaja berbeda: yang pertama berarti seluruh golongan,
 * yang kedua tidak satu pun. Menyamakannya membuat satu klik salah mengubah siklus
 * seluruh dinas.
 *
 * Hanya memengaruhi penerbitan **berikutnya** — tagihan yang sudah terbit adalah
 * snapshot dan tidak ikut berubah.
 */
export const applyBillingCycle = (
  id: string,
  categoryIds: string[] | 'all',
): Promise<{ affected: number }> =>
  post<{ affected: number }>(`/billing-cycles/${id}/apply`, { category_ids: categoryIds });
