/**
 * Bentuk mentah (DTO) yang dikirim backend. Sengaja dipisah dari domain type di
 * `src/types.ts`: penamaan snake_case dan tanggal ISO milik server, bukan milik UI.
 */

/** Akun pengguna — `UserResource` pada backend. */
export interface UserDto {
  id: string;
  name: string;
  username: string | null;
  email: string | null;
  phone: string | null;
  /** Foto profil akun; null bila belum pernah diunggah. */
  avatar_url?: string | null;
  /** Nama role bebas diubah Super Admin — jangan pernah dipakai untuk otorisasi. */
  role: string | null;
  role_label: string | null;
  /** 0 Super Admin · 1 Admin Dinas · 2 Petugas · 3 Pelanggan. */
  level: number;
  is_super_admin: boolean;
  /**
   * Akun Super Admin bawaan `.env` server. Kebal seluruh jalur HTTP — ubah, tangguhkan,
   * setel ulang sandi, maupun terbitkan 2FA semuanya ditolak 422. Dipakai untuk mematikan
   * tombolnya di sini alih-alih menunggu galat yang membingungkan.
   */
  is_env_super_admin?: boolean;
  /**
   * Rahasia 2FA-nya sudah ada. Hanya penanda ada/tidak — rahasianya sendiri cuma
   * dikirim sekali, saat diterbitkan. Super Admin dengan `false` belum bisa login.
   */
  two_factor_ready?: boolean;
  /**
   * Fitur yang terbuka untuk akun ini (§22). Super Admin selalu menerima daftar penuh
   * meski tabel izinnya kosong — server mengirim kewenangan **efektif**, bukan isi
   * tabel mentah, supaya klien menyaring menu dengan kebenaran yang sama.
   */
  permissions: string[];
  status: string;
  people_id: string | null;
  vehicle_type?: string | null;
  /** Beban kerja petugas = cakupan wilayah, bukan target rupiah. */
  zones_count?: number;
  service_points_count?: number;
  last_login_at: string | null;
}

/** Balasan login & verifikasi OTP. */
export interface SessionDto {
  token: string;
  token_type: string;
  user: UserDto;
}

/** Kanal pengiriman kode sekali pakai. */
export type OtpChannel = 'wa' | 'email';

/** Golongan retribusi — dasar tarif, warna peta, dan legenda. */
export interface CategoryDto {
  id: string;
  name: string;
  amount: number;
  /** DEPRECATED (§6) — turunan dari `billing_cycle`; kolomnya berhenti jadi enum DB. */
  scheme: 'mingguan' | 'dua_mingguan' | 'tiga_mingguan' | 'bulanan';
  billing_cycle_id?: string | null;
  billing_cycle?: BillingCycleDto | null;
  description: string | null;
  map_color: string | null;
  map_icon: string | null;
  status: string;
}

/**
 * Golongan sebagaimana dilihat **pengaju**, tanpa tarif (§31).
 *
 * Sengaja bukan `Partial<CategoryDto>`: `amount` memang tidak pernah ada di respons
 * `/categories/options`, dan tipe yang sekadar "mungkin tidak ada" mengundang layar
 * pelanggan membacanya seolah kadang tersedia.
 */
export interface CategoryOptionDto {
  id: string;
  name: string;
  description: string | null;
}

/** Jadwal angkut satu zona. `weekday` 0 = Senin … 6 = Minggu. */
export interface ZoneScheduleDto {
  id: string;
  weekday: number;
  time_start: string | null;
  time_end: string | null;
}

/** Satu baris cakupan wilayah zona. */
export interface ZoneAreaDto {
  kode: string;
  nama: string;
  level: number;
}

export interface ZoneDto {
  id: string;
  name: string;
  /** DEPRECATED — sumber kebenaran cakupan adalah `areas`. */
  district_code: string | null;
  village_code: string | null;
  areas?: ZoneAreaDto[];
  area_label?: string;
  vehicle_type: string | null;
  status: string;
  locations_count?: number;
  operators?: UserDto[];
  schedules?: ZoneScheduleDto[];
}

/** Satu baris dasbor status penagihan — satu **titik layanan**, bukan satu tagihan. */
export interface CollectionRowDto {
  location_id: string;
  people_id: string;
  customer_name: string | null;
  address: string | null;
  district: string | null;
  village: string | null;
  category: string | null;
  zone: string | null;
  unpaid_months: number;
  oldest_unpaid_period: string | null;
  outstanding_amount: number;
  penalty_amount: number;
  last_paid_at: string | null;
  status: 'paid' | 'unpaid';
  operators: { id: string; name: string }[];
}

/** Ringkasan dasbor; dihitung server atas seluruh hasil filter, bukan per halaman. */
export interface CollectionSummaryDto {
  locations: number;
  paid_locations: number;
  unpaid_locations: number;
  outstanding_amount: number;
  penalty_amount: number;
}

/** Satu baris rekap teragregasi. */
export interface RecapRowDto {
  group: string;
  key: string | null;
  label: string | null;
  payments_count: number;
  bills_count: number;
  amount: number;
  penalty_amount: number;
}

