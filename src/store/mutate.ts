import type { Dispatch, SetStateAction } from 'react';
import { toComplaint } from '@/api/adapters/billing';
import { toApiError } from '@/api/errors';
import * as misc from '@/api/misc';
import * as notifications from '@/api/notifications';
import type { Feedback, MutationOutcome } from './dataTypes';
import type { FeedbackActions } from './feedback';
import { loadFor } from './loaders';
import { resyncBaseline } from './pulseBaseline';
import type { AppState } from './types';
import type { Session } from '@/types';

type Setter = Dispatch<SetStateAction<AppState>>;

/** Pemuatan ulang + pembungkus mutasi yang dipakai seluruh aksi di `dataActions`. */
export interface MutationPlumbing {
  refresh: () => Promise<void>;
  refreshQuietly: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  refreshComplaints: () => Promise<void>;
  mutate: (fb: Feedback, task: () => Promise<unknown>) => Promise<MutationOutcome>;
}

/**
 * Pipa yang dibagi semua aksi: memuat ulang data, dan menjalankan satu mutasi lalu
 * melaporkan hasilnya. Dipisah dari daftar aksinya karena ini perkakas, bukan aksi —
 * daftar aksi bertambah terus, sementara tiga fungsi ini praktis tidak berubah.
 */
export function createMutationPlumbing(
  set: Setter,
  session: Session | null,
  feedback: FeedbackActions,
): MutationPlumbing {
  /**
   * `quiet` untuk pemuatan yang dipicu denyut data, bukan oleh pengguna: `dataState`
   * tak disentuh, jadi tak ada spanduk "memuat" yang berkedip di tengah pekerjaannya.
   */
  const load = async (quiet: boolean): Promise<void> => {
    if (session === null) return;
    if (!quiet) set((s) => ({ ...s, dataState: 'loading', dataError: null }));
    try {
      const slice = await loadFor(session.role);
      // `dataRevision` naik tiap pemuatan berhasil; layar yang menarik datanya sendiri
      // (mis. antrean pengajuan) memakainya sebagai isyarat untuk ikut menyegarkan diri.
      set((s) => ({ ...s, ...slice, dataState: 'normal', dataRevision: s.dataRevision + 1 }));
    } catch (cause) {
      // Kegagalan di latar ditelan: data lama masih berguna dan pengguna tidak memintanya.
      if (quiet) return;
      set((s) => ({ ...s, dataState: 'error', dataError: toApiError(cause).message }));
    }
  };

  const refresh = (): Promise<void> => load(false);
  const refreshQuietly = (): Promise<void> => load(true);

  const refreshNotifications = async (): Promise<void> => {
    if (session === null) return;
    try {
      const list = await notifications.listNotifications();
      set((s) => ({ ...s, notifications: list }));
    } catch {
      // Lencana bukan alasan untuk menyalakan galat global; angka lama dibiarkan
      // bertahan sampai percobaan berikutnya berhasil.
    }
  };

  /**
   * Muat ulang daftar aduan saja. Admin yang sudah lama membuka konsol tak pernah
   * menarik ulang apa pun sampai ada mutasi, jadi aduan yang baru masuk hanya
   * terlihat setelah muat ulang halaman. Sama seperti notifikasi: senyap, tanpa
   * menyentuh `dataState`, dan kegagalannya ditelan — daftar lama masih berguna.
   */
  const refreshComplaints = async (): Promise<void> => {
    if (session === null) return;
    try {
      const page =
        session.role === 'pelanggan' ? await misc.listMyComplaints() : await misc.listComplaints();
      set((s) => ({ ...s, complaints: page.data.map(toComplaint) }));
    } catch {
      // Lihat alasan di `refreshNotifications`.
    }
  };

  /**
   * Jalankan mutasi, muat ulang, lalu laporkan hasilnya. Galat dikembalikan sebagai
   * kode dan tidak dilempar — pemanggil yang perlu bercabang (menutup modal, pindah
   * layar) memakainya, tetapi **tidak wajib**: pemberitahuannya sudah terbit di sini.
   */
  const mutate = async (fb: Feedback, task: () => Promise<unknown>): Promise<MutationOutcome> => {
    try {
      await task();
    } catch (cause) {
      const error = toApiError(cause);
      // `dataError` dipertahankan: spanduk pemuatan global dan beberapa form masih
      // membacanya sebagai pesan galat terakhir.
      set((s) => ({ ...s, dataError: error.message }));
      feedback.notifyFail(fb.fail, error);
      return error.code;
    }
    await refresh();
    // Patokan denyut disetel ulang: data kini lebih baru daripada cap yang tersimpan, dan
    // tanpa ini denyut berikutnya memuat ulang apa yang baru saja dimuat.
    void resyncBaseline();
    if (fb.done === null) return null;
    if (fb.heavy === undefined) feedback.notify(fb.done);
    else feedback.notifyDone(fb.heavy, fb.done);
    return null;
  };

  return { refresh, refreshQuietly, refreshNotifications, refreshComplaints, mutate };
}
