import { del, get, getPage, post, put } from './client';
import type { Page } from './envelope';
import type {
  BankAccountDto,
  CashOnHandDto,
  ComplaintDto,
  DepositDto,
  DukcapilProbeDto,
  MapLegendDto,
  MapPointDto,
  ReportSummaryDto,
  UserDto,
  WilayahDto,
} from './types';

/* ── Aduan ─────────────────────────────────────────────────────────────────── */

export const listComplaints = (status?: string): Promise<Page<ComplaintDto>> =>
  getPage<ComplaintDto>('/complaints', { query: { status, per_page: 100 } });

export const listMyComplaints = (): Promise<Page<ComplaintDto>> =>
  getPage<ComplaintDto>('/my/complaints', { query: { per_page: 100 } });

export const createComplaint = (
  type: string,
  description: string,
  locationId?: string,
): Promise<ComplaintDto> =>
  post<ComplaintDto>('/complaints', { type, description, service_location_id: locationId });

export const setComplaintStatus = (
  id: string,
  status: ComplaintDto['status'],
): Promise<ComplaintDto> => put<ComplaintDto>(`/complaints/${id}/status`, { status });

/* ── Petugas (akun level 2) ────────────────────────────────────────────────── */

export interface UserInput {
  name: string;
  username: string;
  password?: string;
  phone?: string | null;
  role_id: string;
  vehicle_type?: string | null;
  /** Hanya pada pembaruan. Akun tak pernah dihapus — dinonaktifkan lewat sini. */
  status?: 'active' | 'disabled';
}

/** Penyaring daftar akun. Semua opsional; yang kosong tidak ikut terkirim. */
export interface UserQuery {
  /** Jenjang role, bukan namanya — nama bebas diubah Super Admin. `0` = Super Admin. */
  level?: number;
  /** Cocok pada nama, username, telepon, atau email. */
  q?: string;
  status?: 'active' | 'disabled';
  page?: number;
  per_page?: number;
}

/**
 * Daftar akun. Penyaringan & paginasinya dikerjakan server: satu dinas bisa punya
 * puluhan ribu akun pelanggan, dan `per_page` bawaan di bawah ini memang hanya cukup
 * untuk pemanggil yang tahu daftarnya pendek (petugas, admin dinas).
 */
export const listUsers = (params: UserQuery = {}): Promise<Page<UserDto>> =>
  getPage<UserDto>('/users', { query: { per_page: 100, ...params } });

export const createUser = (input: UserInput): Promise<UserDto> => post<UserDto>('/users', input);

export const updateUser = (id: string, input: Partial<UserInput>): Promise<UserDto> =>
  put<UserDto>(`/users/${id}`, input);

/**
 * Setel ulang kata sandi akun lain — admin dinas & Super Admin, untuk petugas/pelanggan
 * yang lupa sandinya. Tanpa kata sandi lama: yang menekan tombol memang tidak tahu.
 *
 * Server mencabut seluruh sesi akun itu, jadi pemiliknya wajib masuk lagi dengan
 * sandi baru. Sampaikan sandinya lewat kanal terpisah — ia tidak dikirim ke mana pun.
 */
export const resetUserPassword = (id: string, password: string): Promise<null> =>
  put<null>(`/users/${id}/password`, { password, password_confirmation: password });

/**
 * Tangguhkan / aktifkan kembali akun — hanya Super Admin, dan ia menjangkau admin
 * dinas juga. Penangguhan mencabut sesi berjalan, bukan sekadar memblokir login
 * berikutnya.
 */
export const suspendUser = (id: string, suspended: boolean, reason?: string): Promise<UserDto> =>
  put<UserDto>(`/users/${id}/suspend`, { suspended, reason });

/** Rahasia 2FA satu akun Super Admin — dikirim server **sekali saja**, saat diterbitkan. */
export interface TwoFactorSecretDto {
  secret: string;
  /** Siap dijadikan QR untuk dipindai Google Authenticator/Authy. */
  otpauth_uri: string;
}

/**
 * Menerbitkan rahasia 2FA satu akun Super Admin — Super Admin saja, untuk akun Super
 * Admin saja.
 *
 * Akun Super Admin yang baru dibuat belum punya rahasia, jadi belum bisa login sama
 * sekali: langkah ini yang membuatnya bisa. Balasannya tidak bisa diminta ulang —
 * setelah dialognya ditutup, satu-satunya jalan adalah menerbitkan ulang
 * (`reset: true`), yang menghanguskan rahasia lama beserta seluruh sesi akun itu.
 */
export const issueTwoFactor = (id: string, reset = false): Promise<TwoFactorSecretDto> =>
  post<TwoFactorSecretDto>(`/users/${id}/two-factor`, { reset });

/* ── Izin fitur per akun admin (§22) ───────────────────────────────────────── */

/** Satu fitur yang bisa dipinjamkan Super Admin, lengkap dengan teks siap tampil. */
export interface FeatureDto {
  key: string;
  label: string;
  description: string;
}

/**
 * Katalog fitur — Super Admin saja.
 *
 * Diambil dari server, bukan didaftar ulang di klien: labelnya milik enum yang sama
 * yang ditegakkan middleware, jadi fitur yang ditambah/diganti nama di backend langsung
 * muncul benar di panel tanpa aplikasi ini ikut dirilis.
 */
export const listFeatures = (): Promise<FeatureDto[]> => get<FeatureDto[]>('/permissions');

