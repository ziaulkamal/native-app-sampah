/** Domain types aplikasi persampahan & retribusi — dibagikan lintas fitur. */

export type Role = 'pelanggan' | 'operator' | 'admin';

export type DataState = 'normal' | 'loading' | 'empty' | 'error';

/**
 * Fitur dinas yang bawaannya terkunci dan dipinjamkan Super Admin per akun (§22).
 *
 * Nilainya harus persis sama dengan `App\Enums\FeaturePermission` di backend: kunci
 * inilah yang dikirim `GET /me` dan yang ditegakkan middleware `feature:`. Menyalinnya
 * di sini bukan duplikasi kewenangan — server tetap satu-satunya penegak; ini semata
 * agar menu yang pasti ditolak tidak ditawarkan.
 */
export type FeatureKey =
  | 'settings.manage'
  | 'wilayah.manage'
  | 'billing.monitor'
  | 'tariff.manage'
  | 'billing_cycle.manage';

/**
 * Pengguna yang sedang masuk. Selalu berasal dari server (`/auth/login` atau `/me`) —
 * tidak pernah dibaca dari SecureStore, yang hanya menyimpan token.
 */
export interface Session {
  id: string;
  name: string;
  username: string | null;
  phone: string | null;
  email: string | null;
  /** Peran UI, diturunkan dari `level`. Nama role di server bebas diubah Super Admin. */
  role: Role;
  /** Level mentah: 0 Super Admin · 1 Admin Dinas · 2 Petugas · 3 Pelanggan. */
  level: number;
  isSuperAdmin: boolean;
  /**
   * Super Admin **bawaan** — akun yang tertanam di berkas env server, bukan yang
   * diterbitkan lewat halaman Tambah Super Admin. Dibedakan karena segelintir
   * pengaturan (mis. alamat gateway Dukcapil) menuntut bukti akses berkas server,
   * bukan sekadar satu sesi Super Admin yang sedang terbuka.
   */
  isEnvSuperAdmin: boolean;
  /**
   * Fitur yang boleh dibuka akun ini (§22). Bukan turunan `level`: dua admin dinas
   * dengan level sama bisa berbeda isinya. Super Admin selalu memuat seluruh kunci.
   */
  permissions: FeatureKey[];
  /** Id data kependudukan bila akun tertaut ke pelanggan. */
  peopleId: string | null;
  /** Foto profil akun; null bila belum pernah diunggah. */
  avatarUrl: string | null;
  /** Armada petugas; kosong untuk role lain. */
  vehicleType?: VehicleType;
}

/** Status tagihan retribusi. */
export type BillStatus = 'lunas' | 'belum_bayar' | 'tunggakan';

/** Id golongan pelanggan (referensi ke Tariff.id). Golongan kini dinamis, dikelola admin. */
export type CustomerCategory = string;

/**
 * Skema/periode penagihan per golongan.
 *
 * DEPRECATED sebagai sumber kebenaran sejak §6 — siklusnya kini master data
 * (`BillingCycle`), dan `scheme` tinggal turunannya. Tetap ada karena label & konversi
 * per-bulan di seluruh layar masih membacanya.
 */
export type BillingScheme = 'mingguan' | 'dua_mingguan' | 'tiga_mingguan' | 'bulanan';

/** Siklus penagihan yang bisa dipakai ulang lintas golongan (master data §6). */
export interface BillingCycle {
  id: string;
  name: string;
  unit: 'minggu' | 'bulan';
  interval: number;
  isDefault: boolean;
  status: 'active' | 'inactive';
  description: string;
  /** Nilai `scheme` yang setara — dipakai layar lama yang masih membacanya. */
  scheme: BillingScheme;
  categoriesCount: number;
}

/**
 * Jenis titik layanan. Warna & legenda peta TIDAK diturunkan dari sini melainkan dari
 * golongan tarif — satu sumber, sesuai model server.
 */
export type LocationKind = 'rumah' | 'usaha' | 'fasilitas';

/**
 * Status langganan pelanggan.
 *
 * `menunggu` berdiri sendiri, tidak dilebur ke `nonaktif`: keduanya sama-sama belum
 * boleh ditagih, tapi yang satu menunggu pekerjaan admin sedangkan yang lain justru
 * hasil keputusan admin. Meleburnya membuat pendaftar baru dan pelanggan yang
 * dinonaktifkan tampil sebagai hal yang sama di dua layar sekaligus.
 */
