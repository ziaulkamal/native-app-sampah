import { Pressable, ScrollView, Text } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { LOCATION_KIND } from '@/lib/labels';
import { useTheme } from '@/theme/ThemeProvider';
import { colors } from '@/tokens/tokens';
import type { Customer } from '@/types';

interface LocationSwitcherProps {
  locations: Customer[];
  activeId: string;
  onSelect: (id: string) => void;
}

/**
 * Pemilih titik layanan untuk pelanggan yang punya lebih dari satu (mis. rumah +
 * warung). Tagihan tiap titik berdiri sendiri, jadi pilihan di sini menentukan
 * angka yang tampil di beranda dan layar tagihan.
 */
export function LocationSwitcher({ locations, activeId, onSelect }: LocationSwitcherProps) {
  const { mode } = useTheme();
  if (locations.length < 2) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-2 pr-4"
    >
      {locations.map((loc) => {
        const on = loc.id === activeId;
        return (
          <Pressable
            key={loc.id}
            onPress={() => onSelect(loc.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            className={`h-10 flex-row items-center gap-2 rounded-xl border px-3.5 ${
              on ? 'border-olive bg-olive' : 'border-line bg-surface'
            }`}
          >
            <Icon name="pin" size={16} color={on ? '#fff' : colors[mode]['text-dim']} />
            <Text className={`text-[12.5px] font-semibold ${on ? 'text-white' : 'text-ink'}`}>
              {loc.label}
            </Text>
            <Text className={`text-[10.5px] ${on ? 'text-white/75' : 'text-dim'}`}>
              {LOCATION_KIND[loc.kind]}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
