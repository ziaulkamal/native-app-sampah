import type { Role } from '@/types';

/**
 * Rute tujuan tiap jenis notifikasi — porting `notificationTarget.ts` web.
 *
 * Bentuknya berubah dari satu `ScreenId` jadi pasangan `{ tab, screen }`: React
 * Navigation menuntut tab induk disebut lebih dulu sebelum layar di dalamnya.
 *
 * Jenis untuk role `admin` tak ikut — konsolnya tetap di web, dan menyimpan tujuan
 * ke layar yang tidak ada di APK ini hanya melahirkan rute mati.
 */
export interface NotificationTarget {
  tab: string;
  screen: string;
}

const TARGET: Record<string, { role: Role } & NotificationTarget> = {
  cash_payment_requested: { role: 'operator', tab: 'Tagih', screen: 'OperatorPenagihan' },
  deposit_reviewed: { role: 'operator', tab: 'Beranda', screen: 'OperatorSetor' },
  payment_reviewed: { role: 'pelanggan', tab: 'Tagihan', screen: 'PelangganRiwayat' },
  // Disetujui maupun ditolak sama-sama berakhir di beranda: titik yang aktif tampil di
  // petanya, dan titik yang ditolak sudah tak punya barisnya sendiri untuk dituju.
  location_reviewed: { role: 'pelanggan', tab: 'Beranda', screen: 'PelangganHome' },
};

/**
 * `null` bila jenisnya tak dikenal atau bukan untuk role ini. Notifikasinya tetap
 * ditandai terbaca — hanya perpindahan layarnya yang dilewati.
 */
export function targetForNotification(type: string, role: Role): NotificationTarget | null {
  const target = TARGET[type];
  if (target === undefined || target.role !== role) return null;
  return { tab: target.tab, screen: target.screen };
}