export type CustomerStatus = 'menunggu' | 'aktif' | 'nonaktif' | 'ditangguhkan';

/** Status pengangkutan sampah pada satu jadwal. */
export type PickupStatus = 'terjadwal' | 'proses' | 'selesai';

/** Jenis kendaraan angkut operator (menentukan aturan penugasan zona). */
export type VehicleType = 'mobil' | 'becak';

/** Hari dalam sepekan untuk jadwal angkut (index 0 = Senin … 6 = Minggu). */
export type Weekday = 'senin' | 'selasa' | 'rabu' | 'kamis' | 'jumat' | 'sabtu' | 'minggu';

/** Status penanganan aduan pelanggan. */
export type ComplaintStatus = 'baru' | 'diproses' | 'selesai';

/** Jadwal angkut ringkas milik satu zona (hari + jam opsional). */
export interface ZoneSchedule {
  /** Hari-hari angkut terpilih (Senin–Minggu). */
  days: Weekday[];
  /** Rentang jam, mis. "06.00 – 09.00". Opsional; kosong = tanpa patokan jam. */
  timeWindow?: string;
}

/** Satu cakupan wilayah zona: kecamatan (level 2) atau desa (level 3). */
export interface ZoneArea {
  code: string;
  name: string;
  level: 2 | 3;
}

/**
 * Wilayah/zona layanan. Cakupannya **jamak** dan boleh bercampur jenjang: satu zona
 * bisa berarti satu kecamatan penuh, beberapa desa lintas kecamatan, atau gabungan
 * keduanya. Penugasan operator: satu operator becak, atau beberapa operator mobil.
 */
export interface Zone {
  id: string;
  name: string;
  /** Cakupan wilayah zona; kosong berarti zona belum menaungi wilayah mana pun. */
  areas: ZoneArea[];
  /** Nama cakupan dipisah koma, mis. "Dago, Coblong". Disusun server. */
  areaLabel: string;
  /** Operator penanggung jawab (≥1 bila mobil, tepat 1 bila becak). */
  operatorIds: string[];
  /** Jadwal angkut zona (hari wajib, jam opsional). */
  schedule: ZoneSchedule;
  customerCount: number;
}

/** Golongan retribusi (dinamis, dikelola admin) — dasar tagihan sekaligus legenda peta. */
export interface Tariff {
  id: string;
  name: string;
  /** Tarif per periode sesuai skema (Rupiah). */
  amount: number;
  /** DEPRECATED (§6) — turunan dari siklus; dipakai layar yang belum berpindah. */
  scheme: BillingScheme;
  /** Siklus penagihan golongan ini; kosong bila belum dipetakan ke siklus mana pun. */
  cycleId: string;
  cycleName: string;
  description: string;
  /** Warna marker & legenda peta, ditetapkan server per golongan. */
  color: string;
}

/**
 * Satu titik layanan berikut pemiliknya — inilah unit yang ditagih, dipetakan, dan
 * ditugaskan ke zona. Seorang pelanggan boleh punya beberapa titik (rumah + usaha),
 * sehingga tiap titik muncul sebagai satu baris.
 */
