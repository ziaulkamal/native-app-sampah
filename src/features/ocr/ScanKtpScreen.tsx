import { useCallback, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ActivityIndicator, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useApp } from '@/store/AppContext';
import { parseKtp, type KtpScan } from './ktpParser';
import { setLastScan } from './scanBridge';

/**
 * Pemindai KTP — satu-satunya fitur native yang tak punya asal di web (Tahap 6).
 *
 * **On-device, tanpa cadangan awan.** Dua alasan: NIK adalah data kependudukan yang
 * tak perlu meninggalkan ponsel hanya untuk dibaca, dan backend memang belum punya
 * satu pun endpoint OCR (diverifikasi saat audit Tahap 1) — "fallback cloud" di master
 * prompt tak punya tempat untuk dituju. Lihat PRD §11 bila kelak ingin diadakan.
 *
 * Memotret lalu mengenali, bukan frame processor: `@react-native-ml-kit/text-recognition`
 * bekerja atas berkas gambar, dan mengenali tiap frame berarti membaca puluhan kali
 * per detik untuk kartu yang diam. Foto tunggal juga memberi pengguna satu momen jelas
 * untuk menahan kartunya diam — hasil OCR-nya justru lebih baik. Karena itu pula
 * kameranya `expo-camera`, bukan VisionCamera: yang kita pakai hanya satu jepretan.
 */
export function ScanKtpScreen() {
  const navigation = useNavigation();
  const { notifyFail } = useApp();
  const camera = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [busy, setBusy] = useState(false);

  const scan = useCallback(async () => {
    if (camera.current === null || busy) return;
    setBusy(true);
    try {
      // `quality: 1` — teks kecil di KTP yang paling dulu hancur oleh kompresi JPEG.
      const photo = await camera.current.takePictureAsync({ quality: 1, exif: false });
      const result = await TextRecognition.recognize(photo.uri);
      const parsed: KtpScan = parseKtp(result.text);

      // Tanpa NIK hasilnya tak berguna: nama masih harus diketik, dan mengisi form
      // dengan tebakan separuh lebih menyesatkan daripada membiarkannya kosong.
      if (parsed.identityNumber === null) {
        notifyFail(
          'Gagal membaca KTP',
          new Error('NIK tidak terbaca. Pastikan kartu terang, rata, dan penuh di kotak.'),
        );
        return;
      }
      setLastScan(parsed);
      navigation.goBack();
    } catch (cause) {
      notifyFail('Gagal membaca KTP', cause);
    } finally {
      setBusy(false);
    }
  }, [busy, navigation, notifyFail]);

  // `null` berarti status izin belum terbaca — beda dari ditolak, jadi jangan
  // menampilkan ajakan memberi izin sebelum jawabannya diketahui.
  if (permission === null) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <ActivityIndicator />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 justify-center bg-bg p-6">
        <EmptyState
          icon="camera"
          title="Izin kamera diperlukan"
          message="Pemindaian berjalan sepenuhnya di ponsel — foto KTP tidak dikirim ke mana pun."
          action={<Button label="Beri izin kamera" onPress={() => void requestPermission()} />}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView ref={camera} facing="back" style={{ flex: 1 }} />

      {/* Bingkai bantu: rasio KTP 85,6 × 54 mm ≈ 1,585. */}
      <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
        <View style={{ aspectRatio: 1.585 }} className="w-[88%] rounded-xl2 border-2 border-lime" />
      </View>

      <View className="absolute inset-x-0 bottom-0 gap-3 p-6">
        <Text className="text-center font-sans text-[12.5px] leading-5 text-white">
          Letakkan KTP di dalam bingkai. Hasil bacaan tetap bisa Anda koreksi sebelum dikirim.
        </Text>
        <Button
          label={busy ? 'Membaca…' : 'Pindai'}
          disabled={busy}
          onPress={() => void scan()}
          full
        />
      </View>

      {busy && (
        <View className="absolute inset-0 items-center justify-center bg-black/40">
          <ActivityIndicator color="#FFFFFF" size="large" />
        </View>
      )}
    </View>
  );
}