/** Siklus penagihan (master data §6). */
export interface BillingCycleDto {
  id: string;
  name: string;
  unit: 'minggu' | 'bulan';
  interval: number;
  is_default: boolean;
  status: string;
  description: string | null;
  /** Nilai `categories.scheme` yang setara — kolom lama masih dibaca layar tarif. */
  scheme: string;
  categories_count?: number;
}

/** Titik layanan: rumah/usaha/fasilitas milik satu pelanggan. Tagihan menempel di sini. */
export interface ServiceLocationDto {
  id: string;
  people_id: string;
  label: string;
  location_kind: 'rumah' | 'usaha' | 'fasilitas';
  category?: CategoryDto | null;
  /**
   * Golongan yang **diusulkan** pelanggan saat mengajukan titik ini (§31) — bukan yang
   * ditagih. Yang menagih selalu `category`, yang ditetapkan admin saat verifikasi.
   */
  requested_category_id?: string | null;
  requested_category_name?: string | null;
  zone_id: string | null;
  zone?: ZoneDto | null;
  address: string | null;
  rt: string | null;
  rw: string | null;
  village_code: string | null;
  district_code?: string | null;
  /**
   * Petugas yang ditugaskan **langsung** ke titik ini (§7). Hanya ikut bila diminta
   * lewat `?with=locations`; yang menaungi lewat zona tidak ada di sini — itu dijawab
   * `GET /operators/{user}/scope`.
   */
  operators?: { id: string; name: string }[];
  latitude: number | null;
  longitude: number | null;
  status: string;
  verified_at: string | null;
}

/** Nama wilayah per jenjang; null berarti kodenya belum diisi. */
export interface WilayahNames {
  province: string | null;
  regency: string | null;
  district: string | null;
  village: string | null;
}

/**
 * Data kependudukan pelanggan. NIK tak pernah ikut di sini selain ter-masking —
 * bentuk utuhnya hanya lewat `/people/{id}/identity` dan tiap pembukaannya dicatat.
 */
export interface PeopleDto {
  id: string;
  full_name: string;
  nik_masked: string | null;
  /** Foto profil pelanggan; null bila belum pernah diunggah. */
  avatar_url: string | null;
  phone_number: string | null;
  email: string | null;
  gender: string | null;
  birth_place: string | null;
  /** ISO `YYYY-MM-DD`. */
  birthdate: string | null;
  street_address: string | null;
  rt: string | null;
  rw: string | null;
  postal_code: string | null;
  province_code: string | null;
  regency_code: string | null;
  district_code: string | null;
  village_code: string | null;
  /**
   * Nama tiap jenjang wilayah untuk ditampilkan. Selalu ada keempat kuncinya —
   * bernilai null bila kodenya belum diisi — jadi tak perlu memanggil daftar
   * wilayah hanya untuk menampilkan alamat.
   */
  address_names: WilayahNames;
  status: string;
  /**
   * Akun login pelanggan — hanya ikut pada endpoint detail. `null` bila ia tercatat
   * sebagai orang tanpa pernah diberi akses masuk (mis. didaftarkan lewat loket).
   *
   * `status` di sini status **akun** (aktif/ditangguhkan), berbeda dari `status` di
   * atas yang menyangkut keanggotaannya sebagai pelanggan.
   */
  account?: { id: string; status: string } | null;
  joined_at: string | null;
  verified_at: string | null;
  locations_count?: number;
  locations?: ServiceLocationDto[];
  /** Berkas resmi pelanggan; hanya ikut bila diminta lewat `?with=documents`. */
  documents?: DocumentDto[];
}

/** Berkas milik pelanggan/titik layanan. Isinya diambil lewat URL berumur pendek. */
export interface DocumentDto {
  id: string;
  type?: { id: string; code: string; name: string } | null;
  mime: string | null;
  size_bytes: number | null;
  status: 'pending' | 'verified' | 'rejected';
  review_note: string | null;
  uploaded_at: string | null;
  verified_at: string | null;
}

/**
 * Notifikasi ditujukan ke level role, bukan ke satu orang: siapa pun admin yang
 * lebih dulu menangani, dialah yang menutupnya.
 */
export interface NotificationDto {
  id: string;
  type: string;
  title: string;
  body: string | null;
  subject_type: string | null;
  subject_id: string | null;
  read_at: string | null;
  created_at: string | null;
}

/**
 * Satu baris jejak audit. `properties.changed` berisi peta kolom → {from, to}
 * pada peristiwa `people.updated`; kolom rahasia sudah diredaksi server.
 */
export interface ActivityDto {
  id: string;
  event: string;
  causer_name: string | null;
  properties: Record<string, unknown>;
  created_at: string | null;
}

/**
 * Jejak audit seluruh sistem. Bentuknya melebihi `ActivityDto` karena daftar
 * lintas-modul harus menyebut subjeknya di tiap baris — riwayat satu pelanggan
 * sudah tahu siapa yang sedang dibaca.
 */
