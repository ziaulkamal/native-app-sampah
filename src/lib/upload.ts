import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { ApiError } from '@/api/errors';
import type { LocalFile } from '@/api/types';

/**
 * Batas ukuran unggahan, disalin dari server (`config/media.php` + `config/documents.php`).
 * Server tetap penjaga sebenarnya; yang di sini hanya menahan berkas yang sudah pasti
 * ditolak agar tidak dikirim dulu — di sinyal seadanya, 422 yang datang setelah
 * mengunggah 12 MB terbaca sebagai aplikasi rusak, bukan sebagai berkas kebesaran.
 */
export const MAX_UPLOAD_MB = 5;

const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

/**
 * Sisi terpanjang gambar setelah dikecilkan. KTP dan foto profil hanya perlu terbaca,
 * bukan dicetak: 1600px sudah melebihi lebar layar mana pun yang akan menampilkannya,
 * sementara foto asli kamera ponsel kini lazim 4000px dan 6–10 MB.
 */
const MAX_DIMENSION = 1600;

/** Kualitas JPEG hasil kompresi. 0,7 masih di atas ambang di mana teks KTP mulai berbayang. */
const QUALITY = 0.7;

/** Ukuran berkas untuk dibaca manusia, satu angka di belakang koma. */
export function fileSizeLabel(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  const power = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length);
  const value = bytes / 1024 ** power;

  return `${value.toFixed(1).replace('.', ',')} ${units[power - 1]}`;
}

/**
 * Alasan penolakan bila berkasnya kebesaran, atau `null` bila boleh dikirim.
 *
 * Beda dari web: yang masuk `bytes`, bukan `File` — di RN tak ada objek `File`, dan
 * ukurannya datang dari `fileSize` milik pemilih gambar. Pesannya tetap menyebut
 * ukuran berkasnya sendiri: yang mengunggah biasanya tak tahu berapa besar foto yang
 * baru ia potret, dan "maksimal 5 MB" tanpa angka pembanding tak memberi tahu
 * seberapa jauh ia melampaui.
 */
export function oversizeReason(bytes: number): string | null {
  if (bytes <= MAX_UPLOAD_BYTES) return null;

  return (
    `Ukuran berkas ${fileSizeLabel(bytes)}, melebihi batas ${MAX_UPLOAD_MB} MB. ` +
    'Pilih gambar lain atau potret ulang dengan resolusi lebih rendah.'
  );
}

/**
 * Bentuk `ApiError` dari penolakan di atas, supaya layar yang memakai `notifyFail`
 * menampilkannya lewat dialog yang sama dengan penolakan server — bagi yang
 * memakainya, berkas kebesaran memang satu jenis kejadian, bukan dua.
 */
export function oversizeError(bytes: number): ApiError | null {
  const reason = oversizeReason(bytes);

  return reason === null ? null : new ApiError('ERR_FILE_TOO_LARGE', 422, reason);
}

/** Bentuk minimum hasil `expo-image-picker` / kamera yang dibutuhkan di sini. */
export interface PickedImage {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  width?: number;
  height?: number;
}

/**
 * Siapkan gambar untuk diunggah.
 *
 * Di web berkasnya dikirim apa adanya dan yang kebesaran ditolak — di sana orang bisa
 * memilih berkas lain dari komputernya. Di ponsel satu-satunya sumber gambar adalah
 * kamera yang baru saja memotretnya, jadi menolak berarti menyuruh orang menyetel
 * resolusi kameranya sendiri. Karena itu gambar dikecilkan dulu, dan penolakan hanya
 * tersisa untuk yang tetap kebesaran setelah itu.
 */
export async function prepareImage(picked: PickedImage, name = 'unggahan.jpg'): Promise<LocalFile> {
  const small =
    picked.fileSize !== null &&
    picked.fileSize !== undefined &&
    picked.fileSize <= MAX_UPLOAD_BYTES &&
    (picked.width ?? 0) <= MAX_DIMENSION;

  if (small) {
    return {
      uri: picked.uri,
      name: picked.fileName ?? name,
      type: picked.mimeType ?? 'image/jpeg',
    };
  }

  const context = ImageManipulator.manipulate(picked.uri);
  context.resize({ width: MAX_DIMENSION });
  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({ compress: QUALITY, format: SaveFormat.JPEG });

  // Namanya dipaksa .jpg: isinya memang sudah JPEG setelah dikompresi, dan nama
  // berakhiran .png untuk isi JPEG membuat validasi mime di server menolaknya.
  return { uri: saved.uri, name: name.replace(/\.[^.]+$/, '') + '.jpg', type: 'image/jpeg' };
}
