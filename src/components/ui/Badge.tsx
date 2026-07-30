import { Text, View } from 'react-native';

export type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
}

/** Latar dan warna teks dipisah — RN tak mewarisi `color` dari View ke Text. */
const bg: Record<BadgeTone, string> = {
  success: 'bg-success/10',
  warning: 'bg-warning/10',
  danger: 'bg-danger/10',
  info: 'bg-info/10',
  neutral: 'bg-pill',
};

const fg: Record<BadgeTone, string> = {
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  info: 'text-info',
  neutral: 'text-dim',
};

/** Pill status kecil (mis. status tagihan/aduan). Full-port dari web. */
export function Badge({ label, tone = 'neutral' }: BadgeProps) {
  return (
    <View className={`self-start rounded-full px-2.5 py-1 ${bg[tone]}`}>
      <Text className={`font-sans font-bold text-[10px] tracking-wide ${fg[tone]}`}>{label}</Text>
    </View>
  );
}
