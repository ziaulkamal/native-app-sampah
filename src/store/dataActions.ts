import type { Dispatch, SetStateAction } from 'react';
import * as bills from '@/api/bills';
import * as categories from '@/api/categories';
import * as customers from '@/api/customers';
import * as misc from '@/api/misc';
import * as notifications from '@/api/notifications';
import * as payments from '@/api/payments';
import * as zones from '@/api/zones';
import { periodToIso } from '@/lib/dates';
import type { Session } from '@/types';
import type { DataActions } from './dataTypes';
import {
  blankToNull,
  createCustomer,
  createOperator,
  methodOf,
  saveZone,
  toCategoryInput,
  toServerStatus,
  toUserInput,
} from './dataPayloads';
import type { FeedbackActions } from './feedback';
import { createMutationPlumbing } from './mutate';
import type { AppState } from './types';

type Setter = Dispatch<SetStateAction<AppState>>;

export function createDataActions(
  set: Setter,
  session: Session | null,
  feedback: FeedbackActions,
): DataActions {
  const { refresh, refreshQuietly, refreshNotifications, refreshComplaints, mutate } =
    createMutationPlumbing(set, session, feedback);

  return {
    refresh,
    refreshQuietly,
    refreshNotifications,
    refreshComplaints,

    // Toast, bukan dialog: baris tagihannya langsung hilang dari daftar petugas, dan
    // di sisi pelanggan `PaymentSheet` sudah menampilkan bukti bayar sebagai halamannya.
    payBill: (billId, opts) =>
      mutate({ done: 'Pembayaran tercatat.', fail: 'Pembayaran gagal dicatat' }, () =>
        payments.createPayment(methodOf(opts, session), [billId]),
      ),
    verifyPayment: (id) =>
      mutate({ done: 'Pembayaran diverifikasi.', fail: 'Gagal memverifikasi pembayaran' }, () =>
        payments.verifyPayment(id),
      ),
    acceptPayment: (id) =>
      mutate(
        {
          done: 'Pembayaran diterima; kasnya masuk ke tangan Anda.',
          fail: 'Gagal menerima pembayaran',
        },
        () => payments.acceptPayment(id),
      ),
    rejectPayment: (id, note) =>
      mutate({ done: 'Pengajuan pembayaran ditolak.', fail: 'Gagal menolak pembayaran' }, () =>
        payments.rejectPayment(id, note),
      ),
    generateBills: (baseMonth) =>
      mutate(
        {
          heavy: 'Tagihan diterbitkan',
          done: `Tagihan periode ${baseMonth} sudah terbit. Membuka daftar tagihan untuk memeriksanya.`,
          fail: 'Gagal menerbitkan tagihan',
        },
        () => bills.generateBills(periodToIso(baseMonth).slice(0, 7)),
      ),

    addCustomer: (input) =>
      mutate(
        {
          heavy: 'Pendaftar tersimpan',
          done: 'Pelanggan baru masuk antrean Persetujuan lebih dulu, belum langsung aktif.',
          fail: 'Gagal menyimpan pelanggan',
        },
        () => createCustomer(input),
      ),
    addLocation: (peopleId, input) =>
      mutate({ done: 'Titik layanan ditambahkan.', fail: 'Gagal menambah titik layanan' }, () =>
        customers.createLocation(peopleId, {
          label: input.label,
          // Golongan ikut sejak awal: bila zona juga terisi, server langsung
          // memverifikasi titiknya dan langkah "Tetapkan Golongan" tak perlu lagi.
          category_id: blankToNull(input.categoryId),
          address: input.address,
          village_code: blankToNull(input.villageCode),
          zone_id: blankToNull(input.zoneId),
          latitude: input.lat ?? null,
          longitude: input.lng ?? null,
        }),
      ),
    // Toast, bukan dialog: `TambahLokasi` sudah mengganti isi sheet-nya dengan
    // keterangan lengkap tentang apa yang terjadi setelah pengajuan terkirim.
    requestLocation: (input) =>
      mutate({ done: 'Pengajuan titik layanan terkirim.', fail: 'Gagal mengirim pengajuan' }, () =>
        customers.requestMyLocation({
          label: input.label,
          // Usulan golongan, bukan penetapannya: server menyimpannya di kolom terpisah
          // dan admin yang memutuskan golongan sesungguhnya saat verifikasi.
          requested_category_id: blankToNull(input.requestedCategoryId),
          address: input.address,
          village_code: blankToNull(input.villageCode),
          latitude: input.lat ?? null,
          longitude: input.lng ?? null,
        }),
      ),
    updateCustomer: (locationId, patch) =>
      mutate({ done: 'Titik layanan diperbarui.', fail: 'Gagal memperbarui titik layanan' }, () =>
        customers.updateLocation(locationId, {
          label: patch.label,
          address: patch.address,
          village_code: patch.villageCode,
          zone_id: patch.zoneId,
          latitude: patch.lat,
          longitude: patch.lng,
        }),
      ),
    updatePerson: (peopleId, patch) =>
      mutate({ done: 'Biodata diperbarui.', fail: 'Gagal memperbarui biodata' }, () =>
        customers.updatePerson(peopleId, patch),
      ),
    updatePersonAvatar: (peopleId, file) =>
      mutate({ done: 'Foto profil diganti.', fail: 'Gagal mengganti foto profil' }, () =>
        customers.uploadPersonAvatar(peopleId, file),
      ),
    setCustomerStatus: (peopleId, status) =>
      mutate(
        {
          done: `Status pelanggan diubah menjadi ${status}.`,
          fail: 'Gagal mengubah status pelanggan',
        },
        () => customers.setPersonStatus(peopleId, toServerStatus(status)),
      ),
    verifyLocation: (locationId, categoryId, zoneId) =>
      mutate(
        { done: 'Titik layanan diverifikasi.', fail: 'Gagal memverifikasi titik layanan' },
        () => customers.verifyLocation(locationId, categoryId, zoneId),
      ),
    // Dialog, bukan toast: titiknya hilang dari daftar tanpa sisa, dan penghapusan yang
    // tak bisa dibatalkan pantas diakui sekali dengan tegas (§23).
    rejectLocation: (locationId, reason) =>
      mutate(
        {
          heavy: 'Pengajuan ditolak',
          done: 'Pengajuan titik layanan ditolak. Alasannya sudah dikirim ke notifikasi pelanggan.',
          fail: 'Gagal menolak pengajuan',
        },
        () => customers.rejectLocation(locationId, reason),
      ),

    addTariff: (input) =>
      mutate({ done: 'Golongan tarif ditambahkan.', fail: 'Gagal menambah golongan tarif' }, () =>
        categories.createCategory({
          ...toCategoryInput(input),
          name: input.name,
          amount: input.amount,
        }),
      ),
    updateTariff: (id, patch) =>
      mutate({ done: 'Golongan tarif diperbarui.', fail: 'Gagal memperbarui golongan tarif' }, () =>
        categories.updateCategory(id, toCategoryInput(patch)),
      ),
    deleteTariff: (id) =>
      mutate({ done: 'Golongan tarif dihapus.', fail: 'Gagal menghapus golongan tarif' }, () =>
        categories.deleteCategory(id),
      ),

    addZone: (input) =>
      mutate({ done: 'Zona dibuat.', fail: 'Gagal membuat zona' }, () => saveZone(null, input)),
    updateZone: (id, patch) =>
      mutate({ done: 'Zona diperbarui.', fail: 'Gagal memperbarui zona' }, () =>
        saveZone(id, patch),
      ),
    deleteZone: (id) =>
      mutate({ done: 'Zona dihapus.', fail: 'Gagal menghapus zona' }, () => zones.deleteZone(id)),

    addOperator: (input) =>
      mutate({ done: 'Akun petugas dibuat.', fail: 'Gagal membuat akun petugas' }, () =>
        createOperator(input),
      ),
    updateOperator: (id, patch) =>
      mutate({ done: 'Akun petugas diperbarui.', fail: 'Gagal memperbarui akun petugas' }, () =>
        misc.updateUser(id, toUserInput(patch)),
      ),
    deactivateOperator: (id) =>
      mutate(
        { done: 'Akun petugas dinonaktifkan.', fail: 'Gagal menonaktifkan akun petugas' },
        () => misc.updateUser(id, { status: 'disabled' }),
      ),

    resetUserPassword: (id, password) =>
      mutate(
        {
          heavy: 'Kata sandi disetel ulang',
          done: 'Seluruh sesi akun itu dicabut server. Pemiliknya wajib masuk lagi dengan kata sandi baru — sampaikan lewat jalur yang aman.',
          fail: 'Gagal menyetel ulang kata sandi',
        },
        () => misc.resetUserPassword(id, password),
      ),
    suspendUser: (id, suspended, reason) =>
      mutate(
        {
          done: suspended ? 'Akun ditangguhkan.' : 'Penangguhan akun dicabut.',
          fail: suspended ? 'Gagal menangguhkan akun' : 'Gagal mencabut penangguhan',
        },
        () => misc.suspendUser(id, suspended, reason),
      ),

    addBankAccount: (input) =>
      mutate({ done: 'Rekening penerimaan ditambahkan.', fail: 'Gagal menambah rekening' }, () =>
        misc.createBankAccount(input),
      ),
    updateBankAccount: (id, patch) =>
      mutate({ done: 'Rekening penerimaan diperbarui.', fail: 'Gagal memperbarui rekening' }, () =>
        misc.updateBankAccount(id, patch),
      ),
    deleteBankAccount: (id) =>
      mutate({ done: 'Rekening penerimaan dihapus.', fail: 'Gagal menghapus rekening' }, () =>
        misc.deleteBankAccount(id),
      ),
    setPrimaryBank: (id) =>
      mutate({ done: 'Rekening utama diganti.', fail: 'Gagal mengganti rekening utama' }, () =>
        misc.updateBankAccount(id, { is_primary: true }),
      ),

    depositCash: (note) =>
      mutate(
        {
          heavy: 'Setoran diajukan',
          done: 'Kas Anda belum berkurang — nominalnya baru berpindah setelah dinas menerima setoran ini.',
          fail: 'Gagal mengajukan setoran',
        },
        () => misc.createDeposit(note),
      ),
    acceptDeposit: (id) =>
      mutate(
        {
          heavy: 'Setoran diterima',
          done: 'Kas petugas berkurang sebesar nominal setoran dan penerimaan dinas bertambah.',
          fail: 'Gagal menerima setoran',
        },
        () => misc.reviewDeposit(id, 'diterima'),
      ),
    rejectDeposit: (id, note) =>
      mutate(
        { done: 'Setoran ditolak; kas tetap di tangan petugas.', fail: 'Gagal menolak setoran' },
        () => misc.reviewDeposit(id, 'ditolak', note),
      ),

    addComplaint: (type, description) =>
      mutate(
        {
          heavy: 'Aduan terkirim',
          done: 'Aduan Anda masuk antrean petugas dinas. Perkembangannya bisa dilihat di daftar aduan.',
          fail: 'Gagal mengirim aduan',
        },
        () => misc.createComplaint(type, description),
      ),
    setComplaintStatus: (id, status) =>
      mutate(
        { done: `Status aduan diubah menjadi ${status}.`, fail: 'Gagal mengubah status aduan' },
        () => misc.setComplaintStatus(id, status),
      ),

    approveCustomer: (peopleId) =>
      mutate(
        {
          heavy: 'Pendaftar disetujui',
          done: 'Pendaftar kini berstatus aktif dan pindah dari antrean Persetujuan ke daftar Pelanggan.',
          fail: 'Gagal menyetujui pendaftar',
        },
        () => customers.verifyPerson(peopleId),
      ),
    rejectCustomer: (peopleId, reason) =>
      mutate(
        {
          heavy: 'Pendaftar ditolak',
          done: 'Pendaftar ditolak. Seluruh data yang ia kirim, termasuk berkas KTP-nya, sudah dihapus permanen.',
          fail: 'Gagal menolak pendaftar',
        },
        () => customers.rejectPerson(peopleId, reason),
      ),
    // Menandai notifikasi terbaca adalah akibat dari klik, bukan aksi yang dituju:
    // toast di sini akan menimpa layar tujuan yang justru sedang dibuka pengguna.
    markNotificationRead: (id) =>
      mutate({ done: null, fail: 'Gagal menandai notifikasi' }, () =>
        notifications.markNotificationRead(id),
      ),
    markAllNotificationsRead: () =>
      mutate(
        { done: 'Semua notifikasi ditandai terbaca.', fail: 'Gagal menandai notifikasi' },
        () => notifications.markAllNotificationsRead(),
      ),
    clearNotifications: () =>
      mutate({ done: 'Notifikasi dikosongkan.', fail: 'Gagal mengosongkan notifikasi' }, () =>
        notifications.clearNotifications(),
      ),
    // Tanpa toast: barisnya hilang di depan mata pengguna, itu sudah umpan baliknya.
    dismissNotification: (id) =>
      mutate({ done: null, fail: 'Gagal membuang notifikasi' }, () =>
        notifications.dismissNotification(id),
      ),
  };
}
