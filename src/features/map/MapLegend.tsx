import { Text, View } from 'react-native';
import { useApp } from '@/store/AppContext';

/**
 * Legenda peta. Diturunkan dari golongan tarif — satu sumber warna dengan pin, dan
 * ikut berubah begitu admin menambah atau mengubah golongan.
 *
 * Web menatanya dua kolom kaku (`grid-cols-2`); di sini `flex-wrap` dengan lebar
 * setengah, karena lebar peta di ponsel berubah antara kotak biasa dan layar penuh.
 */
export function MapLegend() {
  const { tariffs } = useApp();
  if (tariffs.length === 0) return null;

  return (
    <View className="absolute bottom-3 left-3 max-w-[220px] rounded-xl border border-line bg-surface p-3 shadow-card">
      <Text className="mb-2 font-sans text-[10px] font-bold uppercase tracking-wide text-ink">
        Legenda
      </Text>
      <View className="flex-row flex-wrap gap-x-4 gap-y-1.5">
        {tariffs.map((t) => (
          <View key={t.id} className="flex-row items-center gap-2">
            <View
              style={{ backgroundColor: t.color }}
              className="h-2.5 w-2.5 flex-none rounded-full"
            />
            <Text className="font-sans text-[11px] text-dim">{t.name}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
