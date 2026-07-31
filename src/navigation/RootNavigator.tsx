import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { DocumentViewer } from '@/features/dokumen/DocumentViewer';
import { ScanKtpScreen } from '@/features/ocr/ScanKtpScreen';
import { BrandMark } from '@/features/shared/BrandMark';
import { CinematicSplash } from '@/features/shared/splash/CinematicSplash';
import { useApp } from '@/store/AppContext';
import { useTheme } from '@/theme/ThemeProvider';
import { colors } from '@/tokens/tokens';
import { AuthStack } from './AuthStack';
import { navTheme } from './navTheme';
import { OperatorTabs, PelangganTabs } from './tabs';
import type { RootStackParams } from './types';

const Stack = createNativeStackNavigator<RootStackParams>();

/** Setel `false` bila pembuka sinematik harus dilewati sama sekali. */
const PEMBUKA_SINEMATIK = true;

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
  const [pembuka, setPembuka] = useState(PEMBUKA_SINEMATIK);

  // Pembuka berjalan berbarengan dengan pemeriksaan token, bukan sesudahnya; kalau
  // sesinya sudah siap duluan (biasanya begitu) `BootSplash` tak pernah sempat muncul.
  if (pembuka)
    return <CinematicSplash onDone={() => setPembuka(false)} onSiap={hideNativeSplash} />;

  if (!booted) return <BootSplash />;

  return (
    <NavigationContainer theme={navTheme(mode)} onReady={hideNativeSplash}>
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

/** Menutup splash native; aman dipanggil dua kali karena bisa sudah tertutup duluan. */
function hideNativeSplash() {
  void SplashScreen.hideAsync().catch(() => undefined);
}

const TRACK = 128;
const PILL = 44;

/**
 * Layar tunggu selama token tersimpan diperiksa. Padanan `auth/BootSplash.tsx` web.
 *
 * Ia sengaja melanjutkan splash native, bukan menggantinya: lambang di posisi yang sama
 * lalu tumbuh sedikit, sehingga peralihan dari gambar statis Android ke layar React
 * terbaca sebagai satu gerakan. Splash native baru ditutup di `onLayout` — sesudah frame
 * ini benar-benar terukur, bukan sebelumnya.
 */
function BootSplash() {
  const { mode } = useTheme();
  const enter = useSharedValue(0);
  const pulse = useSharedValue(0);
  const slide = useSharedValue(0);

  useEffect(() => {
    enter.value = withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) });
    // Dua irama terpisah: denyut lambat untuk lambangnya, ulang-alik cepat untuk bilahnya.
    pulse.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
    slide.value = withRepeat(
      withTiming(1, { duration: 950, easing: Easing.inOut(Easing.cubic) }),
      -1,
      true,
    );
  }, [enter, pulse, slide]);

  const markStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ scale: interpolate(enter.value, [0, 1], [0.82, 1]) * (1 + pulse.value * 0.03) }],
  }));

  // Lingkaran denyut di belakang lambang — membesar sambil memudar habis, jadi ia tak
  // pernah menabrak tepi lambangnya sendiri.
  const haloStyle = useAnimatedStyle(() => ({
    opacity: enter.value * interpolate(pulse.value, [0, 1], [0.2, 0]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.55]) }],
  }));

  const barStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(slide.value, [0, 1], [0, TRACK - PILL]) }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ translateY: interpolate(enter.value, [0, 1], [10, 0]) }],
  }));

  return (
    <View className="flex-1 items-center justify-center gap-7 bg-bg" onLayout={hideNativeSplash}>
      {/* Komponen Animated tak ikut transform NativeWind, jadi bagian yang bergerak
          memakai `style` + token mentah; className tetap dipakai di pembungkus biasa. */}
      <View className="items-center justify-center">
        <Animated.View
          pointerEvents="none"
          style={[
            { position: 'absolute', height: 64, width: 64, borderRadius: 999 },
            { backgroundColor: colors[mode].olive },
            haloStyle,
          ]}
        />
        {/* Layar ini kosong selain lambangnya, jadi ia boleh paling besar di antara
            ketiga penempatan BrandMark — tak ada apa pun di sekelilingnya yang ia saingi. */}
        <Animated.View style={markStyle}>
          <BrandMark className="h-16 w-16 rounded-[19px] bg-olive" iconSize={36} color="#FFFFFF" />
        </Animated.View>
      </View>

      {/* Bilah ulang-alik menggantikan ActivityIndicator: spinner Material terlihat asing
          di sebelah bentuk-bentuk membulat aplikasi ini, dan warnanya tak bisa dibentuk. */}
      <View
        className="h-1 overflow-hidden rounded-full bg-ph"
        style={{ width: TRACK }}
        accessibilityRole="progressbar"
        accessibilityLabel="Memuat sesi"
      >
        <Animated.View
          style={[
            { width: PILL, height: '100%', borderRadius: 999 },
            { backgroundColor: colors[mode].olive },
            barStyle,
          ]}
        />
      </View>

      <Animated.View style={textStyle}>
        <Text className="font-sans text-[13px] font-semibold text-dim">Memuat sesi…</Text>
      </Animated.View>
    </View>
  );
}
