import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import type { LocalFile } from '@/api/types';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { recognizeKtp } from '@/features/ocr/recognizeKtp';
import { takeLastScan } from '@/features/ocr/scanBridge';
import { pickFromCamera, pickFromGallery } from '@/lib/pickImage';
import { MAX_UPLOAD_MB, prepareImage, type PickedImage } from '@/lib/upload';
import type { AuthStackParams, RootStackParams } from '@/navigation/types';
import { useApp } from '@/store/AppContext';
import { useTheme } from '@/theme/ThemeProvider';
import { colors, shadows } from '@/tokens/tokens';
import { AuthLayout } from './AuthLayout';
import { digitsOnly } from './format';
import { AuthAlert, AuthCard, AuthDivider, AuthField, AuthLink, ChoiceTabs } from './parts';

type Props = NativeStackScreenProps<AuthStackParams, 'Register'>;
type Step = 1 | 2 | 3;
/** Kolom yang bisa datang dari KTP; sisanya selalu diketik sendiri. */
type KtpField = 'fullName' | 'identityNumber' | 'gender';

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

const NO_SCAN: Record<KtpField, boolean> = {
  fullName: false,
  identityNumber: false,
  gender: false,
};

const HEAD: Record<Step, { title: string; subtitle: string }> = {
  1: { title: 'Identitas Anda', subtitle: 'Pindai KTP sekali, tiga kolom terisi sendiri.' },
  2: { title: 'Periksa hasil pindai', subtitle: 'Betulkan yang keliru sebelum dikirim.' },
  3: { title: 'Kontak & sandi', subtitle: 'Dipakai untuk masuk setelah akun diverifikasi.' },
};

/**
 * Pendaftaran mandiri pelanggan, tiga langkah. Hasilnya menunggu verifikasi admin dinas.
 *
 * Seluruh isian tetap di SATU komponen meski layarnya tiga: memecahnya jadi tiga rute
 * berarti NIK berpindah lewat params rute, yang bisa diserialkan dan dipulihkan sistem.
 * Lihat `features/ocr/scanBridge.ts` untuk alasan yang sama pada hasil pindai.
 */
