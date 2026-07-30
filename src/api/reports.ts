import { getEnvelope } from './client';
import type { CollectionRowDto, CollectionSummaryDto, RecapRowDto } from './types';

/** Penyaring dasbor status penagihan (§5). Kosong = seluruh titik layanan aktif. */
export interface CollectionFilters {
  period?: string;
  district_code?: string;
  village_code?: string;
  category_id?: string;
  zone_id?: string;
  status?: 'paid' | 'unpaid';
  q?: string;
  per_page?: number;
  /** Halaman ke-berapa (1-based); dibaca paginator Laravel langsung dari query. */
  page?: number;
}

export interface CollectionPage {
  rows: CollectionRowDto[];
  summary: CollectionSummaryDto;
  total: number;
}

/**
 * Status penagihan per titik layanan.
 *
 * Memakai `getEnvelope` karena justru `meta` yang dibutuhkan: `summary` dihitung server
 * atas **seluruh** hasil filter, bukan atas halaman yang tampil — menjumlahkannya di
 * klien akan menghasilkan angka yang berubah tiap kali pengguna pindah halaman.
 */
export async function collectionStatus(filters: CollectionFilters): Promise<CollectionPage> {
  const envelope = await getEnvelope<CollectionRowDto[]>('/reports/collection', {
    query: { ...filters },
  });
  const meta = envelope.meta as
    { summary?: CollectionSummaryDto; pagination?: { total?: number } } | undefined;

  return {
    rows: envelope.data,
    summary: meta?.summary ?? EMPTY_SUMMARY,
    total: meta?.pagination?.total ?? envelope.data.length,
  };
}

const EMPTY_SUMMARY: CollectionSummaryDto = {
  locations: 0,
  paid_locations: 0,
  unpaid_locations: 0,
  outstanding_amount: 0,
  penalty_amount: 0,
};

/** Pengelompokan rekap yang dikenali server; di luar ini ditolak 422. */
export type RecapGroup = 'month' | 'week' | 'district' | 'village' | 'operator' | 'category';

export interface RecapFilters {
  group_by: RecapGroup;
  from?: string;
  to?: string;
  district_code?: string;
  village_code?: string;
  operator_id?: string;
  category_id?: string;
}

export interface RecapResult {
  rows: RecapRowDto[];
  label: string;
  totalAmount: number;
}

export async function recap(filters: RecapFilters): Promise<RecapResult> {
  const envelope = await getEnvelope<RecapRowDto[]>('/reports/recap', { query: { ...filters } });
  const meta = envelope.meta as { label?: string; total_amount?: number } | undefined;

  return {
    rows: envelope.data,
    label: meta?.label ?? '',
    totalAmount: meta?.total_amount ?? 0,
  };
}
