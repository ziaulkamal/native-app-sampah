import { Pressable, Text, View, type PressableProps } from 'react-native';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  /** Teks tombol. Web menerima children bebas; di sini teks + ikon opsional dipisah. */
  label: string;
  variant?: Variant;
  size?: Size;
  full?: boolean;
  /** Ikon di kiri label, mis. <Icon name="plus" size={16} color="#fff" />. */
  icon?: React.ReactNode;
  /** Ikon di kanan label — penunjuk arah ("lanjut"), bukan penanda jenis aksi. */
  iconRight?: React.ReactNode;
  className?: string;
}

/**
 * Tombol aksi — porting `components/ui/Button.tsx` web.
 *
 * Satu beda struktural yang tak terhindarkan: web menaruh warna teks di tombolnya
 * dan membiarkan teks mewarisinya. RN tidak mewarisi gaya lintas komponen, jadi
 * kelas warna & ukuran huruf harus menempel langsung di <Text> — karena itu varian
 * di sini punya dua kolom (kotak dan teks), bukan satu string seperti di web.
 */
const box: Record<Variant, string> = {
  primary: 'bg-olive',
  secondary: 'bg-surface shadow-card',
  ghost: 'bg-transparent',
  danger: 'bg-danger',
};

const label: Record<Variant, string> = {
  primary: 'text-white',
  secondary: 'text-ink',
  ghost: 'text-olive',
  danger: 'text-white',
};

const boxSize: Record<Size, string> = {
  sm: 'px-4 py-2.5',
  md: 'px-6 py-4',
};

const labelSize: Record<Size, string> = {
  sm: 'text-[13px]',
  md: 'text-[15px]',
};

export function Button({
  label: text,
  variant = 'primary',
  size = 'md',
  full,
  icon,
  iconRight,
  className = '',
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      // Web memakai :hover/:active; di ponsel tak ada hover, jadi umpan balik
      // sentuhnya redup sesaat — itulah padanan `transition` di sana.
      className={[
        'flex-row items-center justify-center gap-2 rounded-2xl',
        box[variant],
        boxSize[size],
        full === true ? 'w-full' : '',
        disabled === true ? 'opacity-50' : '',
        className,
      ].join(' ')}
      style={({ pressed }) => (pressed && disabled !== true ? { opacity: 0.85 } : undefined)}
      {...rest}
    >
      {icon !== undefined && <View>{icon}</View>}
      <Text className={`font-sans font-bold ${label[variant]} ${labelSize[size]}`}>{text}</Text>
      {iconRight !== undefined && <View>{iconRight}</View>}
    </Pressable>
  );
}
