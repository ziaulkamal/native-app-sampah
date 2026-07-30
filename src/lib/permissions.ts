import type { FeatureKey, ScreenId, Session } from '@/types';

/**
 * Penyaring menu & layar berdasarkan izin fitur (§22).
 *
 * Ini **bukan** penguncian: yang mengunci adalah middleware `feature:` di server, dan
 * setiap layar di sini tetap akan ditolak 403 kalau dipanggil tanpa izin. Gunanya
 * menutup jalan yang sudah pasti buntu — menawarkan menu yang selalu gagal membuat
 * orang mengira aplikasinya rusak, bukan kewenangannya yang kurang.
 */

const FEATURE_KEYS: FeatureKey[] = [
  'settings.manage',
  'wilayah.manage',
  'billing.monitor',
  'tariff.manage',
  'billing_cycle.manage',
];

/** Kunci dari server disaring ke kunci yang benar-benar dikenal klien versi ini. */
export function toFeatureKeys(values: readonly string[] | undefined): FeatureKey[] {
  return FEATURE_KEYS.filter((key) => values?.includes(key) === true);
}

/**
 * Layar yang butuh izin fitur. Satu peta dipakai bersama oleh sidebar (menyembunyikan)
 * dan router (menolak) — dua daftar terpisah akan menyimpang cepat atau lambat, dan
 * yang menyimpang justru menghasilkan menu yang tampil tapi layarnya kosong.
 *
 * Layar yang tidak terdaftar di sini terbuka untuk seluruh admin dinas.
 */
export const SCREEN_FEATURE: Partial<Record<ScreenId, FeatureKey>> = {
  pengaturan: 'settings.manage',
  masterWilayah: 'wilayah.manage',
  tagihanDash: 'billing.monitor',
  tarif: 'tariff.manage',
  siklus: 'billing_cycle.manage',
};

/** Akun boleh membuka fitur ini? Tanpa sesi selalu tidak. */
export function hasFeature(session: Session | null, feature: FeatureKey): boolean {
  return session?.permissions.includes(feature) === true;
}

/** Layar boleh dibuka akun ini? Layar tanpa izin khusus selalu boleh. */
export function mayOpenScreen(session: Session | null, screen: ScreenId): boolean {
  const feature = SCREEN_FEATURE[screen];
  return feature === undefined || hasFeature(session, feature);
}
