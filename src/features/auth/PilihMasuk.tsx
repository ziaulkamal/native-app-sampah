import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, Text, View } from 'react-native';
import { Icon, type IconName } from '@/components/ui/Icon';
import { useTheme } from '@/theme/ThemeProvider';
import { colors } from '@/tokens/tokens';
import type { AuthStackParams } from '@/navigation/types';
import { AuthLayout } from './AuthLayout';
import { AuthLink } from './parts';

type Props = NativeStackScreenProps<AuthStackParams, 'PilihMasuk'>;

/**
 * Pemilih role — padanan `RoleTabs` di `AuthLayout.tsx` web.
 *
 * Di web ketiga role adalah tiga URL yang bisa dibuka langsung, jadi pemilihnya ikut di
 * tiap halaman masuk. Di sini alurnya satu tumpukan: memilih role mendorong layarnya,
 * dan tombol Back mengembalikan ke sini. Tab "Admin Dinas" diganti keterangan — konsol
 * admin tetap di peramban (PRD §3).
 */
export function PilihMasuk({ navigation }: Props) {
  const { mode } = useTheme();

  return (
    <AuthLayout
      title="Selamat datang"
      subtitle="Layanan persampahan dan retribusi Kabupaten Aceh Barat Daya."
    >
      <Text className="mb-2.5 font-sans text-[12.5px] font-semibold text-ink">Masuk sebagai</Text>

      <RoleCard
        icon="user"
        label="Pelanggan"
        hint="Tagihan, jadwal angkut, titik layanan, dan aduan."
        onPress={() => navigation.navigate('LoginPelanggan')}
      />
      <RoleCard
        icon="truck"
        label="Petugas"
        hint="Rute harian, penagihan lapangan, dan setoran kas."
        onPress={() => navigation.navigate('LoginPetugas')}
      />

      <View className="mt-4 flex-row gap-2.5 rounded-[14px] border border-line bg-surface2 px-4 py-3.5">
        <Icon name="info" size={16} color={colors[mode]['text-dim']} />
        <Text className="flex-1 font-sans text-[11.5px] leading-snug text-dim">
          Akun Admin Dinas dan Super Admin dibuka lewat peramban — konsolnya tidak ada di aplikasi
          ini.
        </Text>
      </View>

      <AuthLink
        text="Belum punya akun?"
        action="Daftar"
        onPress={() => navigation.navigate('Register')}
      />
    </AuthLayout>
  );
}

function RoleCard({
  icon,
  label,
  hint,
  onPress,
}: {
  icon: IconName;
  label: string;
  hint: string;
  onPress: () => void;
}) {
  const { mode } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      onPress={onPress}
      className="mb-3 min-h-[44px] flex-row items-center gap-3.5 rounded-[16px] border-[1.5px] border-line bg-surface px-4 py-3.5"
      style={({ pressed }) => (pressed ? { opacity: 0.85 } : undefined)}
    >
      <View className="h-11 w-11 items-center justify-center rounded-[14px] bg-pill">
        <Icon name={icon} size={20} color={colors[mode].olive} />
      </View>
      <View className="flex-1">
        <Text className="font-sans text-[14px] font-bold text-ink">{label}</Text>
        <Text className="mt-0.5 font-sans text-[11.5px] leading-snug text-dim">{hint}</Text>
      </View>
      <Icon name="chevron" size={16} color={colors[mode]['text-dim']} />
    </Pressable>
  );
}
