import { Pressable, Text } from 'react-native';

interface ChipProps {
  label: string;
  active?: boolean;
  /** Web memakai `onClick`; RN memakai `onPress` — beda nama, arti sama. */
  onPress?: () => void;
}

/** Pill filter/toggle. Dipakai di daftar & filter (mis. filter status tagihan). */
export function Chip({ label, active, onPress }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active === true }}
      onPress={onPress}
      className={`flex-none rounded-full px-[18px] py-[10px] ${
        active === true ? 'bg-olive' : 'bg-surface shadow-card'
      }`}
    >
      <Text
        className={`font-sans font-semibold text-[13px] ${active === true ? 'text-white' : 'text-ink'}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
