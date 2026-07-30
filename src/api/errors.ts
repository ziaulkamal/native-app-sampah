/** Galat terstruktur dari backend + galat jaringan, dengan kode mesin yang stabil. */

/** Kode sintetis klien — dipakai saat permintaan tidak pernah sampai ke server. */
export const ERR_NETWORK = 'ERR_NETWORK';

/** Kode sintetis klien — respons datang tapi bukan envelope yang dikenali. */
export const ERR_MALFORMED = 'ERR_MALFORMED';

/** Galat API. `code` stabil untuk percabangan logika; `message` sudah ter-lokalisasi server. */
export class ApiError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
    message: string,
    /** Galat per-field dari validasi 422. */
    readonly errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** Token tidak ada/kedaluwarsa — pemanggil wajib mengakhiri sesi. */
  get isUnauthenticated(): boolean {
    return this.code === 'ERR_UNAUTHENTICATED';
  }

  /** Sandi sudah benar, server menunggu kode TOTP Super Admin. */
  get isTwoFactorRequired(): boolean {
    return this.code === 'ERR_2FA_REQUIRED';
  }

  /** Pesan galat field pertama, untuk ditempel di bawah input. */
  fieldError(field: string): string | undefined {
    return this.errors?.[field]?.[0];
  }
}

/** Bungkus apa pun yang tertangkap jadi ApiError agar pemanggil punya satu bentuk. */
export function toApiError(cause: unknown): ApiError {
  if (cause instanceof ApiError) return cause;
  return new ApiError(ERR_NETWORK, 0, 'Tidak dapat menghubungi server. Periksa koneksi Anda.');
}
