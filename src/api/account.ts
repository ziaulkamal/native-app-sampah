import { del, post, put } from './client';
import type { LocalFile, UserDto } from './types';

/**
 * Profil akun sendiri — berlaku untuk semua role.
 *
 * Membacanya lewat `GET /me` (lihat `api/auth.ts`), jadi tak ada `getMyAccount` di
 * sini: dua jalur baca untuk profil yang sama hanya menambah tempat yang bisa
 * berbeda isi. Ganti kata sandi juga tetap di `auth.ts` — ia sudah tersambung
 * dari sana sejak §4b, dan memindahkannya menyentuh kode yang bekerja tanpa
 * memberi apa pun.
 */

export interface MyAccountInput {
  name?: string;
  email?: string | null;
  phone?: string | null;
}

/**
 * `username` dan `role_id` sengaja **tidak** ada di sini: identitas masuk dan
 * kewenangan bukan urusan profil sendiri, dan servernya pun menolak keduanya.
 */
export const updateMyAccount = (input: MyAccountInput): Promise<UserDto> =>
  put<UserDto>('/my/account', input);

/** Foto profil sendiri; multipart karena berupa berkas. */
export function uploadMyAvatar(file: LocalFile): Promise<UserDto> {
  const form = new FormData();
  // RN mengenali `{ uri, name, type }` di FormData, tapi tipenya menuntut Blob.
  form.append('avatar', file as unknown as Blob);

  return post<UserDto>('/my/avatar', form);
}

/**
 * Cabut foto profil sendiri. Idempoten di server, jadi menekannya dua kali —
 * mis. karena jaringan lambat lalu ditekan ulang — tetap berakhir 200.
 */
export const deleteMyAvatar = (): Promise<UserDto> => del<UserDto>('/my/avatar');