export interface AuditActivityDto extends ActivityDto {
  causer_id: string | null;
  /** Nama kelas pendek, mis. "People". Null untuk peristiwa tanpa subjek. */
  subject_type: string | null;
  subject_id: string | null;
  /** Null juga berarti subjeknya sudah dihapus permanen. */
  subject_label: string | null;
}

export interface BillDto {
  id: string;
  bill_number: string;
  service_location_id: string;
  location?: ServiceLocationDto & { people?: PeopleDto };
  category?: CategoryDto;
  amount: number;
  penalty_total?: number;
  period_start: string;
  period_end: string;
  due_date: string;
  status: 'unpaid' | 'paid' | 'cancelled';
  is_overdue: boolean;
  paid_at: string | null;
}

export interface PaymentDto {
  id: string;
  payment_code: string;
  people_id: string;
  customer_name?: string;
  method: 'tunai_kantor' | 'tunai_petugas' | 'transfer_manual' | 'qris';
  total_amount: number;
  status: 'pending' | 'waiting_verification' | 'verified' | 'rejected' | 'expired';
  collected_by: string | null;
  collector_name?: string;
  /** Petugas penanggung jawab area saat pembayaran dibuat (§7). Snapshot, bukan relasi. */
  scope_operator_ids?: string[];
  /** Namanya; hanya ada di jalur laporan yang menempelkannya (§11). */
  scope_operator_names?: string[];
  verified_at: string | null;
  rejection_note: string | null;
  bills_count?: number;
  bills?: BillDto[];
  created_at: string | null;
}

export interface ComplaintDto {
  id: string;
  people_id: string;
  customer_name?: string;
  service_location_id: string | null;
  type: string;
  description: string;
  status: 'baru' | 'diproses' | 'selesai';
  handled_at: string | null;
  created_at: string | null;
}

export interface DepositDto {
  id: string;
  deposit_code: string;
  operator_id: string;
  operator_name?: string;
  total_amount: number;
  status: 'diajukan' | 'diterima' | 'ditolak';
  received_at: string | null;
  note: string | null;
  /** Alasan dinas menolak — terpisah dari catatan petugas agar keduanya utuh. */
  rejection_note: string | null;
  payments_count?: number;
  created_at: string | null;
}

/**
 * Kas petugas dipilah menurut tahap setorannya. `total_amount` adalah uang yang
 * masih di tangan — termasuk yang menunggu keputusan dinas, karena mengajukan
 * setoran belum memindahkan uangnya.
 */
export interface CashOnHandDto {
  operator_id: string;
  total_amount: number;
  payments_count: number;
  depositable_amount: number;
  pending_approval_amount: number;
  deposited_amount: number;
}

export interface BankAccountDto {
  id: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  is_primary: boolean;
  status: string;
}

/** Satu titik pada peta sebaran; payload sengaja ramping karena bervolume besar. */
export interface MapPointDto {
  id: string;
  label: string;
  lat: number | null;
  lng: number | null;
  category_id: string | null;
  zone_id: string | null;
  status: string;
}

/** Legenda peta diturunkan dari golongan tarif — satu sumber, tanpa daftar ganda. */
export interface MapLegendDto {
  category_id: string;
  name: string;
  color: string | null;
  icon: string | null;
}

/**
 * Hasil uji sambungan ke gateway Dukcapil.
 *
 * `ok: false` datang dengan HTTP 200 — yang gagal adalah gateway di seberang, bukan
 * permintaan ke server ini, jadi jangan diperlakukan sebagai galat jaringan.
 */
export interface DukcapilProbeDto {
  ok: boolean;
  /** Status HTTP dari gateway; null bila koneksinya sendiri tidak pernah tersambung. */
  status: number | null;
  duration_ms: number;
  /** Bukti mentah saat gagal (pesan koneksi atau isi respons), sudah dipotong server. */
  detail: string | null;
}

/** Wilayah Kemendagri; `kode` bertipe teks (dot-notation), jangan dikonversi ke angka. */
export interface WilayahDto {
  kode: string;
  nama: string;
}

/** Ringkasan KPI dasbor admin — seluruh angkanya dihitung server. */
export interface ReportSummaryDto {
  period: { from: string; to: string };
  customers: { active: number; pending_verification: number };
  locations: { active: number; pending_verification: number };
  bills: { issued: number; paid: number; overdue: number; outstanding_amount: number };
  revenue: { verified_amount: number; waiting_verification: number };
  complaints: { new: number; in_progress: number };
}

/**
 * Berkas yang dipilih/dipotret di perangkat, dalam bentuk yang diterima `FormData` RN.
 *
 * Pengganti `File` milik web, yang tak ada di React Native. Bentuk `{ uri, name, type }`
 * dikenali RN secara khusus saat di-`append`, tapi TypeScript menolaknya tanpa cast —
 * dibungkus sekali di sini supaya cast-nya tak berserakan di layar.
 */
export interface LocalFile {
  /** `file://…` dari kamera atau pemilih berkas. */
  uri: string;
  name: string;
  /** MIME, mis. `image/jpeg`. */
  type: string;
}
