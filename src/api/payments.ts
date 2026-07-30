import { getPage, post } from './client';
import type { Page } from './envelope';
import type { PaymentDto } from './types';

/** Metode yang boleh dipilih klien; setoran kas kantor dicatat lewat jalur lain. */
export type PayMethodDto = 'tunai_kantor' | 'tunai_petugas' | 'transfer_manual' | 'qris';

export interface PaymentFilter {
  status?: string;
  method?: string;
  page?: number;
  per_page?: number;
}

/** Riwayat pembayaran seluruh pelanggan (admin & petugas). */
export const listPayments = (filter: PaymentFilter = {}): Promise<Page<PaymentDto>> =>
  getPage<PaymentDto>('/payments', { query: { ...filter, per_page: filter.per_page ?? 100 } });

/** Riwayat pembayaran pelanggan yang sedang masuk. */
export const listMyPayments = (filter: PaymentFilter = {}): Promise<Page<PaymentDto>> =>
  getPage<PaymentDto>('/my/payments', { query: { ...filter, per_page: filter.per_page ?? 100 } });

/**
 * Buat pembayaran atas sekumpulan tagihan. Server menolak bila melompati tagihan
 * yang lebih lama (ERR_BILL_ORDER) — pelunasan wajib berurutan per titik layanan.
 */
export const createPayment = (method: PayMethodDto, billIds: string[]): Promise<PaymentDto> =>
  post<PaymentDto>('/payments', { method, bill_ids: billIds });

/** Verifikasi pembayaran non-tunai; di sinilah tagihan menjadi lunas & kwitansi terbit. */
export const verifyPayment = (id: string): Promise<PaymentDto> =>
  post<PaymentDto>(`/payments/${id}/verify`);

/**
 * Petugas menerima pengajuan bayar tunai dari pelanggan (§10.2).
 *
 * Inilah langkah yang mengubah niat membayar jadi penerimaan kas: sesudahnya
 * `collected_by` adalah petugas itu, dan kas tersebut jadi bagian setorannya ke dinas.
 * Server menolak bila titiknya di luar cakupan petugas.
 */
export const acceptPayment = (id: string): Promise<PaymentDto> =>
  post<PaymentDto>(`/payments/${id}/accept`);

export const rejectPayment = (id: string, note: string): Promise<PaymentDto> =>
  post<PaymentDto>(`/payments/${id}/reject`, { note });