export interface Customer {
  /** Id titik layanan (service location), bukan id orangnya. */
  id: string;
  /** Id data kependudukan pemilik — dipakai pembayaran & aduan. */
  peopleId: string;
  name: string;
  /** Nama titik, mis. "Lokasi Utama" atau "Warung Depan". */
  label: string;
  address: string;
  zoneId: string;
  /** Desa titik layanan; dasar filter kecamatan/desa di dasbor dan saran zona. */
  villageCode: string;
  /** Kecamatan titik layanan; diturunkan server dari desanya, kosong bila desanya kosong. */
  districtCode: string;
  /** Golongan billing (menentukan tarif). Kosong bila titik belum diverifikasi. */
  category: CustomerCategory;
  /**
   * Golongan yang **diusulkan** pelanggan saat mengajukan titik ini (§31); null pada
   * titik buatan admin. Bukan dasar tarif — hanya nilai awal layar tinjauan.
   */
  requestedCategory: { id: string; name: string } | null;
  kind: LocationKind;
  status: CustomerStatus;
  /**
   * Status **titiknya**, terpisah dari `status` yang menggambarkan orangnya.
   *
   * Keduanya kerap berbeda, dan perbedaan itulah yang penting: pelanggan aktif yang
   * mengajukan titik kedua tetap `aktif` sebagai orang, sementara titik barunya masih
   * `pending_verification`. Sebelum §31 hanya status orangnya yang terbawa, sehingga
   * pengajuan yang menunggu tampil "aktif" dan admin tak punya cara membedakan titik
   * mana yang sedang ia tinjau.
   */
  locationStatus: string;
  /** Tarif per periode, mengikuti golongan (Rupiah). */
  tariff: number;
  /** Koordinat titik layanan (marking peta). */
  lat: number;
  lng: number;
  /**
   * Petugas yang ditugaskan **langsung** ke titik ini (§7), di samping yang menjangkau
   * lewat zona. `undefined` berarti belum diminta dari server — berbeda dari `[]`
   * yang berarti benar-benar tak ada penugasan langsung.
   */
  operators?: { id: string; name: string }[];
  /** Foto lokasi rumah (opsional, diisi setelah terdaftar). */
  photoUrl?: string;
  /** Nomor HP/WhatsApp kontak (opsional). */
  phone?: string;
  /** Foto profil pengguna (opsional). */
  avatarUrl?: string;
}

/** Tagihan retribusi satu periode untuk satu titik layanan. */
export interface Bill {
  id: string;
  /** Merujuk `Customer.id`, yaitu id titik layanan. */
  customerId: string;
  /** Periode tagihan untuk ditampilkan, mis. "Jul 2026". */
  period: string;
  /** Awal periode dalam ISO (`YYYY-MM-DD`) — dipakai mengurutkan, bukan string tampilan. */
  periodStart: string;
  /** Pokok tagihan (Rupiah). */
  amount: number;
  /** Denda yang sudah tertagih atas tagihan ini (Rupiah); 0 bila belum ada. */
  penalty: number;
  status: BillStatus;
  /** Jatuh tempo untuk ditampilkan, mis. "20 Jul 2026". */
  dueDate: string;
  /** Tanggal lunas bila sudah dibayar. */
  paidAt?: string;
}

/** Status transaksi retribusi (untuk riwayat). */
export type TxStatus = 'selesai' | 'menunggu' | 'tertunggak';

/** Metode pembayaran. */
export type PayMethod = 'tunai' | 'transfer' | 'qris';

/** Satu transaksi retribusi (baris riwayat, per pelanggan & level dinas). */
export interface Transaction {
  id: string;
  /** Merujuk `Customer.peopleId` — pembayaran menempel ke orang, bukan ke titik. */
  customerId: string;
  /** Nama pembayar, dikirim server agar riwayat tidak perlu menggabungkan daftar pelanggan. */
  customerName: string;
  /** Periode tagihan terlama yang dilunasi, mis. "Jul 2026". */
  period: string;
  /** Nominal (Rupiah). */
  amount: number;
  status: TxStatus;
  /** Metode bayar (hanya untuk status selesai). */
  method?: PayMethod;
  /** No. referensi/kwitansi (hanya untuk selesai). */
  ref?: string;
  /**
   * Petugas yang tercatat pada transaksi ini: pengutipnya untuk tunai (`TXPR`), atau
   * petugas penanggung jawab area untuk non-tunai (`TXLS`). Bisa lebih dari satu —
   * satu pelanggan boleh ditangani beberapa petugas.
   */
  operatorNames?: string[];
  /** Tanggal bayar (selesai) atau jatuh tempo (menunggu/tertunggak). */
  date: string;
  /** Operator penagih bila transaksi via lapangan. */
  operatorId?: string;
}

/** Jadwal pengangkutan sampah per zona. */
export interface PickupSchedule {
  id: string;
  zoneId: string;
  /** Hari, mis. "Senin". */
  day: string;
  /** Rentang waktu, mis. "06.00 – 09.00". */
  window: string;
  status: PickupStatus;
}

