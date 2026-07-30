import type { Dispatch, SetStateAction } from 'react';
import { ApiError, toApiError } from '@/api/errors';
import type { AppState } from './types';

/**
 * Umpan balik aksi yang seragam untuk ketiga persona (PLAN §23).
 *
 * Dua saluran, dibedakan oleh apakah hasilnya sudah terlihat di layar:
 * **toast** untuk aksi yang efeknya langsung tampak (baris hilang, modal tertutup),
 * **dialog** untuk aksi berat yang hasilnya tak kasatmata dan untuk semua kegagalan.
 *
 * Sumber teksnya tetap server: `toApiError()` membawa pesan yang sudah ter-lokalisasi
 * beserta `code`, dan dialog menampilkannya apa adanya. Klien hanya menambah judul —
 * menulis ulang pesan di sini akan melahirkan dua kebenaran yang cepat berselisih.
 */

type Setter = Dispatch<SetStateAction<AppState>>;

/**
 * Nada dialog. `fail` dan `error` sengaja dipisah karena tindak lanjutnya berbeda:
 * `fail` minta pengguna memperbaiki sesuatu, `error` minta ia mencoba lagi atau
 * menghubungi admin — di luar kuasanya.
 */
export type AlertTone = 'success' | 'fail' | 'error';

export interface AlertSpec {
  tone: AlertTone;
  title: string;
  message: string;
  /** Kode galat server (`ERR_*`), supaya bisa disebut saat melapor. */
  code?: string;
}

export interface ConfirmSpec {
  title: string;
  message: string;
  /** Label tombol pelaksana; sebutkan aksinya ("Hapus zona"), bukan "OK". */
  confirmLabel?: string;
  cancelLabel?: string;
  /**
   * Warna tombol pelaksana. Merah (bawaan) untuk yang merusak; `primary` untuk aksi
   * yang tak bisa dibatalkan tapi memang dituju — menerima setoran bukan kerusakan,
   * dan mewarnainya merah lama-lama membuat merah berhenti berarti apa pun.
   */
  tone?: 'danger' | 'primary';
}

export interface ToastSpec {
  id: number;
  tone: 'success' | 'error';
  message: string;
}

export interface FeedbackActions {
  /** Toast berhasil — untuk aksi yang efeknya sudah terlihat di layar. */
  notify: (message: string) => void;
  /** Dialog berhasil — untuk aksi berat yang hasilnya tidak kasatmata. */
  notifyDone: (title: string, message: string) => void;
  /** Dialog gagal/galat. Nada dipilih dari status galatnya, pesan datang dari server. */
  notifyFail: (title: string, cause: unknown) => void;
  /**
   * Konfirmasi aksi merusak. Menunggu jawaban pengguna, `true` bila ia melanjutkan.
   * Dipakai `await`, jadi pemanggil tetap membaca lurus dari atas ke bawah.
   */
  askConfirm: (spec: ConfirmSpec) => Promise<boolean>;
  closeAlert: () => void;
  /** Dipanggil dialog konfirmasi: menutup dialog sekaligus menjawab janjinya. */
  answerConfirm: (agreed: boolean) => void;
  dismissToast: (id: number) => void;
}

let seq = 0;

export function createFeedbackActions(set: Setter): FeedbackActions {
  // Penjawab konfirmasi yang sedang menunggu. Disimpan di closure dan bukan di state
  // karena isinya fungsi: state React harus tetap berupa data yang bisa dibandingkan.
  let pending: ((agreed: boolean) => void) | null = null;

  const showAlert = (alertSpec: AlertSpec): void => set((s) => ({ ...s, alertSpec }));

  return {
    notify: (message) =>
      set((s) => ({ ...s, toasts: [...s.toasts, { id: ++seq, tone: 'success', message }] })),

    notifyDone: (title, message) => showAlert({ tone: 'success', title, message }),

    notifyFail: (title, cause) => {
      const error = toApiError(cause);
      showAlert({ tone: toneOf(error), title, message: error.message, code: error.code });
    },

    askConfirm: (spec) =>
      new Promise<boolean>((resolve) => {
        // Konfirmasi lama yang belum dijawab dianggap dibatalkan: membiarkan janjinya
        // menggantung berarti pemanggilnya berhenti selamanya di tengah aksi.
        pending?.(false);
        pending = resolve;
        set((s) => ({ ...s, pendingConfirm: spec }));
      }),

    closeAlert: () => set((s) => ({ ...s, alertSpec: null })),

    answerConfirm: (agreed) => {
      const resolve = pending;
      pending = null;
      set((s) => ({ ...s, pendingConfirm: null }));
      resolve?.(agreed);
    },

    dismissToast: (id) => set((s) => ({ ...s, toasts: s.toasts.filter((t) => t.id !== id) })),
  };
}

/**
 * Galat jaringan (`status` 0) dan galat server (5xx) di luar kuasa pengguna — tak ada
 * isian yang bisa ia perbaiki. Selebihnya (validasi, aturan bisnis, hak akses) adalah
 * penolakan beralasan yang bisa ia tindak lanjuti sendiri.
 */
function toneOf(error: ApiError): AlertTone {
  return error.status === 0 || error.status >= 500 ? 'error' : 'fail';
}