export function RegisterPelanggan({ navigation }: Props) {
  const { registerCustomer, notifyFail, authState, authError, authFieldErrors } = useApp();
  const { mode } = useTheme();
  // Pemindai tinggal di tumpukan akar, bukan di alur auth: layar yang sama dipakai
  // lagi nanti dari dalam aplikasi. Aksinya menggelembung ke sana lewat useNavigation.
  const root = useNavigation<NativeStackNavigationProp<RootStackParams>>();
  const [step, setStep] = useState<Step>(1);
  const [values, setValues] = useState<FormValues>(EMPTY);
  const [fromKtp, setFromKtp] = useState<Record<KtpField, boolean>>(NO_SCAN);
  const [ktp, setKtp] = useState<LocalFile | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const error = (field: string) => authFieldErrors?.[field]?.[0];
  const loading = authState === 'loading';

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    // Diketik sendiri berarti bukan lagi bacaan KTP — penanda "DARI KTP" harus jujur.
    if (key in NO_SCAN) setFromKtp((f) => ({ ...f, [key]: false }));
  }

  /*
   * Hasil pindai diambil saat layar ini kembali terlihat, bukan lewat params rute:
   * NIK tak boleh ikut tersimpan di state navigasi yang bisa dipulihkan sistem.
   */
  useFocusEffect(
    useCallback(() => {
      const scan = takeLastScan();
      if (scan === null) return;
      void absorb(scan.photoUri, scan.identityNumber, scan.fullName, scan.gender);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  /** Pasang hasil bacaan + foto yang membacanya, lalu bawa ke langkah pemeriksaan. */
  async function absorb(
    uri: string,
    nik: string | null,
    name: string | null,
    gender: 'L' | 'P' | null,
  ) {
    setValues((v) => ({
      ...v,
      identityNumber: nik ?? v.identityNumber,
      fullName: name ?? v.fullName,
      gender: gender ?? v.gender,
    }));
    setFromKtp({
      identityNumber: nik !== null,
      fullName: name !== null,
      gender: gender !== null,
    });
    setBusy(true);
    try {
      setKtp(await prepareImage({ uri }, 'ktp.jpg'));
      setStep(2);
    } catch (cause) {
      notifyFail('Gagal menyiapkan foto KTP', cause);
    } finally {
      setBusy(false);
    }
  }

  /*
   * Berkas dikecilkan segera setelah dipilih, bukan saat dikirim. Yang mendaftar
   * memotret KTP-nya di tempat dengan sinyal seadanya; mengecilkannya di muka membuat
   * satu-satunya penantian yang tersisa adalah unggahan itu sendiri.
   */
  async function chooseKtp(source: () => Promise<PickedImage | null>) {
    setBusy(true);
    try {
      const picked = await source();
      if (picked === null) return;
      setKtp(await prepareImage(picked, 'ktp.jpg'));
      // Fotonya sekalian dibaca: sumbernya beda, hasilnya sama-sama KTP.
      const scan = await recognizeKtp(picked.uri);
      setValues((v) => ({
        ...v,
        identityNumber: scan.identityNumber ?? v.identityNumber,
        fullName: scan.fullName ?? v.fullName,
        gender: scan.gender ?? v.gender,
      }));
      setFromKtp({
        identityNumber: scan.identityNumber !== null,
        fullName: scan.fullName !== null,
        gender: scan.gender !== null,
      });
      setStep(2);
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

  if (done) return <Submitted onDone={() => navigation.navigate('Masuk')} />;

  const identityReady = values.fullName.trim() !== '' && values.identityNumber.length === 16;

  return (
    <AuthLayout
      float
      title={HEAD[step].title}
      subtitle={HEAD[step].subtitle}
      headerExtra={<Progress step={step} />}
      onBack={() => (step === 1 ? navigation.goBack() : setStep((s) => (s - 1) as Step))}
    >
      <AuthAlert message={authError} />

      {step === 1 && (
        <>
          <ScanCard
            busy={busy}
            onCamera={() => root.navigate('ScanKtp')}
            onGallery={() => void chooseKtp(pickFromGallery)}
          />

          <AuthDivider label="atau isi sendiri" />

          <AuthCard>
            <AuthField
              tone="inset"
              label="Nama lengkap"
              placeholder="Sesuai KTP"
              value={values.fullName}
              onChangeText={(text) => set('fullName', text)}
              error={error('full_name')}
            />
            <AuthField
              tone="inset"
              label="NIK"
              placeholder="16 digit"
              keyboardType="number-pad"
              maxLength={16}
              value={values.identityNumber}
              onChangeText={(text) => set('identityNumber', digitsOnly(text, 16))}
              error={error('identity_number')}
            />
            <Text className="mb-2 font-sans text-[12.5px] font-semibold text-ink">
              Jenis kelamin
            </Text>
            <ChoiceTabs<'L' | 'P'>
              value={values.gender}
              onChange={(g) => set('gender', g)}
              options={[
                { id: 'L', label: 'Laki-laki' },
                { id: 'P', label: 'Perempuan' },
              ]}
            />
          </AuthCard>

          <Button
            full
            className="h-[54px]"
            label="Lanjut"
            disabled={!identityReady || busy}
            onPress={() => setStep(2)}
            iconRight={<Icon name="chevron" size={17} color="#FFFFFF" />}
          />
        </>
      )}

      {step === 2 && (
        <>
          <AuthCard>
            <KtpPreview
              file={ktp}
              scanned={fromKtp.identityNumber}
              busy={busy}
              onCamera={() => void chooseKtp(pickFromCamera)}
              onScan={() => root.navigate('ScanKtp')}
              onGallery={() => void chooseKtp(pickFromGallery)}
            />
            <Text className="mb-1.5 mt-4 font-sans text-[12.5px] font-semibold text-ink">
              Yang terbaca
            </Text>
            <ReadBack
              label="NIK"
              value={values.identityNumber === '' ? '—' : values.identityNumber}
              mono
              fromKtp={fromKtp.identityNumber}
              onEdit={() => setStep(1)}
            />
            <ReadBack
              label="Nama"
              value={values.fullName === '' ? '—' : values.fullName}
              fromKtp={fromKtp.fullName}
              onEdit={() => setStep(1)}
            />
            <ReadBack
              label="Jenis kelamin"
              value={values.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
              fromKtp={fromKtp.gender}
              onEdit={() => setStep(1)}
            />
          </AuthCard>

          <View className="flex-row gap-2.5 px-1">
            <Icon name="lock" size={15} color={colors[mode]['text-dim']} />
            <Text className="flex-1 font-sans text-[11.5px] leading-snug text-dim">
              {error('ktp') ??
                `Foto KTP dikecilkan di ponsel sebelum dikirim (batas ${MAX_UPLOAD_MB} MB) dan hanya dapat dibuka petugas berwenang.`}
            </Text>
          </View>

          <Button
            full
            className="h-[54px]"
            label="Lanjut"
            disabled={ktp === null || !identityReady || busy}
            onPress={() => setStep(3)}
            iconRight={<Icon name="chevron" size={17} color="#FFFFFF" />}
          />
        </>
      )}

      {step === 3 && (
        <>
          <AuthCard>
            <AuthField
              tone="inset"
              label="Nomor WhatsApp"
              icon="whatsapp"
              placeholder="0812 3456 7890"
              keyboardType="phone-pad"
              value={values.phoneNumber}
              onChangeText={(text) => set('phoneNumber', text)}
              error={error('phone_number')}
              hint="Dipakai untuk masuk dan menerima kode sekali pakai."
            />
            <AuthField
              tone="inset"
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
              tone="inset"
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
              tone="inset"
              label="Ulangi kata sandi"
              icon="lock"
              placeholder="Ketik ulang"
              secureTextEntry
              autoComplete="new-password"
              value={values.passwordConfirmation}
              onChangeText={(text) => set('passwordConfirmation', text)}
            />
          </AuthCard>

          <Button
            full
            className="h-[54px]"
            label={loading ? 'Mengirim…' : 'Daftar'}
            disabled={loading || busy || ktp === null || values.password === ''}
            onPress={() => void submit()}
          />

          <AuthLink
            text="Sudah punya akun?"
            action="Masuk"
            onPress={() => navigation.navigate('Masuk')}
          />
        </>
      )}
    </AuthLayout>
  );
}

/** Tiga bilah kemajuan + penunjuk langkah, digambar di dalam kepala bermerek. */
function Progress({ step }: { step: Step }) {
  return (
    <View>
      <View className="flex-row gap-1.5">
        {[1, 2, 3].map((n) => (
          <View
            key={n}
            className={`h-1 flex-1 rounded-full ${n <= step ? 'bg-lime' : 'bg-white/25'}`}
          />
        ))}
      </View>
      <Text className="mt-3 font-sans text-[11px] font-bold uppercase tracking-[1.4px] text-lime">
        Langkah {step} dari 3
      </Text>
    </View>
  );
}

/** Ajakan memindai KTP — jalur utama, karena mengetik 16 digit adalah jalur yang salah. */
function ScanCard({
  busy,
  onCamera,
  onGallery,
}: {
  busy: boolean;
  onCamera: () => void;
  onGallery: () => void;
}) {
  const { mode } = useTheme();
  // Di terang kartunya gelap agar menonjol di atas latar krem; di gelap latar itu sudah
  // gelap, jadi yang membedakannya tinggal garis tepi.
  const dark = mode === 'dark';

  return (
    <View
      className={`rounded-[22px] px-5 py-[22px] ${dark ? 'border border-line bg-surface2' : 'bg-ink'}`}
      style={shadows.pop}
    >
      <View className="flex-row items-center gap-3.5">
        <View className="h-[52px] w-[52px] items-center justify-center rounded-[16px] bg-lime">
          <Icon name="camera" size={24} color="#1A1A12" />
        </View>
        <View className="flex-1">
          <Text className="font-sans text-[15px] font-extrabold text-white">Pindai KTP</Text>
          <Text className="mt-0.5 font-sans text-[11.5px] leading-snug text-white/70">
            NIK, nama, dan jenis kelamin terisi sendiri.
          </Text>
        </View>
      </View>

      <View className="mt-4 flex-row gap-2.5">
        <Pressable
          accessibilityRole="button"
          onPress={onCamera}
          disabled={busy}
          className={`h-[46px] flex-1 items-center justify-center rounded-[14px] bg-lime ${busy ? 'opacity-50' : ''}`}
          style={({ pressed }) => (pressed ? { opacity: 0.85 } : undefined)}
        >
          <Text className="font-sans text-[13px] font-bold text-ink">Buka kamera</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onGallery}
          disabled={busy}
          className={`h-[46px] flex-1 items-center justify-center rounded-[14px] border-[1.5px] border-white/25 ${busy ? 'opacity-50' : ''}`}
          style={({ pressed }) => (pressed ? { opacity: 0.85 } : undefined)}
        >
          <Text className="font-sans text-[13px] font-bold text-white">
            {busy ? 'Membaca…' : 'Dari galeri'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

/** Foto KTP yang akan diunggah, plus jalan memotretnya ulang. */
function KtpPreview({
  file,
  scanned,
  busy,
  onCamera,
  onScan,
  onGallery,
}: {
  file: LocalFile | null;
  scanned: boolean;
  busy: boolean;
  onCamera: () => void;
  onScan: () => void;
  onGallery: () => void;
}) {
  return (
    <View>
      {file !== null ? (
        <View>
          <Image
            source={{ uri: file.uri }}
            accessibilityLabel="Pratinjau foto KTP"
            resizeMode="cover"
            className="h-[150px] w-full rounded-[16px] bg-ph"
          />
          {scanned && (
            <View className="absolute left-3 top-3 rounded-full bg-lime px-2.5 py-1">
              <Text className="font-sans text-[10px] font-extrabold tracking-wide text-ink">
                TERBACA
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View className="h-[150px] items-center justify-center rounded-[16px] bg-surface2">
          <Text className="font-sans text-[12px] text-dim">Belum ada foto KTP</Text>
        </View>
      )}

      <View className="mt-2.5 flex-row gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="flex-1 border border-line"
          label={file === null ? 'Potret KTP' : 'Potret ulang'}
          disabled={busy}
          onPress={file === null ? onScan : onCamera}
        />
        <Button
          variant="secondary"
          size="sm"
          className="flex-1 border border-line"
          label="Ganti dari galeri"
          disabled={busy}
          onPress={onGallery}
        />
      </View>
    </View>
  );
}

/** Satu baris bacaan: nilainya, asalnya, dan jalan membetulkannya. */
function ReadBack({
  label,
  value,
  mono,
  fromKtp,
  onEdit,
}: {
  label: string;
  value: string;
  mono?: boolean;
  fromKtp: boolean;
  onEdit: () => void;
}) {
  const { mode } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}. Ketuk untuk membetulkan.`}
      onPress={onEdit}
      className="mb-2 min-h-[44px] flex-row items-center gap-3 rounded-[14px] bg-surface2 px-3.5 py-2.5"
      style={({ pressed }) => (pressed ? { opacity: 0.85 } : undefined)}
    >
      <View className="flex-1">
        <Text className="font-sans text-[10px] font-bold uppercase tracking-wide text-dim">
          {label}
        </Text>
        <Text
          className={`mt-0.5 text-[14px] font-bold text-ink ${mono === true ? 'font-mono' : 'font-sans'}`}
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
      {fromKtp ? (
        <View className="rounded-full bg-pill px-2 py-1">
          <Text className="font-sans text-[9.5px] font-extrabold tracking-wide text-olive">
            DARI KTP
          </Text>
        </View>
      ) : (
        <Icon name="edit" size={16} color={colors[mode]['text-dim']} />
      )}
    </Pressable>
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
