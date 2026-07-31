import { Text, View } from 'react-native';
import { ScreenScaffold } from '@/components/layout/ScreenScaffold';
import { SubScreenHeader } from '@/components/layout/SubScreenHeader';
import { useApp } from '@/store/AppContext';
import { AkunIdentitasForm } from './AkunIdentitasForm';
import { AvatarPicker } from './AvatarPicker';

/**
 * Ubah identitas akun sendiri — layar di dalam tumpukan Profil.
 *
 * Web menaruh form ini di konsol admin (`features/admin/AkunScreen.tsx`) dan mengunci
 * identitas di layar profil mobile jadi baca-saja. Di sini ia dibuka: `PUT /my/account`
 * berlaku untuk semua role, dan pelanggan/petugas juga berhak membetulkan nomor HP-nya
 * tanpa menunggu admin dinas.
 */
export function AkunScreen() {
  const { session } = useApp();
  if (session === null) return null;

  return (
    <ScreenScaffold>
      <SubScreenHeader title="Akun Saya" />

      <View className="items-center gap-3 rounded-xl2 bg-surface p-5 shadow-card">
        <AvatarPicker name={session.name} size={72} />
        <View className="items-center">
          <Text className="text-[17px] font-extrabold text-ink" numberOfLines={1}>
            {session.name}
          </Text>
          <Text className="mt-1 text-[11.5px] text-dim" numberOfLines={1}>
            {session.email ?? session.phone ?? 'Kontak belum diatur'}
          </Text>
        </View>
      </View>

      <View className="rounded-xl2 bg-surface p-4 shadow-card">
        <Text className="mb-3 text-[10.5px] font-semibold uppercase tracking-wide text-dim">
          Identitas akun
        </Text>
        <AkunIdentitasForm />
      </View>
    </ScreenScaffold>
  );
}
