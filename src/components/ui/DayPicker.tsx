import { Pressable, Text, View } from 'react-native';
import { WEEKDAYS } from '@/lib/labels';
import type { Weekday } from '@/types';

interface DayPickerProps {
  /** Hari terpilih. */
  value: Weekday[];
  onChange: (days: Weekday[]) => void;
}

/** Pemilih hari Senin–Minggu (multi-select pill/checkbox). */
export function DayPicker({ value, onChange }: DayPickerProps) {
  const toggle = (day: Weekday) =>
    onChange(value.includes(day) ? value.filter((d) => d !== day) : [...value, day]);

  return (
    <View accessibilityLabel="Pilih hari angkut" className="flex-row flex-wrap gap-2">
      {WEEKDAYS.map((w) => {
        const on = value.includes(w.id);
        return (
          <Pressable
            key={w.id}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            accessibilityLabel={w.long}
            onPress={() => toggle(w.id)}
            className={`h-11 min-w-[44px] items-center justify-center rounded-xl border px-3 ${
              on ? 'border-olive bg-olive' : 'border-line bg-surface'
            }`}
          >
            <Text
              className={`font-sans text-[12.5px] font-semibold ${on ? 'text-white' : 'text-dim'}`}
            >
              {w.short}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
