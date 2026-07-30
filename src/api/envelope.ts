import { ApiError, ERR_MALFORMED } from './errors';

/** Bentuk balasan tunggal backend (PRD §7): sukses & gagal memakai amplop yang sama. */
export interface Envelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: EnvelopeMeta;
}

/** Metadata opsional; halaman daftar selalu menyertakan `pagination`. */
export interface EnvelopeMeta {
  pagination?: Pagination;
  [key: string]: unknown;
}

/** Informasi halaman dari paginator Laravel. */
export interface Pagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

/** Daftar berhalaman yang sudah dipisah dari amplopnya. */
export interface Page<T> {
  data: T[];
  pagination: Pagination;
}

/**
 * Validasi amplop di batas: apa pun di luar bentuk yang disepakati ditolak sebagai
 * ERR_MALFORMED, bukan diteruskan sebagai `any` ke dalam aplikasi.
 */
export function parseEnvelope<T>(body: unknown, status: number): Envelope<T> {
  if (!isRecord(body) || typeof body.success !== 'boolean' || typeof body.message !== 'string') {
    throw new ApiError(ERR_MALFORMED, status, 'Balasan server tidak dikenali.');
  }
  return body as unknown as Envelope<T>;
}

/** Ambil `meta.pagination`; endpoint daftar tanpa paginator dianggap satu halaman penuh. */
export function pageOf<T>(envelope: Envelope<T[]>): Page<T> {
  const data = Array.isArray(envelope.data) ? envelope.data : [];
  const p = envelope.meta?.pagination;
  return {
    data,
    pagination: p ?? { current_page: 1, last_page: 1, per_page: data.length, total: data.length },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
