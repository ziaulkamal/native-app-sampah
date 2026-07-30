import { useCallback, useState, type ReactNode } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/Icon';
import { useTheme } from '@/theme/ThemeProvider';
import { colors } from '@/tokens/tokens';

/**
 * Peta layar penuh — padanan `MapFullscreen.tsx` + `useMapFullscreen.ts` web.
 *
 * Web memakai Fullscreen API browser, yang tak ada di RN. Penggantinya `Modal` bawaan
 * RN, bukan layar native-stack tersendiri: peta pemilih titik harus tetap menyunting
 * nilai yang sama saat dibesarkan, dan lewat Modal ia tetap komponen yang sama dengan
 * prop `value`/`onChange` yang sama — tanpa perlu mengoper koordinat lewat parameter
 * navigasi dan mengembalikannya. Tombol Back Android ditangani `onRequestClose`,
 * sama seperti `Escape` di web.
 *
 * Peta memang di-mount ulang saat berpindah ke Modal (React tak memindahkan pohon).
 * Karena itu pemanggil menyimpan posisi kameranya sendiri dan mengembalikannya lewat
 * `defaultSettings` — lihat `CustomerMap`. Padanan `invalidateSize()` di web, yang di
 * sana juga dipanggil setiap kali ukuran peta berubah.
 */

export function useMapFullscreen() {
  const [full, setFull] = useState(false);
  const toggle = useCallback(() => setFull((v) => !v), []);

  return { full, toggle };
}

interface MapFrameProps {
  full: boolean;
  onExit: () => void;
  children: ReactNode;
  /** Tinggi peta saat tidak layar penuh (kelas NativeWind, mis. `h-[540px]`). */
  className?: string;
  /** Peta menyentuh tepi layar: sudut dan garis tepi kiri-kanan dilepas. */
  bleed?: boolean;
}

/** Bingkai peta: kotak biasa, atau seluruh layar saat `full`. */
export function MapFrame({
  full,
  onExit,
  children,
  className = 'h-[540px]',
  bleed = false,
}: MapFrameProps) {
  const insets = useSafeAreaInsets();
  const edge = bleed ? 'border-y border-line' : 'rounded-xl2 border border-line';

  if (!full) {
    return <View className={`${className} ${edge} overflow-hidden`}>{children}</View>;
  }

  return (
    <>
      {/* Ruang di halaman tetap dipesan supaya isi di bawahnya tak melompat saat kembali. */}
      <View className={`${className} ${edge} bg-surface2`} />
      <Modal visible animationType="fade" onRequestClose={onExit} statusBarTranslucent>
        <View
          className="flex-1 bg-bg"
          style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
        >
          {children}
        </View>
      </Modal>
    </>
  );
}

/**
 * Tombol layar penuh di kanan atas kanvas. Kiri atas milik kotak cari, kiri bawah
 * legenda — pembagian ruang yang sama dengan web.
 */
export function FullscreenButton({ full, onToggle }: { full: boolean; onToggle: () => void }) {
  const { mode } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={full ? 'Keluar dari layar penuh' : 'Peta layar penuh'}
      onPress={onToggle}
      className="absolute right-3 top-3 h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface shadow-card"
    >
      <Icon name={full ? 'shrink' : 'expand'} size={18} color={colors[mode].text} />
    </Pressable>
  );
}
