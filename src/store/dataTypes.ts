import type * as customers from '@/api/customers';
import type * as misc from '@/api/misc';
import type { LocalFile } from '@/api/types';
import type { ComplaintStatus, CustomerStatus, Tariff, Weekday } from '@/types';
import type { PayOpts } from './types';

/**
 * Bentuk aksi data beserta payload-nya. Dipisah dari pelaksananya (`dataActions.ts`)
 * karena keduanya berubah karena alasan yang berbeda: yang di sini bergerak saat
 * kontrak dengan layar berubah, yang di sana saat cara memanggil server berubah.
 */

/** Hasil satu mutasi: `null` bila berhasil, selain itu kode galat server (`ERR_*`). */
export type MutationOutcome = string | null;

/**
 * Umpan balik satu mutasi (PLAN §23). Ditetapkan bersama bentuk aksinya, bukan di layar
 * pemanggil, supaya tak ada aksi yang bisa berhasil atau gagal diam-diam — satu aksi
 * baru tanpa umpan balik akan langsung ditolak pengetik tipe.
 */
export interface Feedback {
  /** Pesan toast saat berhasil; `null` untuk aksi latar yang tak boleh berisik. */
  done: string | null;
  /** Judul dialog saat gagal. Isinya datang dari server, bukan ditulis ulang di sini. */
  fail: string;
  /**
   * Judul dialog saat berhasil — dipakai aksi berat yang hasilnya tak kasatmata di
   * layar tempat tombolnya ditekan (uang berpindah, sesi dicabut, tagihan terbit).
   * Tanpa ini, keberhasilan cukup dilaporkan lewat toast.
   */
  heavy?: string;
}

/** Status yang boleh disetel admin lewat tombol; `menunggu` hanya lahir dari server. */
export type SettableStatus = Exclude<CustomerStatus, 'menunggu'>;

/**
 * Aksi data. Semua mutasi memanggil API lalu memuat ulang; tidak ada state optimistis,
 * supaya yang tampil di layar selalu sama dengan yang tersimpan di server.
 */
export interface DataActions {
  /** Muat data yang relevan untuk role sesi aktif. */
  refresh: () => Promise<void>;
  /**
   * Sama, tetapi tanpa menyentuh `dataState`. Dipakai denyut data: pemuatan yang tidak
   * diminta pengguna tak boleh memunculkan spanduk "memuat" di tengah pekerjaannya.
   */
  refreshQuietly: () => Promise<void>;
  /**
   * Muat ulang **hanya** notifikasi. Dipakai lencana & panel lonceng: keduanya tak
   * butuh seluruh koleksi, dan sengaja tidak menyentuh `dataState` supaya pembaruan
   * di latar tidak memunculkan spanduk "memuat data" di tengah pekerjaan pengguna.
   */
  refreshNotifications: () => Promise<void>;
  /**
   * Muat ulang **hanya** aduan, dengan alasan yang sama: layar Aduan dinas perlu
   * memastikan dirinya mutakhir saat dibuka, tanpa menyeret seluruh koleksi konsol.
   */
  refreshComplaints: () => Promise<void>;

  /** Catat pembayaran atas satu tagihan. Server menegakkan urutan pelunasan (FIFO). */
  payBill: (billId: string, opts?: PayOpts) => Promise<MutationOutcome>;
  verifyPayment: (paymentId: string) => Promise<MutationOutcome>;
  /** Petugas menerima pengajuan bayar tunai; kas berpindah ke tangannya. */
  acceptPayment: (paymentId: string) => Promise<MutationOutcome>;
  rejectPayment: (paymentId: string, note: string) => Promise<MutationOutcome>;
  /** Terbitkan tagihan satu bulan, mis. `Jul 2026`. Idempoten di sisi server. */
  generateBills: (baseMonth: string) => Promise<MutationOutcome>;

  addCustomer: (input: NewCustomer) => Promise<MutationOutcome>;
  /** Titik layanan kedua dan seterusnya untuk pelanggan yang sudah terdaftar. */
  addLocation: (peopleId: string, input: NewLocation) => Promise<MutationOutcome>;
  /**
   * Pengajuan titik layanan oleh pelanggan sendiri. Lahir menunggu verifikasi, tanpa
   * golongan & zona — keduanya ditetapkan admin.
   */
  requestLocation: (input: NewLocation) => Promise<MutationOutcome>;
  updateCustomer: (locationId: string, patch: CustomerPatch) => Promise<MutationOutcome>;
  /** Perbarui biodata orangnya (bukan titik layanan); server mencatat pengubahnya. */
  updatePerson: (
    peopleId: string,
    patch: Partial<customers.PersonInput>,
  ) => Promise<MutationOutcome>;
  /** Ganti foto profil pelanggan. */
  updatePersonAvatar: (peopleId: string, file: LocalFile) => Promise<MutationOutcome>;
  setCustomerStatus: (peopleId: string, status: SettableStatus) => Promise<MutationOutcome>;
  /** Verifikasi titik layanan: golongan **dan** zona, keduanya wajib di server. */
  verifyLocation: (
    locationId: string,
    categoryId: string,
    zoneId: string,
  ) => Promise<MutationOutcome>;
  /**
   * Menolak pengajuan titik layanan: titiknya dibuang, alasannya masuk ke notifikasi
   * pengajunya — satu-satunya tempat alasan itu terbaca pelanggan.
   */
  rejectLocation: (locationId: string, reason: string) => Promise<MutationOutcome>;

