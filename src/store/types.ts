import type {
  BankAccount,
  Bill,
  CashOnHand,
  Complaint,
  Customer,
  DataState,
  Deposit,
  OperatorInfo,
  PayMethod,
  Role,
  Tariff,
  Transaction,
  Zone,
} from '@/types';
import type { NotificationDto } from '@/api/types';
import type { AuthActions } from './authActions';
import type { Branding } from './branding';
import type { DataActions } from './dataTypes';
import type { AlertSpec, ConfirmSpec, FeedbackActions, ToastSpec } from './feedback';
import type { SessionSlice } from './session';

/** Opsi saat mencatat pembayaran; metode menentukan endpoint mana yang dipakai server. */
export interface PayOpts {
  method?: PayMethod;
}

/**
 * Central app store. Sengaja kecil & framework-agnostic supaya bentuk yang sama
 * bisa jadi Zustand/Redux atau React Native context nanti. View membaca lewat
 * hook useApp() — tanpa business logic di view.
 *
 * Seluruh koleksi di bawah datang dari API dan mulai kosong; `dataState` menandai
 * apakah pemuatannya sedang berjalan, gagal, atau selesai.
 */
export interface AppState extends SessionSlice {
  /**
   * Identitas aplikasi: nama, lambang, kredit. Dimuat sekali di luar sesi — layar
   * masuk membutuhkannya sebelum ada yang login — dan tak pernah bernilai kosong;
   * selama server belum menjawab isinya `BRANDING_FALLBACK`.
   */
  branding: Branding;
  /** Keadaan pemuatan data untuk role aktif. */
  dataState: DataState;
  /** Pesan galat pemuatan/mutasi terakhir, sudah ter-lokalisasi server. */
  dataError: string | null;
  /**
   * Naik satu tiap kali data role berhasil dimuat. Isyarat bagi layar yang menarik
   * datanya sendiri di luar store agar ikut menyegarkan diri.
   */
  dataRevision: number;
  /** Tagihan retribusi beserta dendanya. */
  bills: Bill[];
  /** Riwayat pembayaran (baris transaksi). */
  transactions: Transaction[];
  /** Titik layanan + pemiliknya — satu baris per titik. */
  customers: Customer[];
  /** Rekening penerimaan dinas. */
  bankAccounts: BankAccount[];
  /** Riwayat setoran kas petugas. */
  deposits: Deposit[];
  /**
   * Kas petugas yang sedang login, per tahap setoran. Dihitung server; jangan
   * diturunkan dari transaksi harian — kas tidak berkurang saat diajukan, hanya
   * setelah dinas menerima. `null` untuk role selain petugas.
   */
  cashOnHand: CashOnHand | null;
  /** Aduan pelanggan. */
  complaints: Complaint[];
  /** Golongan retribusi master. */
  tariffs: Tariff[];
  /** Zona layanan beserta jadwal & petugasnya. */
  zones: Zone[];
  /** Akun petugas retribusi. */
  operators: OperatorInfo[];
  /**
   * Notifikasi untuk level role sesi aktif. Bentuk DTO dipakai apa adanya: isinya
   * sudah siap tampil (judul + isi dari server) dan tak punya turunan di UI.
   */
  notifications: NotificationDto[];
  selCustomerId: string | null;
  selBillId: string | null;
  /**
   * Titik layanan yang sedang dilihat pelanggan bila ia punya lebih dari satu.
   * `null` = ikut titik pertama. Disimpan di store, bukan di masing-masing layar,
   * supaya beranda/tagihan/riwayat tidak bisa saling berbeda pilihan.
   */
  activeLocationId: string | null;
  /**
   * Dialog umpan balik yang sedang tampil. Satu pada satu waktu: dua dialog bertumpuk
   * membuat orang menjawab yang salah.
   */
  alertSpec: AlertSpec | null;
  /** Konfirmasi aksi merusak yang sedang menunggu jawaban. */
  pendingConfirm: ConfirmSpec | null;
  /** Toast yang sedang melayang, urut lahir; masing-masing menghilang sendiri. */
  toasts: ToastSpec[];
}

/**
 * Aksi murni tampilan, tanpa menyentuh server.
 *
 * Lebih ramping dari web: `go`/`back`/`setTab` pindah ke React Navigation dan
 * `toggleDark` ke `theme/ThemeProvider` — keduanya keputusan Tahap 1/4, dan
 * membiarkan salinannya di sini berarti dua sumber kebenaran untuk hal yang sama.
 */
export interface UiActions {
  /** Tandai titik layanan yang sedang dibuka; berpindah layarnya urusan pemanggil. */
  selectCustomer: (id: string | null) => void;
  /** Pilih titik layanan aktif sisi pelanggan; `null` mengembalikan ke titik pertama. */
  setActiveLocation: (id: string | null) => void;
  /**
   * Pasang identitas yang baru tersimpan. Dipanggil layar pengaturan Super Admin env
   * supaya lambang di layar masuk & beranda ikut berganti seketika.
   */
  setBranding: (branding: Branding) => void;
}

/** Kumpulan aksi store: auth, data (memanggil API), umpan balik, dan tampilan. */
export type AppActions = AuthActions & DataActions & FeedbackActions & UiActions;

/** Nilai turunan yang dipakai luas oleh view, dihitung dari sesi. */
export interface SessionDerived {
  /** Ada sesi aktif. */
  authed: boolean;
  /** Peran pengguna aktif; default `pelanggan` selama belum masuk. */
  role: Role;
}

/** Nilai context: state + nilai turunan + actions. */
export type AppContextValue = AppState & SessionDerived & AppActions;
