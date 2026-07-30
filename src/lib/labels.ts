import type { BadgeTone } from '@/components/ui/Badge';
import type {
  BillingScheme,
  BillStatus,
  ComplaintStatus,
  CustomerStatus,
  LocationKind,
  PayMethod,
  PickupStatus,
  Tariff,
  TxStatus,
  VehicleType,
  Weekday,
} from '@/types';

/** Peta label domain → teks Indonesia + tone Badge. Dipakai lintas role. */

export const BILL_BADGE: Record<BillStatus, { label: string; tone: BadgeTone }> = {
  lunas: { label: 'LUNAS', tone: 'success' },
  belum_bayar: { label: 'BELUM BAYAR', tone: 'warning' },
  tunggakan: { label: 'TUNGGAKAN', tone: 'danger' },
};

/** Nama golongan dari daftar tarif (golongan dinamis). */
export const golonganName = (tariffs: Tariff[], id: string): string =>
  tariffs.find((t) => t.id === id)?.name ?? '—';

/** Abu-abu untuk titik yang golongannya belum ditetapkan admin saat verifikasi. */
const UNSET_COLOR = '#9a9a92';

/** Warna marker & legenda peta — mengikuti golongan, sesuai model server. */
export const golonganColor = (tariffs: Tariff[], id: string): string =>
  tariffs.find((t) => t.id === id)?.color ?? UNSET_COLOR;

/** Jenis titik layanan sesuai enum server. */
export const LOCATION_KIND: Record<LocationKind, string> = {
  rumah: 'Rumah',
  usaha: 'Usaha',
  fasilitas: 'Fasilitas umum',
};

export const SCHEME_LABEL: Record<BillingScheme, string> = {
  mingguan: 'Mingguan',
  dua_mingguan: '2 Mingguan',
  tiga_mingguan: '3 Mingguan',
  bulanan: 'Bulanan',
};

export const SCHEME_SUFFIX: Record<BillingScheme, string> = {
  mingguan: '/mgg',
  dua_mingguan: '/2mgg',
  tiga_mingguan: '/3mgg',
  bulanan: '/bln',
};

/** Faktor perkiraan konversi tarif per-skema ke per-bulan (untuk potensi). */
export const SCHEME_MONTHLY: Record<BillingScheme, number> = {
  mingguan: 4.33,
  dua_mingguan: 2.17,
  // Dua periode per bulan (hari 1–21 lalu 22–akhir), bukan 30/21 ≈ 1,43: periode tidak
  // pernah menyeberang bulan, jadi setahun terbit 24 tagihan — bukan ~17.
  tiga_mingguan: 2,
  bulanan: 1,
};

export const CUSTOMER_STATUS: Record<CustomerStatus, { label: string; tone: BadgeTone }> = {
  menunggu: { label: 'MENUNGGU PERSETUJUAN', tone: 'warning' },
  aktif: { label: 'AKTIF', tone: 'success' },
  nonaktif: { label: 'NONAKTIF', tone: 'neutral' },
  ditangguhkan: { label: 'DITANGGUHKAN', tone: 'warning' },
};

export const PICKUP_STATUS: Record<PickupStatus, { label: string; tone: BadgeTone }> = {
  terjadwal: { label: 'TERJADWAL', tone: 'info' },
  proses: { label: 'BERLANGSUNG', tone: 'warning' },
  selesai: { label: 'SELESAI', tone: 'success' },
};

export const COMPLAINT_STATUS: Record<ComplaintStatus, { label: string; tone: BadgeTone }> = {
  baru: { label: 'BARU', tone: 'danger' },
  diproses: { label: 'DIPROSES', tone: 'warning' },
  selesai: { label: 'SELESAI', tone: 'success' },
};

export const TX_STATUS: Record<TxStatus, { label: string; tone: BadgeTone }> = {
  selesai: { label: 'SELESAI', tone: 'success' },
  menunggu: { label: 'MENUNGGU', tone: 'warning' },
  tertunggak: { label: 'TERTUNGGAK', tone: 'danger' },
};

export const PAY_METHOD: Record<PayMethod, string> = {
  tunai: 'Tunai',
  transfer: 'Transfer',
  qris: 'QRIS',
};

/** Badge jenis kendaraan operator (label + tone Badge). */
export const VEHICLE_TYPE: Record<VehicleType, { label: string; tone: BadgeTone }> = {
  mobil: { label: 'MOBIL', tone: 'info' },
  becak: { label: 'BECAK', tone: 'warning' },
};

/** Hari angkut: urutan Senin–Minggu + label pendek/panjang. */
export const WEEKDAYS: { id: Weekday; short: string; long: string }[] = [
  { id: 'senin', short: 'Sen', long: 'Senin' },
  { id: 'selasa', short: 'Sel', long: 'Selasa' },
  { id: 'rabu', short: 'Rab', long: 'Rabu' },
  { id: 'kamis', short: 'Kam', long: 'Kamis' },
  { id: 'jumat', short: 'Jum', long: 'Jumat' },
  { id: 'sabtu', short: 'Sab', long: 'Sabtu' },
  { id: 'minggu', short: 'Min', long: 'Minggu' },
];

/** Ringkas daftar hari terpilih ke label pendek gabungan, mis. "Sen · Kam". */
export const daysSummary = (days: Weekday[]): string =>
  WEEKDAYS.filter((w) => days.includes(w.id))
    .map((w) => w.short)
    .join(' · ');
