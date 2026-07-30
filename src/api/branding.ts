import { del, get } from './client';

/**
 * Identitas aplikasi (§28) — nama, lambang, dan kredit yang tampil di seluruh layar.
 *
 * Satu-satunya DTO yang dibaca **tanpa token**: layar masuk dirender sebelum ada sesi,
 * jadi mereknya harus bisa diambil lebih dulu. URL-nya sudah siap dipasang di `src` /
 * `href`; path objek maupun nama disk tidak pernah ikut terkirim.
 */
export interface BrandingDto {
  app_name: string;
  tagline: string | null;
  description: string | null;
  footer_credit: string | null;
  logo_url: string | null;
  favicon_url: string | null;
}

/** Jenis aset identitas yang dikenal server; bukan path bebas. */
export type BrandingKind = 'logo' | 'favicon';

/**
 * Identitas aplikasi — **publik, tanpa token**.
 *
 * `get()` aman dipanggil tanpa sesi: `headersFor` hanya memasang `Authorization`
 * bila ada token tersimpan. Jadi tidak perlu varian khusus, dan pemanggilan ini
 * tidak akan pernah memicu penutupan sesi karena 401.
 */
export const readBranding = (): Promise<BrandingDto> => get<BrandingDto>('/branding');

/** Mengembalikan satu aset ke lambang bawaan aplikasi. */
export const deleteBrandingAsset = (kind: BrandingKind): Promise<BrandingDto> =>
  del<BrandingDto>(`/settings/branding/asset/${kind}`);
