import type { ReactNode } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DataBanner } from '@/components/ui/DataBanner';
import { Icon, type IconName } from '@/components/ui/Icon';
import { useApp } from '@/store/AppContext';
import { useTheme } from '@/theme/ThemeProvider';
import { colors } from '@/tokens/tokens';

/**
 * Kerangka beranda: kepala bermerek selebar layar, isi menaikinya 26dp.
 *
 * Bukan varian `ScreenScaffold`: yang itu memberi `p-4` tetap ke seluruh isinya, dan
 * kepala yang menyentuh tepi layar hanya bisa lahir dari sana lewat margin negatif yang
 * ikut memotong bayangan kartu di bawahnya.
 */
export function HeroScaffold({ hero, children }: { hero: ReactNode; children: ReactNode }) {
  const { dataState, refresh } = useApp();
  const { mode } = useTheme();

  return (
    <View className="flex-1 bg-bg">
      <DataBanner />
      <ScrollView
        contentContainerClassName="pb-8"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={dataState === 'loading'}
            onRefresh={() => void refresh()}
            colors={[colors[mode].olive]}
            tintColor={colors[mode].olive}
          />
        }
      >
        <Hero>{hero}</Hero>
        <View className="-mt-[26px] gap-[18px] px-[18px]">{children}</View>
      </ScrollView>
    </View>
  );
}

function Hero({ children }: { children: ReactNode }) {
  const { mode } = useTheme();
  const insets = useSafeAreaInsets();
  const pad = { paddingTop: insets.top + 14 };
  const shape = 'rounded-b-[34px] px-[22px] pb-[46px]';

  // Di gelap kepalanya tidak bergradien terang: olive #5A6A1E gagal 3:1 di atas latar
  // gelap, jadi kontrasnya datang dari permukaan sedikit lebih terang + garis tepi.
  if (mode === 'dark') {
    return (
      <View className={`${shape} border-b border-line bg-surface2`} style={pad}>
        {children}
      </View>
    );
  }

  return (
    <LinearGradient
      colors={[colors.light['olive-deep'], colors.light.olive]}
      locations={[0, 0.78]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.55, y: 1 }}
      className={shape}
      style={pad}
    >
      {children}
    </LinearGradient>
  );
}

/** Angka besar di tengah kepala — nominal yang jadi alasan orang membuka aplikasi ini. */
export function HeroAmount({ label, amount }: { label: string; amount: string }) {
  return (
    <View className="mt-7 items-center">
      <Text className="font-sans text-[11px] font-semibold uppercase tracking-wide text-white/70">
        {label}
      </Text>
      <View className="mt-1.5 flex-row items-end gap-1.5">
        <Text className="pb-1.5 font-sans text-[18px] font-semibold text-white/80">Rp</Text>
        <Text className="font-sans text-[38px] font-extrabold leading-none tracking-tight text-white">
          {amount}
        </Text>
      </View>
    </View>
  );
}

/** Kapsul bergaris di kaki kepala: konteks yang sedang dilihat, sekaligus pintu menggantinya. */
export function HeroPill({
  icon,
  label,
  onPress,
}: {
  icon: IconName;
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole={onPress === undefined ? 'text' : 'button'}
      disabled={onPress === undefined}
      onPress={onPress}
      className="mt-5 h-[42px] flex-row items-center justify-center gap-2 self-center rounded-full border border-white/25 px-4"
      style={({ pressed }) => (pressed ? { opacity: 0.8 } : undefined)}
    >
      <Icon name={icon} size={15} color="#FFFFFF" />
      <Text className="font-sans text-[12.5px] font-semibold text-white" numberOfLines={1}>
        {label}
      </Text>
      {onPress !== undefined && <Icon name="chevron" size={13} color="#FFFFFF" />}
    </Pressable>
  );
}

/** Sapaan + nama di kepala. Sisi kanannya diserahkan pemanggil (lonceng). */
export function HeroGreeting({
  avatar,
  greeting,
  name,
  right,
}: {
  avatar: ReactNode;
  greeting: string;
  name: string;
  right?: ReactNode;
}) {
  return (
    <View className="flex-row items-center gap-3">
      {avatar}
      <View className="flex-1">
        <Text className="font-sans text-[10.5px] text-white/70">{greeting}</Text>
        <Text className="font-sans text-[15px] font-extrabold text-white" numberOfLines={1}>
          {name}
        </Text>
      </View>
      {right}
    </View>
  );
}

/** Sapaan menurut jam dinding ponsel — sama seperti yang dipakai orang menyapa. */
export function greetingNow(at: Date = new Date()): string {
  const hour = at.getHours();
  if (hour < 11) return 'Selamat pagi,';
  if (hour < 15) return 'Selamat siang,';
  if (hour < 19) return 'Selamat sore,';
  return 'Selamat malam,';
}
