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
  /** Penanda angka di sudut, mis. jumlah tunggakan. Kalah tempat dari `delta`. */
  badge?: string;
  /**
   * Satuan kecil di belakang angka, mis. "pelanggan". Dipisah dari `value` supaya
   * yang menyusut saat sempit hanya satuannya, angkanya tetap seukuran KPI lain —
   * pola yang sama dengan "Rp" kecil di samping nominal besar `HeroAmount`.
   */
  unit?: string;
}

/** Kartu KPI/metrik. Full-port dari web (dipakai beranda Operator). */
export function StatCard({ label, value, icon, delta, up, badge, unit }: StatCardProps) {
  const { mode } = useTheme();
  return (
    <View className="rounded-xl2 bg-surface p-4 shadow-card">
      <View className="mb-2.5 flex-row items-center justify-between">
        <Icon name={icon} size={20} color={colors[mode].olive} />
        {delta !== undefined ? (
          <Text
            className={`font-sans text-[10px] font-semibold ${up === true ? 'text-success' : 'text-danger'}`}
          >
            {delta}
          </Text>
        ) : (
          badge !== undefined && (
            <View className="rounded-full bg-warning/10 px-2 py-[3px]">
              <Text className="font-sans text-[10.5px] font-bold text-warning">{badge}</Text>
            </View>
          )
        )}
      </View>
      {/* `leading-tight`, bukan `leading-none`: di kartu setengah lebar Android memangkas
          ascender/descender angka 21px saat baris setinggi fontnya sendiri. */}
      <View className="flex-row items-end gap-1">
        <Text
          className="font-sans text-[21px] font-extrabold leading-tight text-ink"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
        >
          {value}
        </Text>
        {unit !== undefined && (
          <Text
            className="pb-[2px] font-sans text-[11.5px] font-semibold text-dim"
            numberOfLines={1}
          >
            {unit}
          </Text>
        )}
      </View>
      <Text className="mt-1.5 font-sans text-[11.5px] text-dim">{label}</Text>
    </View>
  );
}
