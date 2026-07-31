import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import type { AuthStackParams } from '@/navigation/types';
import { useApp } from '@/store/AppContext';
import { useTheme } from '@/theme/ThemeProvider';
import { colors } from '@/tokens/tokens';
import { AuthLayout } from './AuthLayout';
import { otpChannelFor } from './format';
import { AuthAlert, AuthCard, AuthField } from './parts';
import { useRoleGuard } from './useRoleGuard';

type Props = NativeStackScreenProps<AuthStackParams, 'Sandi'>;

/** Jalur kata sandi. Identitasnya sudah diketik di layar Masuk, jadi tinggal sandinya. */
export function Sandi({ route, navigation }: Props) {
  const { identity } = route.params;
  const { signIn, sendOtp, authState, authError } = useApp();
  const { mode } = useTheme();
  const rejected = useRoleGuard();
  const [password, setPassword] = useState('');
  const loading = authState === 'loading';
  const channel = otpChannelFor(identity);

  const submit = () => {
    if (password !== '' && !loading) void signIn({ username: identity, password });
  };

  async function pakaiKode() {
    if (channel === null || loading) return;
    if ((await sendOtp(identity, channel)) === null) {
      navigation.navigate('Otp', { identity, channel });
    }
  }

  return (
    <AuthLayout
      float
      title="Kata sandi"
      subtitle="Sandi yang sama dengan yang dipakai di peramban."
      onBack={() => navigation.goBack()}
    >
      <AuthAlert message={rejected ?? authError} />

      <AuthCard>
        {/* Identitasnya ditampilkan, bukan diketik ulang: salah ketik di sini terbaca
            sebagai sandi salah, dan orang akan mencari kesalahannya di tempat keliru. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Ubah identitas ${identity}`}
          onPress={() => navigation.goBack()}
          className="mb-3.5 min-h-[44px] flex-row items-center gap-2.5 rounded-[14px] bg-surface2 px-[15px] py-3"
          style={({ pressed }) => (pressed ? { opacity: 0.85 } : undefined)}
        >
          <Icon name="user" size={17} color={colors[mode]['text-dim']} />
          <Text className="flex-1 font-sans text-[13.5px] font-semibold text-ink" numberOfLines={1}>
            {identity}
          </Text>
          <Text className="font-sans text-[12px] font-bold text-olive">Ubah</Text>
        </Pressable>

        <AuthField
          tone="inset"
          label="Kata sandi"
          icon="lock"
          placeholder="••••••••"
          secureTextEntry
          autoComplete="current-password"
          autoCapitalize="none"
          autoFocus
          returnKeyType="go"
          onSubmitEditing={submit}
          value={password}
          onChangeText={setPassword}
        />

        <Button
          full
          className="h-[54px]"
          label={loading ? 'Memeriksa…' : 'Masuk'}
          disabled={loading || password === ''}
          onPress={submit}
        />
      </AuthCard>

      {channel !== null && (
        <View className="items-center">
          <Pressable
            accessibilityRole="button"
            onPress={() => void pakaiKode()}
            disabled={loading}
            hitSlop={10}
            className="min-h-[44px] justify-center"
          >
            <Text
              className={`font-sans text-[13px] font-bold ${loading ? 'text-dim' : 'text-olive'}`}
            >
              Kirim kode sekali pakai
            </Text>
          </Pressable>
        </View>
      )}
    </AuthLayout>
  );
}
