import { del, get, post, put } from './client';
import type { CategoryDto, CategoryOptionDto } from './types';

/**
 * Payload golongan retribusi.
 *
 * `billing_cycle_id` yang menentukan periode penagihan sejak §6; `scheme` tinggal
 * turunannya dan diisi server dari siklus bila keduanya dikirim.
 */
export interface CategoryInput {
  name: string;
  amount: number;
  scheme?: CategoryDto['scheme'];
  billing_cycle_id?: string | null;
  description?: string;
}

/** Golongan retribusi — dasar tarif tagihan sekaligus legenda warna peta. */
export const listCategories = (): Promise<CategoryDto[]> => get<CategoryDto[]>('/categories');

/**
 * Golongan aktif **tanpa tarif**, untuk pelanggan yang mengusulkan golongan titiknya.
 *
 * Rute terpisah, bukan `listCategories()` yang dipangkas di layar: `/categories` hanya
 * boleh dibaca dinas, dan pelanggan yang memanggilnya akan mendapat 403 — sekaligus
 * memastikan nominalnya tak pernah singgah di peramban pengaju.
 */
export const listCategoryOptions = (): Promise<CategoryOptionDto[]> =>
  get<CategoryOptionDto[]>('/categories/options');

export const createCategory = (input: CategoryInput): Promise<CategoryDto> =>
  post<CategoryDto>('/categories', input);

export const updateCategory = (id: string, input: Partial<CategoryInput>): Promise<CategoryDto> =>
  put<CategoryDto>(`/categories/${id}`, input);

/** Ditolak server (ERR_CATEGORY_IN_USE) bila masih dipakai titik layanan. */
export const deleteCategory = (id: string): Promise<null> => del<null>(`/categories/${id}`);