  addTariff: (input: Omit<Tariff, 'id' | 'color'>) => Promise<MutationOutcome>;
  updateTariff: (
    id: string,
    patch: Partial<Omit<Tariff, 'id' | 'color'>>,
  ) => Promise<MutationOutcome>;
  deleteTariff: (id: string) => Promise<MutationOutcome>;

  addZone: (input: NewZone) => Promise<MutationOutcome>;
  updateZone: (id: string, patch: Partial<NewZone>) => Promise<MutationOutcome>;
  deleteZone: (id: string) => Promise<MutationOutcome>;

  addOperator: (input: NewOperator) => Promise<MutationOutcome>;
  updateOperator: (id: string, patch: Partial<NewOperator>) => Promise<MutationOutcome>;
  /** Akun petugas tidak pernah dihapus — ada jejak uang. Hanya dinonaktifkan. */
  deactivateOperator: (id: string) => Promise<MutationOutcome>;

  /**
   * Setel ulang kata sandi akun lain (admin dinas & Super Admin). Seluruh sesi akun
   * itu dicabut server, jadi pemiliknya wajib masuk lagi dengan kata sandi baru.
   */
  resetUserPassword: (id: string, password: string) => Promise<MutationOutcome>;
  /** Tangguhkan/aktifkan akun — Super Admin saja, dan menjangkau admin dinas juga. */
  suspendUser: (id: string, suspended: boolean, reason?: string) => Promise<MutationOutcome>;

  addBankAccount: (input: misc.BankAccountInput) => Promise<MutationOutcome>;
  updateBankAccount: (
    id: string,
    patch: Partial<misc.BankAccountInput>,
  ) => Promise<MutationOutcome>;
  deleteBankAccount: (id: string) => Promise<MutationOutcome>;
  setPrimaryBank: (id: string) => Promise<MutationOutcome>;

  /** Setor seluruh kas yang boleh diajukan; nominalnya dihitung server, bukan dikirim klien. */
  depositCash: (note?: string) => Promise<MutationOutcome>;
  /** Keputusan dinas atas setoran petugas; kas baru berkurang setelah `diterima`. */
  acceptDeposit: (id: string) => Promise<MutationOutcome>;
  /** Penolakan wajib beralasan — alasannya disimpan terpisah dari catatan petugas. */
  rejectDeposit: (id: string, note: string) => Promise<MutationOutcome>;

  addComplaint: (type: string, description: string) => Promise<MutationOutcome>;
  setComplaintStatus: (id: string, status: ComplaintStatus) => Promise<MutationOutcome>;

  /** Setujui pendaftar. Ditolak server bila datanya belum lengkap (ERR_PEOPLE_INCOMPLETE). */
  approveCustomer: (peopleId: string) => Promise<MutationOutcome>;
  /**
   * Tolak pendaftar — seluruh datanya dihapus permanen, termasuk berkas KTP-nya.
   * Alasannya wajib: setelah ini hanya jejak audit yang tersisa untuk menjelaskannya.
   */
  rejectCustomer: (peopleId: string, reason: string) => Promise<MutationOutcome>;
  markNotificationRead: (id: string) => Promise<MutationOutcome>;
  markAllNotificationsRead: () => Promise<MutationOutcome>;
  /**
   * Kosongkan kotak notifikasi. Hanya milik pemanggil: rekan selevel tetap melihat
   * pekerjaan yang sama, jadi tak ada tugas yang hilang gara-gara satu orang
   * membereskan layarnya.
   */
  clearNotifications: () => Promise<MutationOutcome>;
  /** Buang satu notifikasi dari kotak pemanggil. */
  dismissNotification: (id: string) => Promise<MutationOutcome>;
}

/**
 * Pelanggan baru selalu dibuat bersama satu titik layanan pertamanya.
 *
 * Biodata dan titik dipisah tegas: alamat KTP orangnya tidak selalu sama dengan
 * alamat titik yang dilayani (kontrakan, warung, rumah kedua). Bentuk lama memakai
 * satu `streetAddress` untuk keduanya, sehingga alamat titik diam-diam ikut tercatat
 * sebagai alamat KTP.
 */
export interface NewCustomer {
  person: customers.PersonInput;
  location: NewLocation;
}

/**
 * Titik layanan tambahan; pemiliknya sudah ada, jadi tanpa biodata.
 *
 * `requestedCategoryId` dan `categoryId` sama-sama opsional karena dua alurnya memakai
 * yang berbeda: pelanggan **mengusulkan** golongan (§31) tanpa pernah melihat tarifnya,
 * admin **menetapkannya** — dan hanya yang ditetapkan admin yang jadi dasar tagihan.
 */
export interface NewLocation {
  label: string;
  kind?: 'rumah' | 'usaha' | 'fasilitas';
  /** Golongan tarif retribusi; hanya dibaca endpoint admin. */
  categoryId?: string;
  /** Usulan golongan dari pelanggan; hanya dibaca endpoint pengajuan mandiri. */
  requestedCategoryId?: string;
  address: string;
  villageCode?: string;
  zoneId?: string;
  lat?: number;
  lng?: number;
}

export interface CustomerPatch {
  label?: string;
  address?: string;
  villageCode?: string | null;
  zoneId?: string | null;
  lat?: number;
  lng?: number;
}

export interface NewZone {
  name: string;
  /** Kode wilayah cakupan zona; kecamatan atau desa, boleh bercampur. */
  areaCodes?: string[];
  vehicleType?: string;
  /** Penugasan petugas & jadwal punya endpoint sendiri; store yang menjahitnya. */
  operatorIds?: string[];
  days?: Weekday[];
  timeWindow?: string;
}

export interface NewOperator {
  name: string;
  username: string;
  password?: string;
  phone?: string;
  vehicleType?: string;
  roleId?: string;
}
