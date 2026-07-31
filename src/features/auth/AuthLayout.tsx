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
  /**
   * Isi mengambang sebagai kartu-kartu di atas latar, bukan satu panel penuh.
   * Dipakai layar yang isinya sudah berkartu sendiri supaya tak ada kotak di dalam kotak.
   */
  float?: boolean;
  /** Sisipan di bawah lambang, mis. bilah kemajuan pendaftaran. */
  headerExtra?: ReactNode;
}

/**
 * Kerangka bermerek untuk seluruh layar auth — porting `features/auth/AuthLayout.tsx`.
 *
 * Pemilih role tidak ikut, dan sejak redesain tak ada lagi layar pemilihnya: role
 * datang dari respons `/auth/login` + `/me`, jadi satu identitas cukup untuk semua.
 */
export function AuthLayout({
  title,
  subtitle,
  children,
  onBack,
  float = false,
  headerExtra,
}: AuthLayoutProps) {
  return (
    <View className="flex-1 bg-bg">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <Header
          title={title}
          subtitle={subtitle}
          onBack={onBack}
          float={float}
          headerExtra={headerExtra}
        />
        {float ? (
          <View className="-mt-[38px] flex-1 gap-3.5 px-[18px] pb-9">{children}</View>
        ) : (
          // Isi menaiki kepala 24dp, sama seperti di web.
          <View className="-mt-6 flex-1 rounded-t-[28px] bg-bg px-6 pb-9 pt-6">{children}</View>
        )}
      </ScrollView>
    </View>
  );
}

function Header({
  title,
  subtitle,
  onBack,
  float,
  headerExtra,
}: {
  title: string;
  subtitle: string;
  onBack?: () => void;
  float: boolean;
  headerExtra?: ReactNode;
}) {
  const { branding } = useApp();
  const { mode } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View className="overflow-hidden rounded-b-[34px]" style={{ paddingTop: insets.top + 16 }}>
      <Backdrop mode={mode} />
      <View className={`flex-row items-center gap-[11px] ${float ? 'px-[26px]' : 'px-6'}`}>
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
        <BrandMark
          className={`rounded-[18px] bg-lime ${float ? 'h-[58px] w-[58px]' : 'h-14 w-14'}`}
          iconSize={float ? 34 : 32}
          color="#1A1A12"
        />
        <Text className="flex-1 font-sans text-[17px] font-extrabold text-white" numberOfLines={2}>
          {brandLine(branding)}
        </Text>
      </View>

      {headerExtra !== undefined && (
        <View className={float ? 'px-[26px] pt-5' : 'px-6 pt-5'}>{headerExtra}</View>
      )}

      <View className={float ? 'px-[26px] pb-[58px] pt-7' : 'px-6 pb-9 pt-10'}>
        <Text
          className={`font-sans font-extrabold leading-tight text-white ${
            float ? 'text-[32px] tracking-tight' : 'text-[27px]'
          }`}
        >
          {title}
        </Text>
        <Text
          className={`mt-2 font-sans leading-snug text-white/75 ${
            float ? 'text-[12.5px]' : 'max-w-[290px] text-[13px]'
          }`}
        >
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
        {/* 155deg di CSS ≈ arah kiri-atas → kanan-bawah yang miring; sudutnya didekati. */}
        <LinearGradient id="authSky" x1="0" y1="0" x2="0.55" y2="1">
          <Stop offset="0" stopColor={colors[mode]['olive-deep']} />
          <Stop offset="0.78" stopColor={colors[mode].olive} />
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
