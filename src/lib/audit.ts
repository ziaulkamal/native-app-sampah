/**
 * Kamus jejak audit, dipakai bersama oleh riwayat satu pelanggan
 * (`RiwayatPerubahan`) dan jejak seluruh sistem (`JejakAudit`).
 *
 * Dulu kamusnya hanya ada di layar pelanggan, jadi hanya peristiwa yang menempel
 * pada seseorang yang pernah diberi nama. Peristiwa lain — penyimpanan dibersihkan,
 * kata sandi direset — tetap tercatat di server tapi tak punya sebutan di mana pun.
 */

/** Kelompok peristiwa; awalan sebelum titik pertama pada nama peristiwa. */
export interface EventGroup {
  id: string;
  label: string;
}

export const EVENT_GROUPS: EventGroup[] = [
  { id: 'people', label: 'Pelanggan' },
  { id: 'location', label: 'Titik layanan' },
  { id: 'user', label: 'Akun' },
  { id: 'payment', label: 'Pembayaran' },
  { id: 'deposit', label: 'Setoran' },
  { id: 'complaint', label: 'Aduan' },
  { id: 'bills', label: 'Tagihan' },
  { id: 'billing_cycle', label: 'Siklus penagihan' },
  { id: 'document', label: 'Berkas' },
  { id: 'wilayah', label: 'Master wilayah' },
  { id: 'storage', label: 'Penyimpanan' },
  { id: 'branding', label: 'Tampilan' },
];

/** Nama manusiawi tiap peristiwa jejak audit. */
export const EVENT_LABEL: Record<string, string> = {
  'people.updated': 'Biodata diperbarui',
  'people.verified': 'Pelanggan diverifikasi',
  'people.rejected': 'Pendaftar ditolak & datanya dihapus',
  'people.self_registered': 'Mendaftar mandiri',
  'people.identity_revealed': 'NIK dibuka',
  'people.avatar_updated': 'Foto profil diganti',
  'people.status.active': 'Status diubah jadi aktif',
  'people.status.inactive': 'Status diubah jadi nonaktif',
  'people.status.suspended': 'Status diubah jadi ditangguhkan',
  'location.verified': 'Titik layanan diverifikasi',
  'user.password_reset': 'Kata sandi direset',
  'user.permissions_updated': 'Hak akses fitur diubah',
  'user.two_factor_issued': '2FA diterbitkan',
  'user.suspended': 'Akun ditangguhkan',
  'user.activated': 'Akun diaktifkan kembali',
  'payment.verified': 'Pembayaran diverifikasi',
  'payment.rejected': 'Pembayaran ditolak',
  'deposit.submitted': 'Setoran kas diajukan',
  'complaint.submitted': 'Aduan dikirim pelanggan',
  'bills.generated': 'Tagihan diterbitkan',
  'billing_cycle.applied': 'Siklus penagihan diterapkan',
  'document.viewed': 'Berkas dibuka',
  'wilayah.created': 'Wilayah ditambahkan',
  'wilayah.updated': 'Wilayah diubah',
  'wilayah.deleted': 'Wilayah dihapus',
  'storage.purged': 'Penyimpanan dibersihkan',
  'storage.reset': 'Penyimpanan direset',
  'branding.asset_stored': 'Logo/ikon diganti',
  'branding.asset_removed': 'Logo/ikon dihapus',
};

/** Nama manusiawi kolom biodata, dipakai membaca ringkasan perubahan. */
export const FIELD_LABEL: Record<string, string> = {
  full_name: 'Nama lengkap',
  identity_number: 'NIK',
  identity_hash: 'NIK',
  phone_number: 'Telepon',
  email: 'Email',
  birth_place: 'Tempat lahir',
  birthdate: 'Tanggal lahir',
  gender: 'Jenis kelamin',
  street_address: 'Alamat',
  rt: 'RT',
  rw: 'RW',
  postal_code: 'Kode pos',
  province_code: 'Provinsi',
  regency_code: 'Kabupaten/kota',
  district_code: 'Kecamatan',
  village_code: 'Desa/kelurahan',
  avatar_path: 'Foto profil',
  status: 'Status',
  reason: 'Alasan',
};

/**
 * Sebutan peristiwa. Yang belum punya nama dipulangkan apa adanya, bukan diganti
 * "tidak dikenal": nama teknisnya masih bisa ditelusuri ke kode, sedangkan
 * placeholder menghapus satu-satunya petunjuk yang tersisa.
 */
export const eventLabel = (event: string): string => EVENT_LABEL[event] ?? event;

/** Tanggal + jam ringkas; jejak audit perlu jam, bukan hanya tanggal. */
export function formatMoment(iso: string | null): string {
  if (iso === null) return '-';
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return iso;

  return at.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
