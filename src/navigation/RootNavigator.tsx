import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, Text, View } from 'react-native';
import { DocumentViewer } from '@/features/dokumen/DocumentViewer';
import { ScanKtpScreen } from '@/features/ocr/ScanKtpScreen';
import { BrandMark } from '@/features/shared/BrandMark';
import { useApp } from '@/store/AppContext';
import { useTheme } from '@/theme/ThemeProvider';
import { colors } from '@/tokens/tokens';
import { AuthStack } from './AuthStack';
import { navTheme } from './navTheme';
import { OperatorTabs, PelangganTabs } from './tabs';
import type { RootStackParams } from './types';

const Stack = createNativeStackNavigator<RootStackParams>();

/**
 * Akar navigasi. Menggantikan percabangan `screen`/`role` di `App.tsx` web.
 *
 * Role menentukan navigator, bukan layar: pengguna yang keluar lalu masuk sebagai role
 * lain mendapat tumpukan yang benar-benar baru, tanpa sisa layar role sebelumnya yang
 * di web harus dibersihkan manual lewat `stack: []`.
 *
 * Role `admin` (level ≤ 1, termasuk Super Admin) tidak punya cabang di sini — konsolnya
 * tetap di web. Akun semacam itu berhenti di `AuthStack` dengan pesan dari layar masuk.
 */
export function RootNavigator() {
  const { booted, authed, role } = useApp();
  const { mode } = useTheme();

  if (!booted) return <BootSplash />;

  return (
    <NavigationContainer theme={navTheme(mode)}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!authed || (role !== 'pelanggan' && role !== 'operator') ? (
          <Stack.Screen name="Auth" component={AuthStack} />
        ) : (
          <>
            {role === 'pelanggan' ? (
              <Stack.Screen name="Pelanggan" component={PelangganTabs} />
            ) : (
              <Stack.Screen name="Operator" component={OperatorTabs} />
            )}
            <Stack.Screen
              name="Dokumen"
              component={DocumentViewer}
              options={({ route }) => ({ headerShown: true, title: route.params.title })}
            />
          </>
        )}
        {/* Di luar percabangan: pemindai dipakai dua kali — saat mendaftar (belum ada
            sesi) dan kelak dari dalam aplikasi. */}
        <Stack.Screen
          name="ScanKtp"
          component={ScanKtpScreen}
          options={{ headerShown: true, title: 'Pindai KTP' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

/** Layar tunggu selama token tersimpan diperiksa. Padanan `auth/BootSplash.tsx` web. */
function BootSplash() {
  const { mode } = useTheme();
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-bg">
      {/* Layar ini kosong selain lambangnya, jadi ia boleh paling besar di antara
          ketiga penempatan BrandMark — tak ada apa pun di sekelilingnya yang ia saingi. */}
      <BrandMark className="h-16 w-16 rounded-[19px] bg-olive" iconSize={36} color="#FFFFFF" />
      <ActivityIndicator color={colors[mode].olive} />
      <Text className="font-sans text-[13px] font-semibold text-dim">Memuat sesi…</Text>
    </View>
  );
}
