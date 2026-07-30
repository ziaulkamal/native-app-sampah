import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { Image, Text, View } from 'react-native';
import type { LocalFile } from '@/api/types';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { takeLastScan } from '@/features/ocr/scanBridge';
import { pickFromCamera, pickFromGallery } from '@/lib/pickImage';
import { MAX_UPLOAD_MB, prepareImage, type PickedImage } from '@/lib/upload';
import type { AuthStackParams, RootStackParams } from '@/navigation/types';
import { useApp } from '@/store/AppContext';
import { useTheme } from '@/theme/ThemeProvider';
import { colors } from '@/tokens/tokens';
import { AuthLayout } from './AuthLayout';
import { digitsOnly } from './format';
import { AuthAlert, AuthField, AuthLink, AuthNotice, ChoiceTabs } from './parts';

type Props = NativeStackScreenProps<AuthStackParams, 'Register'>;

/** Nilai form pendaftaran mandiri; semua string agar terkendali penuh oleh input. */
interface FormValues {
  fullName: string;
  identityNumber: string;
  gender: 'L' | 'P';
  phoneNumber: string;
  email: string;
  password: string;
  passwordConfirmation: string;
}

const EMPTY: FormValues = {
  fullName: '',
  identityNumber: '',
  gender: 'L',
  phoneNumber: '',
  email: '',
  password: '',
  passwordConfirmation: '',
};

/** Pendaftaran mandiri pelanggan. Hasilnya menunggu verifikasi admin dinas. */
export function RegisterPelanggan({ navigation }: Props) {
  const { registerCustomer, notifyFail, authState, authError, authFieldErrors } = useApp();
  const { mode } = useTheme();
  // Pemindai tinggal di tumpukan akar, bukan di alur auth: layar yang sama dipakai
  // lagi nanti dari dalam aplikasi. Aksinya menggelembung ke sana lewat useNavigation.
  const root = useNavigation<NativeStackNavigationProp<RootStackParams>>();
  const [values, setValues] = useState<FormValues>(EMPTY);
  const [ktp, setKtp] = useState<LocalFile | null>(null);
  const [busy, setBusy] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [done, setDone] = useState(false);

  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));
  const error = (field: string) => authFieldErrors?.[field]?.[0];
  const loading = authState === 'loading';

  /*
   * Hasil pindai diambil saat layar ini kembali terlihat, bukan lewat params rute:
   * NIK tak boleh ikut tersimpan di state navigasi yang bisa dipulihkan sistem.
   * Lihat `features/ocr/scanBridge.ts`.
   */
  useFocusEffect(
    useCallback(() => {
      const scan = takeLastScan();
      if (scan === null) return;
      setValues((v) => ({
        ...v,
        identityNumber: scan.identityNumber ?? v.identityNumber,
        fullName: scan.fullName ?? v.fullName,
        gender: scan.gender ?? v.gender,
      }));
      setScanned(true);
    }, []),
  );

  /*
   * Berkas dikecilkan segera setelah dipilih, bukan saat dikirim. Yang mendaftar
   * memotret KTP-nya di tempat dengan sinyal seadanya; mengecilkannya di muka membuat
   * satu-satunya penantian yang tersisa adalah unggahan itu sendiri.
   */
  async function chooseKtp(source: () => Promise<PickedImage | null>) {
    setBusy(true);
    try {
      const picked = await source();
      if (picked !== null) setKtp(await prepareImage(picked, 'ktp.jpg'));
    } catch (cause) {
      notifyFail('Gagal mengambil foto KTP', cause);
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    if (ktp === null || loading || busy) return;
    if ((await registerCustomer({ ...values, ktp })) === null) setDone(true);
  }

  if (done) return <Submitted onDone={() => navigation.navigate('LoginPelanggan')} />;

  return (
    <AuthLayout
      title="Buat akun"
      subtitle="Daftar sebagai pelanggan layanan persampahan. Data Anda diverifikasi admin dinas."
      onBack={() => navigation.goBack()}
    >
      <AuthAlert message={authError} />
      {scanned && (
        <AuthNotice message="Isian di bawah terbaca dari KTP. Periksa dan betulkan sebelum dikirim." />
      )}

      <Button
        variant="secondary"
        className="mb-4"
        full
        icon={<Icon name="camera" size={16} color={colors[mode].olive} />}
        label="Pindai KTP untuk mengisi otomatis"
        onPress={() => root.navigate('ScanKtp')}
      />

      <AuthField
        label="Nama lengkap"
        icon="user"
        placeholder="Sesuai KTP"
        value={values.fullName}
        onChangeText={(text) => set('fullName', text)}
        error={error('full_name')}
      />
      <AuthField
        label="NIK"
        icon="shield"
        placeholder="16 digit"
        keyboardType="number-pad"
        maxLength={16}
        value={values.identityNumber}
        onChangeText={(text) => set('identityNumber', digitsOnly(text, 16))}
        error={error('identity_number')}
      />

      <Text className="mb-2 font-sans text-[12.5px] font-semibold text-ink">Jenis kelamin</Text>
      <ChoiceTabs<'L' | 'P'>
        value={values.gender}
        onChange={(g) => set('gender', g)}
        options={[
          { id: 'L', label: 'Laki-laki' },
          { id: 'P', label: 'Perempuan' },
        ]}
      />

      <AuthField
        label="Nomor WhatsApp"
        icon="whatsapp"
        placeholder="0812 3456 7890"
        keyboardType="phone-pad"
        value={values.phoneNumber}
        onChangeText={(text) => set('phoneNumber', text)}
        error={error('phone_number')}
        hint="Dipakai untuk masuk dan menerima kode OTP."
      />
      <AuthField
        label="Email (opsional)"
        icon="user"
        placeholder="anda@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        value={values.email}
        onChangeText={(text) => set('email', text)}
        error={error('email')}
      />
      <AuthField
        label="Kata sandi"
        icon="lock"
        placeholder="Minimal 8 karakter"
        secureTextEntry
        autoComplete="new-password"
        value={values.password}
        onChangeText={(text) => set('password', text)}
        error={error('password')}
      />
      <AuthField
        label="Ulangi kata sandi"
        icon="lock"
        placeholder="Ketik ulang"
        secureTextEntry
        autoComplete="new-password"
        value={values.passwordConfirmation}
        onChangeText={(text) => set('passwordConfirmation', text)}
      />

      <KtpUpload
        file={ktp}
        busy={busy}
        error={error('ktp')}
        onCamera={() => void chooseKtp(pickFromCamera)}
        onGallery={() => void chooseKtp(pickFromGallery)}
      />

      <Button
        full
        className="mt-2"
        label={loading ? 'Mengirim…' : 'Daftar'}
        disabled={loading || busy || ktp === null}
        onPress={() => void submit()}
      />

      <AuthLink
        text="Sudah punya akun?"
        action="Masuk"
        onPress={() => navigation.navigate('LoginPelanggan')}
      />
    </AuthLayout>
  );
}

