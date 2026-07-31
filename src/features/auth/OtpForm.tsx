import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import type { AuthStackParams } from '@/navigation/types';
import { useApp } from '@/store/AppContext';
import { useTheme } from '@/theme/ThemeProvider';
import { colors, shadows } from '@/tokens/tokens';
import { AuthLayout } from './AuthLayout';
import { AuthAlert, AuthCard } from './parts';
import { useRoleGuard } from './useRoleGuard';

type Props = NativeStackScreenProps<AuthStackParams, 'Otp'>;

const CHANNEL = { wa: 'WhatsApp', email: 'email' } as const;
const RESEND_SECONDS = 60;
/** Tata letak papan angka: baris terakhir kosong–0–hapus, seperti papan telepon. */
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'] as const;

/**
 * Verifikasi kode sekali pakai — enam kotak dengan papan angkanya sendiri.
 *
 * Papan angka digambar sendiri, bukan `TextInput` bertipe angka: papan sistem menutupi
 * separuh layar sehingga kotak kode dan tombol kirim ulang tak terlihat bersamaan,
 * padahal keduanya yang dibutuhkan saat kodenya tak kunjung datang.
 */
export function OtpForm({ route, navigation }: Props) {
  const { identity, channel } = route.params;
  const { sendOtp, signInWithOtp, authState, authError } = useApp();
  const { mode } = useTheme();
  const rejected = useRoleGuard();
  const [code, setCode] = useState('');
  const [left, setLeft] = useState(RESEND_SECONDS);
  const loading = authState === 'loading';
  const busy = useRef(false);

  useEffect(() => {
    if (left <= 0) return;
    const id = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);

  // Kode lengkap langsung diverifikasi: tak ada tombol kirim untuk enam digit yang
  // sudah pasti panjangnya. `busy` menahan verifikasi kedua sebelum yang pertama pulang.
  useEffect(() => {
    if (code.length !== 6 || busy.current) return;
    busy.current = true;
    void signInWithOtp(identity, channel, code).then((error) => {
      busy.current = false;
      if (error !== null) setCode('');
    });
  }, [code, identity, channel, signInWithOtp]);

  function press(key: string) {
    if (loading) return;
    if (key === 'del') setCode((c) => c.slice(0, -1));
    else if (key !== '') setCode((c) => (c.length < 6 ? c + key : c));
  }

  async function resend() {
    if (loading || left > 0) return;
    if ((await sendOtp(identity, channel)) === null) {
      setCode('');
      setLeft(RESEND_SECONDS);
    }
  }

  const other = channel === 'wa' ? 'email' : 'WhatsApp';

  return (
    <AuthLayout
      float
      title="Masukkan kode"
      subtitle={`Enam digit dikirim lewat ${CHANNEL[channel]} ke ${identity}.`}
      onBack={() => navigation.goBack()}
    >
      <AuthAlert message={rejected ?? authError} />

      <AuthCard>
        <View className="flex-row justify-between gap-2">
          {Array.from({ length: 6 }, (_, i) => (
            <Digit key={i} value={code[i]} active={i === code.length} />
          ))}
        </View>

        <View className="mt-4 flex-row items-center justify-between">
          {left > 0 ? (
            <Text className="font-sans text-[12.5px] text-dim">
              Kirim ulang dalam <Text className="font-bold text-ink">{clock(left)}</Text>
            </Text>
          ) : (
            <Pressable accessibilityRole="button" onPress={() => void resend()} hitSlop={10}>
              <Text className="font-sans text-[12.5px] font-bold text-olive">Kirim ulang kode</Text>
            </Pressable>
          )}
          <Pressable accessibilityRole="button" onPress={() => navigation.goBack()} hitSlop={10}>
            <Text className="font-sans text-[12.5px] font-bold text-olive">Pakai {other}</Text>
          </Pressable>
        </View>
      </AuthCard>

      <View className="flex-row flex-wrap gap-2.5">
        {KEYS.map((key, i) =>
          key === '' ? (
            <View key={i} className="h-[54px] flex-1 basis-[28%]" />
          ) : (
            <Pressable
              key={i}
              accessibilityRole="button"
              accessibilityLabel={key === 'del' ? 'Hapus satu digit' : key}
              onPress={() => press(key)}
              className={`h-[54px] flex-1 basis-[28%] items-center justify-center rounded-[16px] ${
                key === 'del' ? 'bg-ph' : 'bg-surface'
              }`}
              style={({ pressed }) => [shadows.card, pressed ? { opacity: 0.7 } : null]}
            >
              {key === 'del' ? (
                <Icon name="back" size={22} color={colors[mode]['text-dim']} />
              ) : (
                <Text className="font-sans text-[21px] font-bold text-ink">{key}</Text>
              )}
            </Pressable>
          ),
        )}
      </View>
    </AuthLayout>
  );
}

/** Satu kotak digit. Kotak yang sedang giliran diberi garis olive + karet penunjuk. */
function Digit({ value, active }: { value?: string; active: boolean }) {
  return (
    <View
      className={`h-[58px] flex-1 items-center justify-center rounded-[14px] border-[1.5px] ${
        active ? 'border-olive bg-surface' : 'border-transparent bg-surface2'
      }`}
    >
      {value !== undefined ? (
        <Text className="font-mono text-[22px] font-bold text-ink">{value}</Text>
      ) : (
        active && <View className="h-6 w-0.5 rounded-full bg-olive" />
      )}
    </View>
  );
}

const clock = (total: number): string =>
  `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
