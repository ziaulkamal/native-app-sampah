import { Pressable, ScrollView, Text, View } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { LOCATION_KIND } from '@/lib/labels';
import { useTheme } from '@/theme/ThemeProvider';
import { colors, shadows } from '@/tokens/tokens';
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
 *
 * Kapsul, bukan kotak bergaris: deret ini duduk langsung di atas latar krem tanpa kartu
 * pembungkus, dan di sana bayangan yang membedakan terpilih dari tidak — yang aktif
 * terangkat olive, sisanya kartu putih yang rata.
 */
export function LocationSwitcher({ locations, activeId, onSelect }: LocationSwitcherProps) {
  const { mode } = useTheme();
  if (locations.length < 2) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      // `py`: bayangan kapsul terangkat terpotong tepi ScrollView tanpa ruang napas.
      contentContainerClassName="gap-2 py-1 pr-4"
    >
      {locations.map((loc) => {
        const on = loc.id === activeId;
        return (
          <Pressable
            key={loc.id}
            onPress={() => onSelect(loc.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            // Jenis titik masuk ke label aksesibilitas, bukan ke kapsulnya: dua baris
            // teks di kapsul membuat deretnya setinggi kartu.
            accessibilityLabel={`${loc.label}, ${LOCATION_KIND[loc.kind]}`}
            className={`min-h-[44px] flex-row items-center gap-2 rounded-full py-2 pl-2.5 pr-4 ${
              on ? 'bg-olive' : 'bg-surface'
            }`}
            style={on ? shadows.pop : shadows.card}
          >
            <View
              className={`h-[22px] w-[22px] items-center justify-center rounded-full ${
                on ? 'bg-white/20' : 'bg-pill'
              }`}
            >
              <Icon name="home" size={12} color={colors[mode][on ? 'lime' : 'olive']} />
            </View>
            <Text
              className={`text-[12px] font-semibold ${on ? 'text-white' : 'text-dim'}`}
              numberOfLines={1}
            >
              {loc.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