function KtpUpload({
  file,
  busy,
  error,
  onCamera,
  onGallery,
}: {
  file: LocalFile | null;
  busy: boolean;
  error?: string;
  onCamera: () => void;
  onGallery: () => void;
}) {
  return (
    <View className="mb-3.5">
      <Text className="mb-2 font-sans text-[12.5px] font-semibold text-ink">Foto KTP</Text>

      {file !== null && (
        <Image
          source={{ uri: file.uri }}
          accessibilityLabel="Pratinjau foto KTP"
          resizeMode="cover"
          className="mb-2 h-[160px] w-full rounded-[14px] bg-ph"
        />
      )}

      <View className="flex-row gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          label={file === null ? 'Kamera' : 'Potret ulang'}
          disabled={busy}
          onPress={onCamera}
        />
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          label="Galeri"
          disabled={busy}
          onPress={onGallery}
        />
      </View>

      <Text
        className={`mt-1.5 font-sans text-[11px] leading-snug ${
          error === undefined ? 'text-dim' : 'font-semibold text-danger'
        }`}
      >
        {error ??
          (busy
            ? 'Menyiapkan gambar…'
            : `Dikecilkan otomatis sebelum dikirim (batas server ${MAX_UPLOAD_MB} MB). Disimpan terenkripsi; hanya petugas berwenang yang bisa membukanya.`)}
      </Text>
    </View>
  );
}

/** Layar setelah pendaftaran terkirim — pendaftar belum bisa masuk sampai diverifikasi. */
function Submitted({ onDone }: { onDone: () => void }) {
  return (
    <AuthLayout
      title="Pendaftaran terkirim"
      subtitle="Terima kasih. Admin dinas akan memeriksa data dan dokumen Anda."
    >
      <Text className="font-sans text-[13px] leading-relaxed text-dim">
        Akun Anda aktif setelah diverifikasi. Setelah itu Anda bisa masuk memakai nomor WhatsApp —
        dengan kata sandi atau kode sekali pakai.
      </Text>
      <Button full className="mt-6" label="Ke layar masuk" onPress={onDone} />
    </AuthLayout>
  );
}
