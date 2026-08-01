import { useEffect, useState } from 'react';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Keyboard, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/Icon';
import { useTheme } from '@/theme/ThemeProvider';
import { colors, shadows } from '@/tokens/tokens';

/**
 * Bilah tab mengambang — kapsul putih yang melayang di atas isi layar, bukan bilah
 * yang menempel ke tepi bawah.
 *
 * Bawaan `createBottomTabNavigator` menggambar bilah selebar layar yang membagi
 * tinggi jendela: isi berhenti di atasnya. Prototipe menaruhnya melayang 16dp dari
 * tepi kiri/kanan dengan sudut 28dp, dan isi layar mengalir di bawahnya — itu yang
 * memberi layar rasa lapang di ponsel yang tinggi. Bentuk itu tak bisa dicapai lewat
 * `tabBarStyle` saja karena tombol tengah menjulang ke luar kotak bilahnya.
 *
 * Isi layar tidak boleh berhenti tepat di bawah kapsul ini — pakai
 * `useTabBarClearance()` di kaki setiap daftar yang bisa digulir.
 */

/** Tinggi kapsul bilah (dp): padding 10 + ikon 23 + jeda 5 + label 10 + padding 10. */
export const TAB_BAR_HEIGHT = 74;

/** Jarak kapsul dari tepi bawah aman layar. */
export const TAB_BAR_GAP = 16;

/** Napas antara kartu terakhir dan kapsul, mengikuti kaki 150dp di prototipe. */
const TAIL = 40;

/**
 * Ruang yang harus disisakan di kaki isi yang bisa digulir agar kartu terakhir tak
 * tertimbun bilah mengambang (termasuk tombol tengah yang menjulang 16dp di atasnya).
 */
export function useTabBarClearance(): number {
  const insets = useSafeAreaInsets();
  return insets.bottom + TAB_BAR_GAP + TAB_BAR_HEIGHT + TAIL;
}

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { mode } = useTheme();
  const insets = useSafeAreaInsets();
  const hidden = useKeyboardVisible();

  // Papan ketik yang naik akan mendorong kapsul ke tengah layar, menutupi kolom isian
  // yang sedang diketik. Bawaan menanganinya lewat `tabBarHideOnKeyboard`; bilah
  // buatan sendiri harus memikulnya sendiri.
  if (hidden) return null;

  return (
    <View
      // `pointerEvents` kotak luar dilewatkan: ia selebar layar hanya sebagai penempat,
      // dan ketukan di sisi kiri/kanan kapsul harus sampai ke isi di bawahnya.
      pointerEvents="box-none"
      className="absolute bottom-0 left-0 right-0 px-4"
      style={{ paddingBottom: insets.bottom + TAB_BAR_GAP }}
    >
      <View
        className="flex-row items-center rounded-[28px] bg-nav px-2 py-2.5"
        style={[shadows.pop, { minHeight: TAB_BAR_HEIGHT }]}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;

          // Ketukan dibelokkan lewat event `tabPress` yang sama dengan bawaan, sehingga
          // `listeners` di `tabs.tsx` (mis. FAB yang melompat ke layar lain) tetap jalan.
          const press = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          // Kursi yang memasang `tabBarButton` adalah kursi tombol tengah: ia tak punya
          // ikon maupun label, dan menggambarnya seperti tab biasa menyisakan kursi kosong.
          if (options.tabBarButton !== undefined) {
            return (
              <FabSeat
                key={route.key}
                label={options.tabBarAccessibilityLabel ?? route.name}
                onPress={press}
              />
            );
          }

          const color = focused ? colors[mode].olive : colors[mode]['text-dim'];
          // `tabBarLabel` boleh berupa elemen; yang dipakai di sini hanya bentuk teksnya.
          const label = typeof options.tabBarLabel === 'string' ? options.tabBarLabel : route.name;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? route.name}
              onPress={press}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              className={`flex-1 items-center gap-1.5 rounded-[20px] py-2 ${
                focused ? 'bg-pill' : ''
              }`}
              style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
            >
              {options.tabBarIcon?.({ focused, color, size: 23 })}
              {/* Label bilah tak ikut skala font sistem: kursinya tetap 1/5 lebar, dan
                  10px yang membesar penuh hanya bisa terpotong di sana. */}
              <Text
                allowFontScaling={false}
                className="font-sans text-[10px] font-semibold"
                numberOfLines={1}
                style={{ color }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/**
 * Kursi tombol tengah. Tombolnya menjulang 16dp ke luar kapsul, jadi kursinya sendiri
 * hanya penahan lebar — tombol digambar mengambang di atasnya.
 */
function FabSeat({ label, onPress }: { label: string; onPress: () => void }) {
  const { mode } = useTheme();
  const dark = mode === 'dark';

  return (
    <View className="h-[52px] w-[66px] flex-none items-center">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        className={`-mt-4 h-[54px] w-[54px] items-center justify-center rounded-full ${
          dark ? 'bg-lime' : 'bg-olive'
        }`}
        style={({ pressed }) => [shadows.pop, pressed ? { opacity: 0.85 } : undefined]}
      >
        {/* Di gelap tombolnya dibalik — isi lime, ikon gelap: olive di atas latar gelap
            tak lagi terbaca sebagai aksen. */}
        <Icon name="wallet" size={23} color={dark ? colors.light.text : colors[mode].lime} />
      </Pressable>
    </View>
  );
}

/** Papan ketik sedang menutupi kaki layar? */
function useKeyboardVisible(): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return visible;
}
