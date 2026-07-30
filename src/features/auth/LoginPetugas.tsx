import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Text } from 'react-native';
import { Button } from '@/components/ui/Button';
import type { AuthStackParams } from '@/navigation/types';
import { useApp } from '@/store/AppContext';
import { AuthLayout } from './AuthLayout';
import { AuthAlert, AuthField } from './parts';
import { useRoleGuard } from './useRoleGuard';

type Props = NativeStackScreenProps<AuthStackParams, 'LoginPetugas'>;

/** Masuk petugas retribusi. Akunnya dibuat admin dinas — tidak ada pendaftaran mandiri. */
export function LoginPetugas({ navigation }: Props) {
  const { signIn, authState, authError } = useApp();
  const rejected = useRoleGuard('operator');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const loading = authState === 'loading';
  const ready = username !== '' && password !== '';

  const submit = () => {
    if (ready && !loading) void signIn({ username, password });
  };

  return (
    <AuthLayout
      title="Masuk petugas"
      subtitle="Rute harian, penagihan lapangan, dan setoran kas."
      onBack={() => navigation.goBack()}
    >
      <AuthAlert message={rejected ?? authError} />

      <AuthField
        label="Username"
        icon="user"
        placeholder="petugas"
        autoComplete="username"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
      />
      <AuthField
        label="Kata sandi"
        icon="lock"
        placeholder="••••••••"
        secureTextEntry
        autoComplete="current-password"
        autoCapitalize="none"
        returnKeyType="go"
        onSubmitEditing={submit}
        value={password}
        onChangeText={setPassword}
      />

      <Button
        full
        className="mt-4"
        label={loading ? 'Memeriksa…' : 'Masuk'}
        disabled={loading || !ready}
        onPress={submit}
      />

      <Text className="mt-5 text-center font-sans text-[12.5px] leading-snug text-dim">
        Belum punya akun? Hubungi admin dinas — akun petugas diterbitkan dari konsol.
      </Text>
    </AuthLayout>
  );
}
