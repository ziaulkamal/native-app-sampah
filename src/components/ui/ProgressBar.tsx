import { View } from 'react-native';

interface ProgressBarProps {
  /** Nilai 0–100. */
  value: number;
  tone?: 'olive' | 'success' | 'warning' | 'danger';
}

const tones = {
  olive: 'bg-olive',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
} as const;

/** Bar progres tipis. Full-port dari web; lebar tetap lewat style karena nilainya dinamis. */
export function ProgressBar({ value, tone = 'olive' }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <View
      className="h-2 overflow-hidden rounded-full bg-pill"
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped) }}
    >
      <View className={`h-full rounded-full ${tones[tone]}`} style={{ width: `${clamped}%` }} />
    </View>
  );
}