/** Aduan/laporan dari pelanggan. */
export interface Complaint {
  id: string;
  /** Merujuk `Customer.peopleId`. */
  customerId: string;
  /** Nama pengadu dari server; daftar aduan tidak perlu memuat seluruh pelanggan. */
  customerName: string;
  /** Jenis aduan, mis. "Sampah tidak terangkut". */
  type: string;
  description: string;
  status: ComplaintStatus;
  /** Tanggal aduan dibuat, mis. "3 Jul 2026". */
  createdAt: string;
}

/** Operator restribusi (petugas lapangan) + ringkasan kinerja. */
export interface OperatorInfo {
  id: string;
  name: string;
  /** Nomor HP kontak/undangan akun. */
  phone: string;
  /** Jenis kendaraan angkut (mobil = multi-zona, becak = tunggal). */
  vehicleType: VehicleType;
  /** Akun login sudah diaktifkan (via Sync Akun). */
  accountSynced: boolean;
  /** Username login yang tergenerate saat sync (bila sudah). */
  username?: string;
  /** Alamat domisili operator (opsional). */
  address?: string;
  /** Foto profil pengguna (opsional). */
  avatarUrl?: string;
  /** Cakupan kerja: jumlah zona yang ditugaskan. Bukan target rupiah — dinas tidak memakai itu. */
  zonesCount: number;
  /** Cakupan kerja: jumlah titik layanan di seluruh zona tugasnya. */
  servicePointsCount: number;
}

/** Penyedia akun eksternal yang bisa disandingkan ke profil. */
export type LinkProvider = 'google' | 'whatsapp';

/** Status sanding satu akun eksternal (design-only). */
export interface LinkedAccount {
  provider: LinkProvider;
  connected: boolean;
  /** Label akun tertaut, mis. email Google atau nomor WA. */
  label?: string;
}

/** Setoran kas operator ke dinas (hasil penagihan lapangan). */
export interface Deposit {
  id: string;
  operatorId: string;
  operatorName: string;
  amount: number;
  /** Tanggal setor, mis. "4 Jul 2026". */
  date: string;
  ref: string;
  /** Setoran diperiksa admin sebelum diterima. */
  status: 'diajukan' | 'diterima' | 'ditolak';
  /** Catatan petugas saat mengajukan. */
  note?: string;
  /** Alasan dinas menolak; hanya terisi pada setoran yang ditolak. */
  rejectionNote?: string;
  paymentsCount?: number;
}

/** Kas petugas per tahap setoran; angkanya dihitung server, bukan diturunkan di klien. */
export interface CashOnHand {
  /** Masih di tangan petugas, termasuk yang menunggu keputusan dinas. */
  total: number;
  /** Boleh diajukan sekarang — belum terikat setoran mana pun. */
  depositable: number;
  /** Sudah diajukan, menunggu dinas memutuskan. */
  pendingApproval: number;
  /** Sudah diterima dinas — jejak, bukan kewajiban tersisa. */
  deposited: number;
}

/** Rekening penerimaan retribusi milik dinas (untuk transfer; jalur QRIS menyusul). */
export interface BankAccount {
  id: string;
  /** Nama bank, mis. "Bank BJB". */
  bank: string;
  accountNumber: string;
  /** Nama pemilik rekening. */
  accountName: string;
  /** Rekening utama yang ditampilkan ke pelanggan. */
  primary?: boolean;
}

/** Semua screen antar-role. Navigasi via store (screen + stack). */
export type ScreenId =
  // Pelanggan
  | 'pelangganHome'
  | 'tagihan'
  | 'riwayat'
  | 'jadwal'
  | 'aduan'
  | 'profil'
  // Operator restribusi
  | 'operatorHome'
  | 'rute'
  | 'penagihan'
  | 'verifikasi'
  | 'setor'
  // Admin dinas
  | 'adminDash'
  | 'pelangganList'
  | 'persetujuan'
  | 'operatorList'
  | 'tarif'
  | 'siklus'
  | 'zona'
  | 'laporan'
  | 'tagihanDash'
  | 'aduanQueue'
  | 'setoranQueue'
  | 'pengaturan'
  | 'akun'
  // Super Admin — data referensi nasional & tata kelola akun setingkat dinas ke atas
  | 'masterWilayah'
  | 'adminDinas'
  | 'superAdmin'
  | 'jejakAudit';
