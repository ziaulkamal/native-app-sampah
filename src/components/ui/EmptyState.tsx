import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { colors } from '@/tokens/tokens';
import { Icon, type IconName } from './Icon';

interface EmptyStateProps {
  icon: IconName;
  title: string;
  message?: string;
  action?: ReactNode;
}

/** Placeholder untuk daftar/surface kosong. Salah satu state wajib data-driven. */
export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  const { mode } = useTheme();
  return (
    <View className="items-center gap-3 py-10">
      <View className="h-[64px] w-[64px] items-center justify-center rounded-[20px] bg-pill">
        <Icon name={icon} size={28} color={colors[mode].olive} />
      </View>
      <Text className="font-sans text-[15px] font-bold text-ink">{title}</Text>
      {message !== undefined && (
        <Text className="max-w-[260px] text-center font-sans text-[12.5px] leading-5 text-dim">
          {message}
        </Text>
      )}
      {action !== undefined && <View className="mt-1">{action}</View>}
    </View>
  );
}
