import type { ReactNode } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DataBanner } from '@/components/ui/DataBanner';
import { Icon, type IconName } from '@/components/ui/Icon';
import { useVerticalRhythm } from '@/lib/rhythm';
import { useApp } from '@/store/AppContext';
import { useTheme } from '@/theme/ThemeProvider';
import { colors, typography } from '@/tokens/tokens';

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
  const rhythm = useVerticalRhythm();

  return (
    <View className="flex-1 bg-bg">
      <DataBanner />
      <ScrollView
        // 56dp, bukan 32: tombol tengah bilah tab menjulang 30dp di atas bilahnya,
        // jadi kartu terakhir butuh ruang selebihnya agar tak tertimpa saat gulir mentok.
        contentContainerClassName="pb-14"
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
        <View className="-mt-[26px] px-[18px]" style={{ gap: rhythm.sectionGap }}>
          {children}
        </View>
      </ScrollView>
    </View>
  );
}

function Hero({ children }: { children: ReactNode }) {
  const { mode } = useTheme();
  const insets = useSafeAreaInsets();
  const rhythm = useVerticalRhythm();
  // Kaki kepala mulai 50dp: kapsul titik berhenti tepat di atas kartu menu yang
  // menaikinya 26dp. Dengan 46dp kapsulnya masih tertutup separuh. Di layar tinggi
  // kakinya yang melapang (→62dp), bukan offset kartunya, supaya tumpang-tindihnya tetap.
  const pad = {
    paddingTop: insets.top + rhythm.hero.padTop,
    paddingBottom: rhythm.hero.padBottom,
  };
  const shape = 'rounded-b-[34px] px-[22px]';

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

/**
 * Angka besar di tengah kepala — nominal yang jadi alasan orang membuka aplikasi ini.
 *
 * Teks di seluruh kepala dibatasi `typography.maxScale`: kepala adalah chrome yang
 * proporsinya dijaga, dan di perangkat berskala font besar angka 38–42px yang ikut
 * membesar penuh mendorong kapsul di kakinya keluar dari zona tumpang-tindih kartu.
 */
export function HeroAmount({ label, amount }: { label: string; amount: string }) {
  const rhythm = useVerticalRhythm();

  return (
    <View className="items-center" style={{ marginTop: rhythm.hero.amountTop }}>
      <Text
        maxFontSizeMultiplier={typography.maxScale}
        className="font-sans text-[11px] font-semibold uppercase tracking-wide text-white/70"
      >
        {label}
      </Text>
      <View className="mt-1.5 flex-row items-end gap-1.5">
        <Text
          maxFontSizeMultiplier={typography.maxScale}
          className="pb-1.5 font-sans text-[18px] font-semibold text-white/80"
        >
          Rp
        </Text>
        {/* Nominal panjang (Rp 12.500.000) menyusut sendiri, tidak di-ellipsis:
            angka rupiah yang terpotong salah baca, bukan sekadar tak lengkap. */}
        <Text
          maxFontSizeMultiplier={typography.maxScale}
          className="font-sans font-extrabold leading-none tracking-tight text-white"
          style={{ fontSize: rhythm.hero.amountSize }}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
        >
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
  const rhythm = useVerticalRhythm();

  return (
    <Pressable
      accessibilityRole={onPress === undefined ? 'text' : 'button'}
      disabled={onPress === undefined}
      onPress={onPress}
      // `min-h`, bukan `h`: saat teksnya lebih tinggi (skala font sistem) kapsul ikut
      // tumbuh, bukan memotong hurufnya.
      className="min-h-[42px] flex-row items-center justify-center gap-2 self-center rounded-full border border-white/25 px-4 py-2"
      style={({ pressed }) => [
        { marginTop: rhythm.hero.footTop },
        pressed ? { opacity: 0.8 } : undefined,
      ]}
    >
      <Icon name={icon} size={15} color="#FFFFFF" />
      <Text
        maxFontSizeMultiplier={typography.maxScale}
        className="font-sans text-[12.5px] font-semibold text-white"
        numberOfLines={1}
      >
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
        <Text
          maxFontSizeMultiplier={typography.maxScale}
          className="font-sans text-[11px] text-white/70"
        >
          {greeting}
        </Text>
        <Text
          maxFontSizeMultiplier={typography.maxScale}
          className="font-sans text-[15px] font-extrabold text-white"
          numberOfLines={1}
        >
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