/**
 * Menyimpan izin satu akun admin. Yang dikirim adalah **keadaan akhir**, bukan satu
 * kunci yang ditambah/dicabut: dua Super Admin yang menyunting bersamaan dengan begitu
 * saling menimpa secara terlihat, bukan diam-diam menggabungkan hasil yang tak pernah
 * dimaksudkan siapa pun. Daftar kosong berarti mengunci semuanya.
 */
export const syncUserPermissions = (
  id: string,
  permissions: string[],
): Promise<{ permissions: string[] }> =>
  put<{ permissions: string[] }>(`/users/${id}/permissions`, { permissions });

/* ── Rekening penerimaan dinas ─────────────────────────────────────────────── */

export interface BankAccountInput {
  bank_name: string;
  account_number: string;
  account_name: string;
  is_primary?: boolean;
}

export const listBankAccounts = (): Promise<BankAccountDto[]> =>
  get<BankAccountDto[]>('/bank-accounts');

export const createBankAccount = (input: BankAccountInput): Promise<BankAccountDto> =>
  post<BankAccountDto>('/bank-accounts', input);

export const updateBankAccount = (
  id: string,
  input: Partial<BankAccountInput>,
): Promise<BankAccountDto> => put<BankAccountDto>(`/bank-accounts/${id}`, input);

export const deleteBankAccount = (id: string): Promise<null> => del<null>(`/bank-accounts/${id}`);

/* ── Setoran kas petugas ───────────────────────────────────────────────────── */

export const listDeposits = (): Promise<Page<DepositDto>> =>
  getPage<DepositDto>('/deposits', { query: { per_page: 100 } });

/** Kas di tangan petugas, dipilah per tahap setoran. */
export const cashOnHand = (): Promise<CashOnHandDto> =>
  get<CashOnHandDto>('/deposits/cash-on-hand');

/** Menyetorkan seluruh kas yang boleh diajukan; nominalnya dihitung server, bukan dikirim klien. */
export const createDeposit = (note?: string): Promise<DepositDto> =>
  post<DepositDto>('/deposits', { note });

/** Keputusan dinas atas satu setoran. Penolakan wajib beralasan. */
export const reviewDeposit = (
  id: string,
  status: 'diterima' | 'ditolak',
  note?: string,
): Promise<DepositDto> => post<DepositDto>(`/deposits/${id}/review`, { status, note });

/* ── Peta, laporan, wilayah, pengaturan ────────────────────────────────────── */

export const mapPoints = (zoneId?: string): Promise<MapPointDto[]> =>
  get<MapPointDto[]>('/map/points', { query: { zone: zoneId } });

export const mapLegend = (): Promise<MapLegendDto[]> => get<MapLegendDto[]>('/map/legend');

export const reportSummary = (): Promise<ReportSummaryDto> =>
  get<ReportSummaryDto>('/reports/summary');

/** Pengaturan dinas: wilayah operasional, titik awal peta, sakelar QRIS. */
export const readSettings = (): Promise<Record<string, unknown>> =>
  get<Record<string, unknown>>('/settings');

export const writeSettings = (values: Record<string, unknown>): Promise<Record<string, unknown>> =>
  put<Record<string, unknown>>('/settings', { settings: values });

/**
 * Menguji sambungan ke gateway Dukcapil. `base_url` boleh dikirim agar alamat yang
 * baru diketik bisa dicoba sebelum disimpan; tanpa itu yang diuji alamat tersimpan.
 */
export const probeDukcapil = (baseUrl?: string): Promise<DukcapilProbeDto> =>
  post<DukcapilProbeDto>('/settings/dukcapil/probe', { base_url: baseUrl ?? null });

export const listProvinces = (): Promise<WilayahDto[]> => get<WilayahDto[]>('/wilayah/provinces');

/** Anak satu wilayah: provinsi → kabupaten → kecamatan → desa. */
export const listChildren = (kode: string): Promise<WilayahDto[]> =>
  get<WilayahDto[]>(`/wilayah/${kode}/children`);

/**
 * Kelola master wilayah — khusus Super Admin.
 *
 * Dipisahkan dari `listChildren` di atas meski keduanya menyentuh tabel yang sama:
 * jalur baca di-cache 24 jam di server, sedangkan layar kelola membaca langsung.
 * Memakai jalur baca di layar kelola berarti baris yang baru ditambah tak muncul
 * beberapa saat, dan itu terbaca sebagai penyimpanan yang gagal.
 */
export const listWilayah = (params: {
  parent?: string;
  q?: string;
  level?: number;
}): Promise<WilayahDto[]> => get<WilayahDto[]>('/wilayah', { query: { ...params, per_page: 200 } });

export const createWilayah = (kode: string, nama: string): Promise<WilayahDto> =>
  post<WilayahDto>('/wilayah', { kode, nama });

/** Hanya nama yang bisa diubah; mengganti kode berarti memindahkan seluruh turunannya. */
export const renameWilayah = (kode: string, nama: string): Promise<WilayahDto> =>
  put<WilayahDto>(`/wilayah/${kode}`, { nama });

export const deleteWilayah = (kode: string): Promise<void> => del<void>(`/wilayah/${kode}`);

/** Role yang tersedia; hanya dibaca, tata kelolanya milik Super Admin. */
export interface RoleDto {
  id: string;
  name: string;
  label: string;
  level: number;
}

/**
 * Cari id role berdasarkan level. Nama role bebas diubah Super Admin, jadi level
 * adalah satu-satunya penanda yang stabil untuk menentukan kewenangan akun baru.
 */
export async function findRoleIdByLevel(level: number): Promise<string> {
  const roles = await get<RoleDto[]>('/roles');
  const match = roles.find((role) => role.level === level);
  if (match === undefined) throw new Error(`Tidak ada role dengan level ${level}.`);
  return match.id;
}
