import { Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { colors } from '@/tokens/tokens';
import { Icon, type IconName } from './Icon';

interface StatCardProps {
  label: string;
  value: string;
  icon: IconName;
  /** Delta opsional, mis. "↑ 12%". */
  delta?: string;
  up?: boolean;
}

/** Kartu KPI/metrik. Full-port dari web (dipakai beranda Operator). */
export function StatCard({ label, value, icon, delta, up }: StatCardProps) {
  const { mode } = useTheme();
  return (
    <View className="rounded-xl2 bg-surface p-4 shadow-card">
      <View className="mb-2.5 flex-row items-center justify-between">
        <Icon name={icon} size={20} color={colors[mode].olive} />
        {delta !== undefined && (
          <Text
            className={`font-sans text-[10px] font-semibold ${up === true ? 'text-success' : 'text-danger'}`}
          >
            {delta}
          </Text>
        )}
      </View>
      <Text className="font-sans text-[21px] font-extrabold leading-none text-ink">{value}</Text>
      <Text className="mt-1.5 font-sans text-[11.5px] text-dim">{label}</Text>
    </View>
  );
}
