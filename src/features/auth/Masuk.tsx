import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import type { AuthStackParams } from '@/navigation/types';
import { useApp } from '@/store/AppContext';
import { useTheme } from '@/theme/ThemeProvider';
import { colors } from '@/tokens/tokens';
import { AuthLayout } from './AuthLayout';
import { otpChannelFor } from './format';
import { AuthAlert, AuthCard, AuthDivider, AuthField, AuthInfo, AuthLink } from './parts';
import { useRoleGuard } from './useRoleGuard';

type Props = NativeStackScreenProps<AuthStackParams, 'Masuk'>;

/**
 * Satu pintu masuk untuk semua orang.
 *
 * Tidak ada lagi pemilih role di muka: `/auth/login` dan `/me` sudah mengembalikan role,
 * jadi menanyakannya lebih dulu berarti meminta orang menebak jawaban yang sudah
 * dipegang server. Penolakan akun admin tetap ditangani `useRoleGuard`, hanya saja
 * pesannya muncul setelah identitasnya dikenali — bukan sebagai pilihan di muka.
 */
export function Masuk({ navigation }: Props) {
  const { sendOtp, authState, authError } = useApp();
  const { mode } = useTheme();
  const rejected = useRoleGuard();
  const [identity, setIdentity] = useState('');
  const value = identity.trim();
  const loading = authState === 'loading';

  async function lanjut() {
    if (value === '' || loading) return;
    const channel = otpChannelFor(value);
    // Username petugas tak punya tujuan kirim — jalurnya langsung kata sandi.
    if (channel === null) {
      navigation.navigate('Sandi', { identity: value });
      return;
    }
    if ((await sendOtp(value, channel)) === null) {
      navigation.navigate('Otp', { identity: value, channel });
    }
  }

  return (
    <AuthLayout
      float
      title="Masuk"
      subtitle="Pelanggan maupun petugas memakai pintu yang sama. Aplikasi mengenali akun Anda sendiri."
    >
      <AuthAlert message={rejected ?? authError} />

      <AuthCard>
        <AuthField
          tone="inset"
          label="Nomor WhatsApp, email, atau username"
          placeholder="0812 3456 7890"
          autoComplete="username"
          autoCapitalize="none"
          returnKeyType="next"
          onSubmitEditing={() => void lanjut()}
          value={identity}
          onChangeText={setIdentity}
        />

        <Button
          full
          className="h-[54px]"
          label={loading ? 'Memproses…' : 'Lanjut'}
          disabled={loading || value === ''}
          onPress={() => void lanjut()}
          iconRight={<Icon name="chevron" size={17} color="#FFFFFF" />}
        />

        <AuthDivider label="atau" />

        <Button
          full
          variant="secondary"
          className="h-[50px] border-[1.5px] border-line"
          label="Masuk dengan kata sandi"
          disabled={value === ''}
          onPress={() => navigation.navigate('Sandi', { identity: value })}
          icon={<Icon name="lock" size={17} color={colors[mode].olive} />}
        />
      </AuthCard>

      <AuthInfo>
        Akun Admin Dinas & Super Admin dibuka lewat peramban. Bila akun itu masuk di sini, pesannya
        muncul setelah identitas dikenali — bukan sebagai pilihan di muka.
      </AuthInfo>

      <AuthLink
        text="Belum punya akun?"
        action="Daftar sebagai pelanggan"
        onPress={() => navigation.navigate('Register')}
      />
    </AuthLayout>
  );
}
