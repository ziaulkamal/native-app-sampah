import { API_CLIENT_KEY, API_LOCALE, apiUrl } from './config';
import { type Envelope, type Page, pageOf, parseEnvelope } from './envelope';
import { ApiError, toApiError } from './errors';
import { clearToken, readToken } from './tokenStore';

/**
 * Klien API — porting `src/api/client.ts` web. Bentuk fungsi dan penanganan amplop
 * dipertahankan persis supaya seluruh modul endpoint bisa dipindah tanpa disunting.
 *
 * Tiga penyesuaian untuk RN, semuanya di bawah permukaan:
 * - `clearToken()` kini asinkron; di jalur penolakan ia ditembakkan tanpa ditunggu,
 *   karena yang mendesak adalah melempar galatnya, bukan menunggu Keystore.
 * - `download()` milik web (ekspor CSV, layar admin) tidak ikut — di luar lingkup
 *   Pelanggan & Operator. Penggantinya `fileHeaders()`, untuk berkas ber-bearer.
 * - `AbortSignal` tetap dipakai; RN 0.86 mendukungnya penuh.
 */

/** Nilai query string; `undefined`/`null` dibuang agar filter kosong tidak terkirim. */
export type Query = Record<string, string | number | boolean | undefined | null>;

/** Opsi satu permintaan. `body` berupa objek (JSON) atau FormData (unggahan berkas). */
export interface RequestOptions {
  query?: Query;
  body?: unknown;
  signal?: AbortSignal;
}

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

let onSessionExpired: (() => void) | null = null;

/** Pasang penangan saat server menolak token; dipakai store untuk mengakhiri sesi. */
export function setSessionExpiredHandler(handler: () => void): void {
  onSessionExpired = handler;
}

/** GET satu objek. */
export const get = <T>(path: string, opts?: RequestOptions): Promise<T> =>
  unwrap<T>('GET', path, opts);

/** GET daftar berhalaman (`data` + `meta.pagination`). */
export async function getPage<T>(path: string, opts?: RequestOptions): Promise<Page<T>> {
  return pageOf(await send<T[]>('GET', path, opts));
}

/** GET yang ikut membawa `meta` — dipakai saat metadatanya sendiri yang dibutuhkan. */
export const getEnvelope = <T>(path: string, opts?: RequestOptions): Promise<Envelope<T>> =>
  send<T>('GET', path, opts);

/** POST; kembalikan `data`. */
export const post = <T>(path: string, body?: unknown, opts?: RequestOptions): Promise<T> =>
  unwrap<T>('POST', path, { ...opts, body });

/** PUT; kembalikan `data`. */
export const put = <T>(path: string, body?: unknown, opts?: RequestOptions): Promise<T> =>
  unwrap<T>('PUT', path, { ...opts, body });

/** DELETE; kembalikan `data`. */
export const del = <T>(path: string, opts?: RequestOptions): Promise<T> =>
  unwrap<T>('DELETE', path, opts);

/**
 * Header untuk mengambil berkas milik server (KTP, foto profil, logo).
 *
 * Dibutuhkan karena backend mengalirkan isi berkas di balik bearer token, bukan
 * sebagai URL bertanda tangan — keputusan yang disengaja di sisi server supaya
 * tautan KTP tidak bisa disalin ke perangkat lain. Konsekuensinya di sini:
 * `<Image source={{ uri }} />` polos akan menerima 401. Yang benar:
 *
 *   <Image source={{ uri: apiUrl('/documents/1/content'), headers: fileHeaders() }} />
 */
export function fileHeaders(): Record<string, string> {
  const token = readToken();
  return token === null ? {} : { Authorization: `Bearer ${token}` };
}

async function unwrap<T>(method: Method, path: string, opts?: RequestOptions): Promise<T> {
  return (await send<T>(method, path, opts)).data;
}

async function send<T>(
  method: Method,
  path: string,
  opts: RequestOptions = {},
): Promise<Envelope<T>> {
  const response = await dispatch(method, path, opts);
  const envelope = parseEnvelope<T>(await decode(response), response.status);
  if (response.ok && envelope.success) return envelope;
  throw reject(envelope, response.status);
}

async function dispatch(method: Method, path: string, opts: RequestOptions): Promise<Response> {
  try {
    return await fetch(withQuery(apiUrl(path), opts.query), {
      method,
      headers: headersFor(opts.body),
      body: encode(opts.body),
      signal: opts.signal,
    });
  } catch (cause) {
    // Fetch hanya melempar untuk kegagalan transport (server mati, sinyal putus, dibatalkan).
    throw toApiError(cause);
  }
}

/** Ubah amplop gagal jadi ApiError; token yang ditolak sekaligus mengakhiri sesi. */
function reject(envelope: Envelope<unknown>, status: number): ApiError {
  const body = envelope as unknown as { code?: unknown; errors?: unknown };
  const code = typeof body.code === 'string' ? body.code : `ERR_HTTP_${status}`;
  if (code === 'ERR_UNAUTHENTICATED') {
    // Sengaja tidak ditunggu: cache token sudah dikosongkan di baris pertama
    // clearToken(), jadi permintaan berikutnya sudah aman sebelum Keystore selesai.
    void clearToken();
    onSessionExpired?.();
  }
  return new ApiError(code, status, envelope.message, fieldErrors(body.errors));
}

function fieldErrors(value: unknown): Record<string, string[]> | undefined {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, string[]>)
    : undefined;
}

function headersFor(body: unknown): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Accept-Language': API_LOCALE,
  };
  // FormData menentukan Content-Type sendiri (butuh boundary) — jangan ditimpa.
  if (body !== undefined && !(body instanceof FormData))
    headers['Content-Type'] = 'application/json';
  if (API_CLIENT_KEY !== '') headers['X-Client-Key'] = API_CLIENT_KEY;
  const token = readToken();
  if (token !== null) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function encode(body: unknown): BodyInit | undefined {
  if (body === undefined) return undefined;
  return body instanceof FormData ? body : JSON.stringify(body);
}

function withQuery(url: string, query?: Query): string {
  if (query === undefined) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') params.append(key, String(value));
  }
  const qs = params.toString();
  return qs === '' ? url : `${url}?${qs}`;
}

/** Balasan 204 tidak punya badan; samakan bentuknya dengan amplop sukses kosong. */
async function decode(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text === '') return { success: response.ok, message: '', data: null };
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
