import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import type { AuthStackParams } from '@/navigation/types';
import { useApp } from '@/store/AppContext';
import { AuthLayout } from './AuthLayout';
import { digitsOnly } from './format';
import { AuthAlert, AuthField, AuthNotice } from './parts';
import { useRoleGuard } from './useRoleGuard';

type Props = NativeStackScreenProps<AuthStackParams, 'Otp'>;

const FIELD = { wa: 'nomor WhatsApp', email: 'alamat email' } as const;

/** Verifikasi kode sekali pakai. Kodenya sudah dikirim dari layar masuk sebelumnya. */
export function OtpForm({ route, navigation }: Props) {
  const { identity, channel } = route.params;
  const { sendOtp, signInWithOtp, authState, authError } = useApp();
  const rejected = useRoleGuard('pelanggan');
  const [code, setCode] = useState('');
  const [resent, setResent] = useState(false);
  const loading = authState === 'loading';

  async function verify() {
    if (code.length !== 6 || loading) return;
    // Kode yang ditolak tak berguna lagi — dikosongkan supaya tak perlu dihapus manual.
    if ((await signInWithOtp(identity, channel, code)) !== null) setCode('');
  }

  async function resend() {
    if (loading) return;
    if ((await sendOtp(identity, channel)) === null) setResent(true);
  }

  return (
    <AuthLayout
      title="Kode verifikasi"
      subtitle={`Enam digit dikirim ke ${identity}.`}
      onBack={() => navigation.goBack()}
    >
      <AuthAlert message={rejected ?? authError} />
      <AuthNotice
        message={
          resent
            ? 'Kode baru sudah dikirim. Kode sebelumnya tidak berlaku lagi.'
            : `Bila ${FIELD[channel]} itu terdaftar, kode 6 digit sudah dikirim.`
        }
      />

      <AuthField
        label="Kode masuk"
        icon="shield"
        placeholder="6 digit"
        keyboardType="number-pad"
        autoComplete="sms-otp"
        autoFocus
        maxLength={6}
        returnKeyType="go"
        onSubmitEditing={() => void verify()}
        value={code}
        onChangeText={(text) => setCode(digitsOnly(text, 6))}
      />

      <Button
        full
        className="mt-2"
        label={loading ? 'Memproses…' : 'Verifikasi & masuk'}
        disabled={loading || code.length !== 6}
        onPress={() => void verify()}
      />

      <View className="mt-5 flex-row items-center justify-center gap-4">
        <Pressable
          accessibilityRole="button"
          onPress={() => void resend()}
          disabled={loading}
          hitSlop={10}
        >
          <Text
            className={`font-sans text-[12.5px] font-bold ${loading ? 'text-dim' : 'text-olive'}`}
          >
            Kirim ulang kode
          </Text>
        </Pressable>
        <Text className="font-sans text-[12.5px] text-dim">·</Text>
        <Pressable accessibilityRole="button" onPress={() => navigation.goBack()} hitSlop={10}>
          <Text className="font-sans text-[12.5px] font-bold text-olive">Ubah tujuan</Text>
        </Pressable>
      </View>
    </AuthLayout>
  );
}
