import TextRecognition from '@react-native-ml-kit/text-recognition';
import { parseKtp, type KtpScan } from './ktpParser';

/**
 * Kenali satu berkas gambar KTP menjadi isian formulir. Seluruhnya di ponsel.
 *
 * Dipisah dari layar pemindai karena gambarnya bisa datang dari dua arah: jepretan
 * kamera di layar itu, atau foto lama yang dipilih dari galeri di layar pendaftaran.
 */
export async function recognizeKtp(uri: string): Promise<KtpScan> {
  const result = await TextRecognition.recognize(uri);
  return parseKtp(result.text);
}
