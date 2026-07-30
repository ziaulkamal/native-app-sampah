import * as ImagePicker from 'expo-image-picker';
import type { PickedImage } from './upload';

/**
 * Ambil satu gambar dari kamera atau galeri.
 *
 * Web memakai satu `<input type="file">` yang menyerahkan pilihan sumbernya ke sistem
 * operasi. Android tidak punya padanan itu, jadi sumbernya dipilih di layar pemanggil
 * dan modul ini hanya membungkus dua panggilan yang bentuk hasilnya sudah sama —
 * `prepareImage()` di `upload.ts` yang kemudian mengecilkannya.
 */
const OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  // Tanpa kompresi di sini: `prepareImage()` yang menanganinya, satu tempat saja.
  quality: 1,
  exif: false,
};

/**
 * `null` bila pengguna membatalkan. Tanpa permintaan izin: Android memakai photo picker
 * sistem, yang menyerahkan satu gambar tanpa aplikasi perlu akses ke seluruh galeri.
 */
export async function pickFromGallery(): Promise<PickedImage | null> {
  return firstAsset(await ImagePicker.launchImageLibraryAsync(OPTIONS));
}

/** Idem, dari kamera — yang ini memang menuntut izin. Penolakannya dilempar agar bisa dijelaskan. */
export async function pickFromCamera(): Promise<PickedImage | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted)
    throw new Error('Izin kamera ditolak. Berikan izin lewat Pengaturan aplikasi.');

  return firstAsset(await ImagePicker.launchCameraAsync(OPTIONS));
}

function firstAsset(result: ImagePicker.ImagePickerResult): PickedImage | null {
  const asset = result.canceled ? undefined : result.assets[0];
  if (asset === undefined) return null;

  return {
    uri: asset.uri,
    fileName: asset.fileName,
    mimeType: asset.mimeType,
    fileSize: asset.fileSize,
    width: asset.width,
    height: asset.height,
  };
}
