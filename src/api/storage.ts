import { del, get, post } from './client';

/** Pemakaian penyimpanan satu kelompok berkas. */
export interface StoragePrefixUsageDto {
  prefix: string;
  objects: number;
  bytes: number;
}

export interface StorageUsageDto {
  prefixes: StoragePrefixUsageDto[];
  objects: number;
  bytes: number;
}

/** Ringkasan setelah pengosongan: berapa objek lenyap dan berapa baris ikut dibersihkan. */
export interface StoragePurgeDto {
  prefix?: string;
  objects: number;
  records: number;
}

/**
 * Tata kelola object storage — seluruhnya Super Admin bawaan env.
 *
 * Yang lenyap lewat berkas ini adalah KTP warga dan tak ada tombol urung, jadi tiap
 * fungsinya sengaja dibuat sulit dipanggil tanpa sengaja: kelompok berkas berupa
 * daftar tertutup, dan reset total menuntut nama bucket diketik ulang.
 */
export const readStorageUsage = (): Promise<StorageUsageDto> =>
  get<StorageUsageDto>('/settings/storage');

export const purgeStoragePrefix = (prefix: string): Promise<StoragePurgeDto> =>
  del<StoragePurgeDto>(`/settings/storage/${prefix}`);

/** `confirm` wajib sama persis dengan nama bucket; selisih apa pun dibalas 422. */
export const resetStorage = (confirm: string): Promise<StoragePurgeDto> =>
  post<StoragePurgeDto>('/settings/storage/reset', { confirm });
