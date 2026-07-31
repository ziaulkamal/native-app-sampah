import { cloneElement, isValidElement } from 'react';
import { Pressable, Text, View, type PressableProps } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { colors } from '@/tokens/tokens';

/** `outline-danger`: aksi destruktif yang berdampingan dengan aksi utama — ghost di
 *  posisi itu terbaca seperti "batal", padahal akibatnya tidak sepele. */
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline-danger';
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
  'outline-danger': 'border-[1.5px] border-line bg-surface',
};

const label: Record<Variant, string> = {
  primary: 'text-white',
  secondary: 'text-ink',
  ghost: 'text-olive',
  danger: 'text-white',
  'outline-danger': 'text-danger',
};

// Olive gelap (#A6B84B) terlalu terang untuk teks putih. Di mode gelap tombol utama
// dibalik jadi lime berisi teks gelap — pola yang sama dengan FAB di bilah bawah.
const FLIPPED_PRIMARY = 'bg-lime';

// `min-h` pada `sm`: tanpa itu tombol kecil berhenti di ~38dp, di bawah 44dp yang
// dipakai sebagai target sentuh minimum di repo ini.
const boxSize: Record<Size, string> = {
  sm: 'min-h-[44px] px-5 py-3',
  md: 'px-6 py-4',
};

const labelSize: Record<Size, string> = {
  sm: 'text-[13px]',
  md: 'text-[15px]',
};

/** Menimpa prop `color` ikon pemanggil; `undefined` berarti biarkan apa adanya. */
function tinted(icon: React.ReactNode, color?: string) {
  if (color === undefined || !isValidElement<{ color?: string }>(icon)) return icon;
  return cloneElement(icon, { color });
}

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
  const { mode } = useTheme();
  const flip = variant === 'primary' && mode === 'dark';
  // Tombol berlatar penuh mengatur warna isinya sendiri; ikon dari pemanggil ikut
  // diwarnai ulang supaya tak ada lagi ikon putih di atas lime.
  const solid = variant === 'primary' || variant === 'danger';
  const fg = flip ? colors.light.text : '#fff';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      // Web memakai :hover/:active; di ponsel tak ada hover, jadi umpan balik
      // sentuhnya redup sesaat — itulah padanan `transition` di sana.
      className={[
        'flex-row items-center justify-center gap-2 rounded-2xl',
        flip ? FLIPPED_PRIMARY : box[variant],
        boxSize[size],
        full === true ? 'w-full' : '',
        disabled === true ? 'opacity-50' : '',
        className,
      ].join(' ')}
      style={({ pressed }) => (pressed && disabled !== true ? { opacity: 0.85 } : undefined)}
      {...rest}
    >
      {icon !== undefined && <View>{tinted(icon, solid ? fg : undefined)}</View>}
      <Text
        className={`font-sans font-bold ${solid ? '' : label[variant]} ${labelSize[size]}`}
        style={solid ? { color: fg } : undefined}
      >
        {text}
      </Text>
      {iconRight !== undefined && <View>{tinted(iconRight, solid ? fg : undefined)}</View>}
    </Pressable>
  );
}
