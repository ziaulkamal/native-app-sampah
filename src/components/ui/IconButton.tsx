import { Pressable } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { colors, semantic } from '@/tokens/tokens';
import { Icon, type IconName } from './Icon';

interface IconButtonProps {
  icon: IconName;
  /** Dipakai pembaca layar. Web memakainya sekaligus sebagai tooltip `title`. */
  label: string;
  onPress: () => void;
  tone?: 'default' | 'danger';
  disabled?: boolean;
}

/**
 * Tombol ikon persegi untuk aksi baris (edit, hapus).
 *
 * Kotaknya dinaikkan dari 32dp (web) ke 40dp: aturan komponen menuntut target
 * sentuh ≥44px, dan di web ukuran kecil itu masih tertolong presisi kursor.
 */
export function IconButton({ icon, label, onPress, tone = 'default', disabled }: IconButtonProps) {
  const { mode } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
      hitSlop={4}
      className={`h-10 w-10 items-center justify-center rounded-lg bg-pill ${disabled === true ? 'opacity-40' : ''}`}
      style={({ pressed }) => (pressed && disabled !== true ? { opacity: 0.7 } : undefined)}
    >
      <Icon name={icon} size={16} color={tone === 'danger' ? semantic.danger : colors[mode].text} />
    </Pressable>
  );
}
