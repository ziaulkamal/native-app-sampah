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
 * Empat kolom, bukan satu baris memanjang seperti sebelumnya: jumlah pintu di beranda
 * sudah delapan, dan barisan yang harus digeser menyembunyikan separuhnya dari orang
 * yang tak tahu bahwa ia bisa digeser.
 */
export function HomeMenu({ items }: { items: HomeMenuItem[] }) {
  return (
    <View
      className="flex-row flex-wrap rounded-[22px] bg-surface px-3.5 py-5"
      style={shadows.pop}
    >
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
      accessibilityLabel={
        badge !== undefined && badge > 0 ? `${label}, ${badge} menunggu` : label
      }
      onPress={onPress}
      className="mb-2.5 w-1/4 items-center gap-2 py-1.5"
      style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
    >
      <View className="h-[46px] w-[46px] items-center justify-center rounded-full bg-pill">
        <Icon name={icon} size={20} color={colors[mode].olive} />
        {badge !== undefined && badge > 0 && (
          <View className="absolute -right-1 -top-1 h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger px-1">
            <Text className="font-sans text-[10px] font-bold text-white">
              {badge > 99 ? '99+' : badge}
            </Text>
          </View>
        )}
      </View>
      <Text className="font-sans text-[10px] font-bold text-ink" numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}
