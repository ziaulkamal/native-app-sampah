import { Pressable, Text, View } from 'react-native';
import { Icon, type IconName } from '@/components/ui/Icon';
import { useTheme } from '@/theme/ThemeProvider';
import { colors, shadows } from '@/tokens/tokens';

export interface HomeMenuItem {
  label: string;
  icon: IconName;
  /** Angka merah di sudut ikon; disembunyikan bila nol. */
  badge?: number;
  onPress: () => void;
}

/**
 * Kartu menu yang mengambang menaiki kepala beranda.
 *
 * Empat kolom. Isinya hanya pintu yang tak ada di bilah bawah — menu yang mengulang
 * tab hanya menambah yang harus dipindai tanpa membuka apa pun yang baru.
 */
export function HomeMenu({ items }: { items: HomeMenuItem[] }) {
  const wraps = items.length > 4;

  return (
    <View
      className={`flex-row flex-wrap rounded-[22px] bg-surface px-3.5 ${
        wraps ? 'py-5' : 'py-[18px]'
      }`}
      style={shadows.pop}
    >
      {items.map((item) => (
        <MenuButton key={item.label} spaced={wraps} {...item} />
      ))}
    </View>
  );
}

function MenuButton({ label, icon, badge, onPress, spaced }: HomeMenuItem & { spaced: boolean }) {
  const { mode } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={badge !== undefined && badge > 0 ? `${label}, ${badge} menunggu` : label}
      onPress={onPress}
      className={`w-1/4 items-center gap-2 py-1 ${spaced ? 'mb-2.5' : ''}`}
      style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
    >
      <View className="h-[52px] w-[52px] items-center justify-center rounded-full bg-pill">
        <Icon name={icon} size={22} color={colors[mode].olive} />
        {badge !== undefined && badge > 0 && (
          <View className="absolute -right-1 -top-1 h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger px-1">
            <Text className="font-sans text-[10.5px] font-bold text-white">
              {badge > 99 ? '99+' : badge}
            </Text>
          </View>
        )}
      </View>
      <Text className="font-sans text-[11px] font-bold text-ink" numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}
