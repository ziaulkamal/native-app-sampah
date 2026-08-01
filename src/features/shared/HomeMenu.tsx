import { Pressable, Text, View } from 'react-native';
import { Icon, type IconName } from '@/components/ui/Icon';
import { useTheme } from '@/theme/ThemeProvider';
import { colors, shadows, typography } from '@/tokens/tokens';

export interface HomeMenuItem {
  label: string;
  icon: IconName;
  /** Angka merah di sudut ubin; disembunyikan bila nol. */
  badge?: number;
  onPress: () => void;
}

/**
 * Deretan pintu layanan di beranda: empat ubin persegi, label di bawahnya.
 *
 * Bukan satu kartu berisi empat kolom seperti sebelumnya — tiap pintu berdiri sebagai
 * ubinnya sendiri, sehingga target sentuhnya terbaca sebesar ubinnya, bukan sebesar
 * lingkaran ikon di dalam kartu bersama.
 */
export function HomeMenu({ items }: { items: HomeMenuItem[] }) {
  return (
    <View className="flex-row gap-2.5">
      {items.map((item) => (
        <MenuButton key={item.label} {...item} />
      ))}
    </View>
  );
}

function MenuButton({ label, icon, badge, onPress }: HomeMenuItem) {
  const { mode } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={badge !== undefined && badge > 0 ? `${label}, ${badge} menunggu` : label}
      onPress={onPress}
      className="flex-1 items-center gap-2.5"
      style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
    >
      <View
        className="aspect-square w-full items-center justify-center rounded-2xl bg-surface"
        style={shadows.card}
      >
        <Icon name={icon} size={22} color={colors[mode].olive} />
        {badge !== undefined && badge > 0 && (
          <View className="absolute -right-1 -top-1 min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger px-1">
            <Text
              maxFontSizeMultiplier={typography.maxScale}
              className="font-sans text-[10.5px] font-bold text-white"
            >
              {badge > 99 ? '99+' : badge}
            </Text>
          </View>
        )}
      </View>
      {/* Label dibatasi `maxScale`: kolomnya tetap 1/4 lebar, teks yang membesar penuh
          hanya bisa terpotong `numberOfLines`, bukan membungkus rapi. */}
      <Text
        maxFontSizeMultiplier={typography.maxScale}
        className="font-sans text-[11px] font-semibold text-ink"
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}
