import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Pattern, Rect, Stop } from 'react-native-svg';
import { Icon } from '@/components/ui/Icon';
import { BrandMark } from '@/features/shared/BrandMark';
import { brandLine } from '@/store/branding';
import { useApp } from '@/store/AppContext';
import { useTheme } from '@/theme/ThemeProvider';
import { colors } from '@/tokens/tokens';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  /** Tombol kembali di kepala layar; layar akar alur auth tidak memakainya. */
  onBack?: () => void;
}

/**
 * Kerangka bermerek untuk seluruh layar auth — porting `features/auth/AuthLayout.tsx`.
 *
 * Pemilih role (`RoleTabs`) tidak ikut: di web ia perlu ada di tiap halaman karena
 * masing-masing punya URL sendiri yang bisa dibuka langsung. Di sini pemilihannya
 * satu layar tersendiri (`PilihMasuk`) dan tombol Back yang mengembalikan ke sana.
 */
export function AuthLayout({ title, subtitle, children, onBack }: AuthLayoutProps) {
  return (
    <View className="flex-1 bg-bg">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <Header title={title} subtitle={subtitle} onBack={onBack} />
        {/* Isi menaiki kepala 24dp, sama seperti di web. */}
        <View className="-mt-6 flex-1 rounded-t-[28px] bg-bg px-6 pb-9 pt-6">{children}</View>
      </ScrollView>
    </View>
  );
}

function Header({
  title,
  subtitle,
  onBack,
}: {
  title: string;
  subtitle: string;
  onBack?: () => void;
}) {
  const { branding } = useApp();
  const { mode } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View className="overflow-hidden rounded-b-[34px]" style={{ paddingTop: insets.top + 16 }}>
      <Backdrop mode={mode} />
      <View className="flex-row items-center gap-[11px] px-6">
        {onBack !== undefined && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Kembali"
            onPress={onBack}
            hitSlop={8}
            className="-ml-2 h-11 w-11 items-center justify-center rounded-full"
            style={({ pressed }) => (pressed ? { opacity: 0.6 } : undefined)}
          >
            <Icon name="back" size={22} color="#FFFFFF" />
          </Pressable>
        )}
        {/*
          Lambang di layar masuk sengaja lebih besar dari yang di nav: di sini ia bukan
          penunjuk navigasi melainkan satu-satunya penanda instansi yang dilihat orang
          sebelum ia punya alasan mempercayai layar ini.
        */}
        <BrandMark className="h-14 w-14 rounded-[16px] bg-lime" iconSize={32} color="#1A1A12" />
        <Text className="font-sans text-[17px] font-extrabold text-white" numberOfLines={2}>
          {brandLine(branding)}
        </Text>
      </View>

      <View className="px-6 pb-9 pt-10">
        <Text className="font-sans text-[27px] font-extrabold leading-tight text-white">
          {title}
        </Text>
        <Text className="mt-2 max-w-[290px] font-sans text-[13px] leading-snug text-white/75">
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

/**
 * Latar kepala: gradien olive + garis diagonal tipis, digambar dengan react-native-svg.
 *
 * Bukan `expo-linear-gradient`: garis-garisnya di web adalah `repeating-linear-gradient`
 * yang tetap butuh pola, dan react-native-svg sudah terpasang untuk ikon — satu modul
 * native lebih sedikit yang harus cocok versinya (lihat PRD §9.2).
 */
function Backdrop({ mode }: { mode: 'light' | 'dark' }) {
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
      <Defs>
        {/* 150deg di CSS ≈ arah kiri-atas → kanan-bawah yang miring; sudutnya didekati. */}
        <LinearGradient id="authSky" x1="0" y1="0" x2="0.55" y2="1">
          <Stop offset="0" stopColor={colors[mode]['olive-deep']} />
          <Stop offset="1" stopColor={colors[mode].olive} />
        </LinearGradient>
        <Pattern
          id="authStripes"
          width={24}
          height={24}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(35)"
        >
          <Rect width={12} height={24} fill="rgba(255,255,255,0.06)" />
          <Rect x={12} width={12} height={24} fill="rgba(255,255,255,0.02)" />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#authSky)" />
      <Rect width="100%" height="100%" fill="url(#authStripes)" />
    </Svg>
  );
}
