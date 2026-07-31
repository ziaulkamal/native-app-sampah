import type { BrandingDto } from '@/api/branding';

/** Identitas aplikasi sebagaimana dipakai view — sudah pasti terisi, tak ada `undefined`. */
export interface Branding {
  appName: string;
  tagline: string | null;
  description: string | null;
  footerCredit: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
}

/**
 * Merek yang dipakai sebelum server menjawab — dan tetap dipakai bila ia tak pernah
 * menjawab.
 *
 * Layar masuk tidak boleh menampilkan kotak kosong hanya karena satu permintaan lambat
 * atau server sedang mati: yang datang dari API adalah penggantinya, bukan syaratnya.
 * Nilainya sengaja sama dengan bawaan di `config/settings.php` sisi server.
 */
export const BRANDING_FALLBACK: Branding = {
  appName: 'Si Mudah',
  tagline: 'Management Restribusi DLH',
  description: null,
  footerCredit: null,
  logoUrl: null,
  faviconUrl: null,
};

/** DTO → bentuk view. Nama kosong jatuh ke bawaan; layar tanpa nama tak masuk akal. */
export function toBranding(dto: BrandingDto): Branding {
  return {
    appName: dto.app_name.trim() === '' ? BRANDING_FALLBACK.appName : dto.app_name,
    tagline: dto.tagline,
    description: dto.description,
    footerCredit: dto.footer_credit,
    logoUrl: dto.logo_url,
    faviconUrl: dto.favicon_url,
  };
}

/** Merek lengkap untuk satu baris, mis. "Dinas Kebersihan · Retribusi". */
export const brandLine = (branding: Branding): string =>
  branding.tagline === null || branding.tagline.trim() === ''
    ? branding.appName
    : `${branding.appName} · ${branding.tagline}`;
