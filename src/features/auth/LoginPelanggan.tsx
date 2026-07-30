import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import type { OtpChannel } from '@/api/types';
import { Button } from '@/components/ui/Button';
import type { AuthStackParams } from '@/navigation/types';
import { useApp } from '@/store/AppContext';
import { AuthLayout } from './AuthLayout';
import { AuthAlert, AuthField, AuthLink, ChoiceTabs } from './parts';
import { useRoleGuard } from './useRoleGuard';

type Props = NativeStackScreenProps<AuthStackParams, 'LoginPelanggan'>;
type Mode = 'sandi' | 'otp';

const CHANNELS: { id: OtpChannel; label: string; field: string; placeholder: string }[] = [
  { id: 'wa', label: 'WhatsApp', field: 'Nomor WhatsApp', placeholder: '0812 3456 7890' },
  { id: 'email', label: 'Email', field: 'Alamat email', placeholder: 'anda@email.com' },
];

/** Masuk pelanggan: kata sandi, atau kode sekali pakai lewat WhatsApp/email. */
export function LoginPelanggan({ navigation }: Props) {
  const [mode, setMode] = useState<Mode>('sandi');
  const rejected = useRoleGuard('pelanggan');

  return (
    <AuthLayout
      title="Selamat datang"
      subtitle="Masuk untuk melihat tagihan, jadwal angkut, dan layanan persampahan Anda."
      onBack={() => navigation.goBack()}
    >
      <ChoiceTabs<Mode>
        value={mode}
        onChange={setMode}
        options={[
          { id: 'sandi', label: 'Kata sandi' },
          { id: 'otp', label: 'Kode OTP' },
        ]}
      />

      {mode === 'sandi' ? (
        <PasswordForm blocker={rejected} />
      ) : (
        <OtpRequestForm
          blocker={rejected}
          onSent={(identity, channel) => navigation.navigate('Otp', { identity, channel })}
        />
      )}

      <AuthLink
        text="Belum punya akun?"
        action="Daftar"
        onPress={() => navigation.navigate('Register')}
      />
    </AuthLayout>
  );
}

function PasswordForm({ blocker }: { blocker: string | null }) {
  const { signIn, authState, authError } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const loading = authState === 'loading';
  const ready = username !== '' && password !== '';

  const submit = () => {
    if (ready && !loading) void signIn({ username, password });
  };

  return (
    <>
      <AuthAlert message={blocker ?? authError} />
      <AuthField
        label="No. WhatsApp, email, atau username"
        icon="user"
        placeholder="0812 3456 7890"
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
        className="mt-2"
        label={loading ? 'Memeriksa…' : 'Masuk'}
        disabled={loading || !ready}
        onPress={submit}
      />
    </>
  );
}

/**
 * Permintaan kode sekali pakai. Verifikasinya di layar `Otp` tersendiri, tidak seperti
 * web yang menukar isi form yang sama: di ponsel itu membuat tombol Back membatalkan
 * seluruh alur alih-alih mundur satu langkah untuk membetulkan nomor.
 */
function OtpRequestForm({
  blocker,
  onSent,
}: {
  blocker: string | null;
  onSent: (identity: string, channel: OtpChannel) => void;
}) {
  const { sendOtp, authState, authError } = useApp();
  const [channel, setChannel] = useState<OtpChannel>('wa');
  const [destination, setDestination] = useState('');
  const active = CHANNELS.find((c) => c.id === channel) ?? CHANNELS[0];
  const loading = authState === 'loading';

  async function send() {
    const identity = destination.trim();
    if (identity === '' || loading) return;
    if ((await sendOtp(identity, channel)) === null) onSent(identity, channel);
  }

  return (
    <>
      <AuthAlert message={blocker ?? authError} />
      <ChoiceTabs<OtpChannel>
        value={channel}
        onChange={(next) => {
          // Ganti kanal berarti tujuan lama tidak relevan lagi — mulai dari awal.
          setChannel(next);
          setDestination('');
        }}
        options={CHANNELS.map((c) => ({ id: c.id, label: c.label }))}
      />
      <AuthField
        label={active.field}
        icon={channel === 'wa' ? 'whatsapp' : 'user'}
        placeholder={active.placeholder}
        keyboardType={channel === 'wa' ? 'phone-pad' : 'email-address'}
        autoCapitalize="none"
        returnKeyType="send"
        onSubmitEditing={() => void send()}
        value={destination}
        onChangeText={setDestination}
      />
      <Button
        full
        className="mt-2"
        label={loading ? 'Memproses…' : 'Kirim kode'}
        disabled={loading || destination.trim() === ''}
        onPress={() => void send()}
      />
    </>
  );
}
