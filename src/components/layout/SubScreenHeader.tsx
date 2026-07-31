import { useNavigation } from '@react-navigation/native';
import { Pressable, Text, View } from 'react-native';
import { Icon } from '@/components/ui/Icon';

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
 */
export function SubScreenHeader({ title, eyebrow, action }: SubScreenHeaderProps) {
  const nav = useNavigation();

  return (
    <View className="flex-row items-center gap-3">
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
          <Text className="text-[9.5px] font-semibold uppercase tracking-wider text-olive">
            {eyebrow}
          </Text>
        )}
        <Text className="text-[17px] font-extrabold text-ink" numberOfLines={1}>
          {title}
        </Text>
      </View>
      {action}
    </View>
  );
}
