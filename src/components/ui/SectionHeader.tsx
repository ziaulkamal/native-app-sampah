import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

interface SectionHeaderProps {
  title: string;
  /** Elemen aksi opsional di kanan (mis. tautan "Lihat semua" atau badge hitung). */
  action?: ReactNode;
  className?: string;
}

/** Judul seksi + aksi opsional. Full-port dari web. */
export function SectionHeader({ title, action, className = '' }: SectionHeaderProps) {
  return (
    <View className={`flex-row items-center justify-between ${className}`}>
      <Text className="font-sans text-[16px] font-bold text-ink">{title}</Text>
      {action}
    </View>
  );
}
