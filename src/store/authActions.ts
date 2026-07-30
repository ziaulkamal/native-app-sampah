import type { Dispatch, SetStateAction } from 'react';
import { toSession } from '@/api/adapters/session';
import * as api from '@/api/auth';
import { type ApiError, toApiError } from '@/api/errors';
import { loadToken, readToken } from '@/api/tokenStore';
import type { OtpChannel, UserDto } from '@/api/types';
import type { AppState } from './types';

/** Hasil satu aksi auth: `null` bila berhasil, selain itu kode galat (`ERR_*`). */
export type AuthOutcome = string | null;

/** Aksi seputar masuk/keluar. Semuanya menelan galat dan mengembalikan kodenya. */
export interface AuthActions {
  signIn: (credentials: api.Credentials) => Promise<AuthOutcome>;
  sendOtp: (destination: string, channel: OtpChannel) => Promise<AuthOutcome>;
  signInWithOtp: (destination: string, channel: OtpChannel, code: string) => Promise<AuthOutcome>;
  registerCustomer: (input: api.RegistrationInput) => Promise<AuthOutcome>;
  signOut: () => void;
  /** Pulihkan sesi dari token tersimpan; role selalu diambil ulang dari server. */
  restoreSession: () => Promise<void>;
  /** Tutup sesi lokal tanpa memanggil server — dipakai saat server menolak token. */
  endSession: () => void;
  /**
   * Baca ulang profil sendiri dan perbarui sesinya saja.
   *
   * Berbeda dari `restoreSession`: yang itu memakai `opened()` yang ikut memindahkan
   * layar ke beranda role — benar saat baru masuk, keliru saat pengguna baru saja
   * mengganti fotonya di layar Profil.
   */
  refreshSession: () => Promise<void>;
}

type Setter = Dispatch<SetStateAction<AppState>>;

export function createAuthActions(set: Setter): AuthActions {
  const begin = () =>
    set((s) => ({ ...s, authState: 'loading', authError: null, authFieldErrors: null }));
  const fail = (error: ApiError): AuthOutcome => {
    set((s) => ({
      ...s,
      authState: 'error',
      authError: error.message,
      authFieldErrors: error.errors ?? null,
    }));
    return error.code;
  };

  const withSession = async (task: () => Promise<UserDto>): Promise<AuthOutcome> => {
    begin();
    try {
      const user = await task();
      set((s) => ({ ...s, ...opened(user) }));
      return null;
    } catch (cause) {
      return fail(toApiError(cause));
    }
  };

  const withoutSession = async (task: () => Promise<void>): Promise<AuthOutcome> => {
    begin();
    try {
      await task();
      set((s) => ({ ...s, authState: 'normal' }));
      return null;
    } catch (cause) {
      return fail(toApiError(cause));
    }
  };

  const endSession = () => set(closed);

  return {
    signIn: (credentials) => withSession(() => api.login(credentials)),
    sendOtp: (destination, channel) => withoutSession(() => api.requestOtp(destination, channel)),
    signInWithOtp: (destination, channel, code) =>
      withSession(() => api.verifyOtp(destination, channel, code)),
    registerCustomer: (input) => withoutSession(() => api.register(input)),
    signOut: () => {
      // Token dibuang lokal lebih dulu supaya UI tidak menunggu jaringan untuk keluar.
      void api.logout();
      endSession();
    },
    endSession,
    restoreSession: () => restore(set),
    refreshSession: async () => {
      try {
        const user = await api.me();
        set((s) => ({ ...s, session: toSession(user) }));
      } catch {
        // Gagal menyegarkan bukan alasan mengeluarkan pengguna: yang tampil jadi
        // sedikit tertinggal, dan itu jauh lebih ringan daripada memutus sesi
        // yang sebenarnya masih sah.
      }
    },
  };
}

async function restore(set: Setter): Promise<void> {
  // Beda dari web: token tinggal di Keystore dan dibacanya asinkron, jadi cache-nya
  // harus terisi lebih dulu. `readToken()` di bawah membaca cache itu.
  await loadToken();
  if (readToken() === null) {
    set((s) => ({ ...s, booted: true }));
    return;
  }
  try {
    const user = await api.me();
    set((s) => ({ ...s, ...opened(user), booted: true }));
  } catch {
    // Token ditolak atau server tak terjangkau — mulai dari layar masuk.
    set((s) => ({ ...s, session: null, booted: true }));
  }
}

/**
 * Perubahan state saat sesi terbuka. Layar awal tidak diatur di sini seperti di web:
 * `RootNavigator` memilih navigator dari `session.role`, jadi menyimpan `screen` di
 * store berarti dua pihak menentukan layar yang sama.
 */
function opened(user: UserDto): Partial<AppState> {
  return { session: toSession(user), authState: 'normal', authError: null };
}

function closed(state: AppState): AppState {
  return { ...state, session: null, authState: 'normal', authError: null };
}
