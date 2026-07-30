import { Pressable, View } from 'react-native';

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  /** Mati sepenuhnya — mis. sakelar yang wewenangnya bukan milik akun ini. */
  disabled?: boolean;
  label: string;
}

/**
 * Switch on/off. Sengaja tidak memakai `Switch` bawaan RN: warnanya diatur platform
 * dan tak mengenal token, sehingga hijau Android akan muncul di tengah palet olive.
 * Bentuknya diporting dari web supaya sakelar di dua platform terlihat sama.
 */
export function Toggle({ checked, onChange, disabled, label }: ToggleProps) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked, disabled: disabled === true }}
      disabled={disabled}
      onPress={() => onChange(!checked)}
      hitSlop={8}
      className={`h-6 w-11 flex-row items-center rounded-full p-0.5 ${
        checked ? 'justify-end bg-olive' : 'justify-start bg-line'
      } ${disabled === true ? 'opacity-50' : ''}`}
    >
      <View className="h-5 w-5 rounded-full bg-white shadow-card" />
    </Pressable>
  );
}
