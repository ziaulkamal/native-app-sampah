import { useNavigation } from '@react-navigation/native';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/Icon';
import { typography } from '@/tokens/tokens';

interface SubScreenHeaderProps {
  title: string;
  /** Baris kecil di atas judul, mis. nama titik layanan. */
  eyebrow?: string;
  /** Aksi di kanan (tombol simpan, menu). */
  action?: React.ReactNode;
}

/**
 * Judul + tombol kembali untuk layar di dalam tumpukan tab.
 *
 * Tumpukan tab berjalan dengan `headerShown: false` supaya header bawaan tab (beserta
 * loncengnya) tidak bertumpuk dua, jadi tombol kembali web diporting apa adanya ke sini.
 * Gestur geser dan tombol Back Android tetap jalan sendiri dari React Navigation.
 *
 * Karena menggantikan header bawaan, header ini ikut memikul tanggung jawabnya: jarak
 * aman dari status bar. Tanpa `insets.top` judulnya bertabrakan dengan jam — isi layar
 * mulai di y=0, dan `ScreenScaffold` hanya menyumbang 16dp. Cukup `insets.top` saja di
 * sini; 16dp itu yang jadi jarak visualnya, menambah konstanta lagi menggandakannya.
 *
 * Bandingkan `ScreenTitle`: ia dipakai layar yang MASIH punya header bawaan tab, jadi
 * di sana inset sudah ditangani dan menambahkannya justru membuat celah ganda.
 */
export function SubScreenHeader({ title, eyebrow, action }: SubScreenHeaderProps) {
  const nav = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-row items-center gap-3" style={{ paddingTop: insets.top }}>
      <Pressable
        onPress={() => nav.goBack()}
        accessibilityRole="button"
        accessibilityLabel="Kembali"
        className="h-[42px] w-[42px] items-center justify-center rounded-full bg-surface shadow-card"
      >
        <Icon name="back" size={20} />
      </Pressable>
      <View className="flex-1">
        {eyebrow !== undefined && (
          <Text
            maxFontSizeMultiplier={typography.maxScale}
            className="font-sans text-[11px] font-semibold uppercase tracking-wider text-olive"
          >
            {eyebrow}
          </Text>
        )}
        <Text
          maxFontSizeMultiplier={typography.maxScale}
          className="font-sans text-[17px] font-extrabold text-ink"
          numberOfLines={1}
        >
          {title}
        </Text>
      </View>
      {action}
    </View>
  );
}
