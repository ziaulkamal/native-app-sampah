import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

interface ScreenTitleProps {
  title: string;
  /** Baris kecil di atas judul, mis. peran atau zona yang sedang dilihat. */
  eyebrow?: string;
  /** Aksi di kanan judul (tombol, kartu ringkas). */
  action?: ReactNode;
}

/**
 * Judul layar tab: eyebrow 11px + judul 20px.
 *
 * Satu komponen, bukan diketik ulang di tiap layar — pola inilah yang membuat layar
 * tab dan `SubScreenHeader` terbaca sebagai keluarga yang sama.
 */
export function ScreenTitle({ title, eyebrow, action }: ScreenTitleProps) {
  return (
    <View className="flex-row items-center gap-3">
      <View className="flex-1">
        {eyebrow !== undefined && (
          <Text className="font-sans text-[11px] font-semibold uppercase tracking-wider text-olive">
            {eyebrow}
          </Text>
        )}
        <Text className="font-sans text-[20px] font-extrabold text-ink">{title}</Text>
      </View>
      {action}
    </View>
  );
}
