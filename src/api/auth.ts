import { get, post, put } from './client';
import { clearToken, writeToken } from './tokenStore';
import type { LocalFile, OtpChannel, SessionDto, UserDto } from './types';

/**
 * Endpoint autentikasi — porting `src/api/auth.ts` web.
 *
 * Backend tidak berubah sedikit pun untuk aplikasi ini: `/auth/login` sudah
 * menerbitkan Sanctum Personal Access Token sejak awal, dan itu token yang sama yang
 * dipakai web. Yang berbeda hanya tempat menyimpannya (Keystore) dan bahwa
 * `writeToken` di sini asinkron sehingga ikut di-`await`.
 */

/** Kredensial masuk; `code` hanya diisi akun Super Admin (TOTP 6 digit). */
export interface Credentials {
  username: string;
  password: string;
  code?: string;
}

/** Data pendaftaran mandiri pelanggan; KTP wajib ikut sebagai berkas. */
export interface RegistrationInput {
  fullName: string;
  identityNumber: string;
  gender: 'L' | 'P';
  phoneNumber: string;
  email?: string;
  password: string;
  passwordConfirmation: string;
  /** Foto KTP dari kamera atau galeri — di web tipenya `File`. */
  ktp: LocalFile;
}

/** Masuk dengan sandi. Token langsung disimpan supaya permintaan berikutnya terautentikasi. */
export async function login(credentials: Credentials): Promise<UserDto> {
  const session = await post<SessionDto>('/auth/login', {
    username: credentials.username,
    password: credentials.password,
    code: credentials.code === '' ? undefined : credentials.code,
  });
  await writeToken(session.token);
  return session.user;
}

/** Minta kode sekali pakai. Balasan server selalu sama, ada atau tidak ada akunnya. */
export async function requestOtp(destination: string, channel: OtpChannel): Promise<void> {
  await post<null>('/auth/otp/request', { destination, channel });
}

/** Tukar kode sekali pakai jadi sesi. */
export async function verifyOtp(
  destination: string,
  channel: OtpChannel,
  code: string,
): Promise<UserDto> {
  const session = await post<SessionDto>('/auth/otp/verify', { destination, channel, code });
  await writeToken(session.token);
  return session.user;
}

/** Pendaftaran mandiri; akun baru menunggu verifikasi admin dan belum bisa masuk. */
export async function register(input: RegistrationInput): Promise<void> {
  await post<{ status: string }>('/auth/register', toFormData(input));
}

/** Profil sesi berjalan — sumber kebenaran role & level, dipakai saat memulihkan sesi. */
export const me = (): Promise<UserDto> => get<UserDto>('/me');

/** Ganti kata sandi sendiri. Sesi ini tetap hidup; sesi lain dikeluarkan server. */
export async function changeMyPassword(currentPassword: string, password: string): Promise<void> {
  await put<null>('/my/password', {
    current_password: currentPassword,
    password,
    password_confirmation: password,
  });
}

/** Akhiri sesi di server lalu buang token lokal. Token tetap dibuang walau server gagal. */
export async function logout(): Promise<void> {
  try {
    await post<null>('/auth/logout');
  } finally {
    await clearToken();
  }
}

function toFormData(input: RegistrationInput): FormData {
  const form = new FormData();
  form.append('full_name', input.fullName);
  form.append('identity_number', input.identityNumber);
  form.append('gender', input.gender);
  form.append('phone_number', input.phoneNumber);
  if (input.email !== undefined && input.email !== '') form.append('email', input.email);
  form.append('password', input.password);
  form.append('password_confirmation', input.passwordConfirmation);
  // RN menerima objek {uri,name,type} di sini, tapi lib.dom mengetik `append` hanya
  // untuk Blob|string. Cast-nya dikurung di satu baris ini saja.
  form.append('ktp', input.ktp as unknown as Blob);
  return form;
}
