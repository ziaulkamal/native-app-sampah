import { useState, type ReactNode } from 'react';
import { Pressable, Text, TextInput, View, type TextInputProps } from 'react-native';
import { Icon, type IconName } from '@/components/ui/Icon';
import { useTheme } from '@/theme/ThemeProvider';
import { colors, shadows } from '@/tokens/tokens';

type AuthFieldProps = {
  label: string;
  icon?: IconName;
  hint?: string;
  /** Galat per-field dari 422. Web menitipkannya lewat `hint`; di sini punya slot sendiri. */
  error?: string;
  /** `inset` = kolom cekung di dalam kartu putih; `card` = kartu berdiri sendiri. */
  tone?: 'card' | 'inset';
} & Omit<TextInputProps, 'style' | 'className'>;

/** Field input berlabel dengan ikon opsional — gaya kartu auth. */
export function AuthField({
  label,
  icon,
  hint,
  error,
  tone = 'card',
  onFocus,
  onBlur,
  ...rest
}: AuthFieldProps) {
  const { mode } = useTheme();
  const [focused, setFocused] = useState(false);
  const message = error ?? hint;
  const inset = tone === 'inset';

  // Lebar border tak pernah berubah, hanya warnanya: border RN digambar di dalam kotak,
  // jadi memunculkannya saat fokus akan menggeser isi 1px tiap papan ketik dibuka.
  const line =
    error !== undefined ? 'border-danger' : focused && inset ? 'border-olive' : 'border-line';

  return (
    <View className="mb-3.5">
      <Text className="mb-2 font-sans text-[12.5px] font-semibold text-ink">{label}</Text>
      <View
        className={
          inset
            ? `h-[56px] flex-row items-center gap-2.5 rounded-[14px] border-[1.5px] bg-surface2 px-[15px] ${line}`
            : `h-[52px] flex-row items-center gap-2.5 rounded-[14px] bg-surface px-[15px] ${
                error !== undefined ? 'border border-danger' : ''
              }`
        }
        style={inset ? undefined : shadows.card}
      >
        {icon !== undefined && (
          <Icon
            name={icon}
            size={18}
            color={focused && inset ? colors[mode].olive : colors[mode]['text-dim']}
          />
        )}
        <TextInput
          {...rest}
          accessibilityLabel={label}
          placeholderTextColor={colors[mode]['text-dim']}
          selectionColor={colors[mode].olive}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          className="h-full flex-1 font-sans text-[14px] text-ink"
        />
      </View>
      {message !== undefined && (
        <Text
          className={`mt-1.5 font-sans text-[11px] leading-snug ${
            error !== undefined ? 'font-semibold text-danger' : 'text-dim'
          }`}
        >
          {message}
        </Text>
      )}
    </View>
  );
}

/** Kartu putih tempat formulir berdiri, mengambang di atas latar. */
export function AuthCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <View className={`rounded-[22px] bg-surface px-5 py-[22px] ${className}`} style={shadows.pop}>
      {children}
    </View>
  );
}

/** Pemisah dua jalur setara, mis. "atau". */
export function AuthDivider({ label }: { label: string }) {
  return (
    <View className="my-3.5 flex-row items-center gap-3">
      <View className="h-px flex-1 bg-line" />
      <Text className="font-sans text-[11.5px] text-dim">{label}</Text>
      <View className="h-px flex-1 bg-line" />
    </View>
  );
}

/** Keterangan netral berikon di luar kartu formulir. */
export function AuthInfo({ children }: { children: ReactNode }) {
  const { mode } = useTheme();
  return (
    <View className="flex-row gap-2.5 rounded-[16px] border border-line bg-surface2 px-4 py-3.5">
      <Icon name="info" size={16} color={colors[mode]['text-dim']} />
      <Text className="flex-1 font-sans text-[11.5px] leading-snug text-dim">{children}</Text>
    </View>
  );
}

/** Banner galat auth. Tidak merender apa pun bila tidak ada pesan. */
export function AuthAlert({ message }: { message: string | null }) {
  if (message === null) return null;
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      className="mb-4 rounded-[14px] border border-danger/30 bg-danger/10 px-4 py-3"
    >
      <Text className="font-sans text-[12.5px] font-semibold leading-snug text-danger">
        {message}
      </Text>
    </View>
  );
}

/** Pemberitahuan netral (mis. kode OTP terkirim). */
export function AuthNotice({ message }: { message: string | null }) {
  if (message === null) return null;
  return (
    <View className="mb-4 rounded-[14px] border border-olive/25 bg-pill px-4 py-3">
      <Text className="font-sans text-[12.5px] font-semibold leading-snug text-olive">
        {message}
      </Text>
    </View>
  );
}

interface Choice<T extends string> {
  id: T;
  label: string;
}

/**
 * Deret pilihan saling-eksklusif setinggi 44dp.
 *
 * Web menulis markup yang sama tiga kali (mode masuk, kanal OTP, jenis kelamin) karena
 * di sana tiap salinan hanya beberapa baris; di RN salinan itu jauh lebih panjang dan
 * perbedaan sekecil apa pun langsung terlihat sebagai tombol yang tingginya beda.
 */
export function ChoiceTabs<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (next: T) => void;
  options: Choice<T>[];
}) {
  return (
    <View className="mb-4 flex-row gap-2">
      {options.map((option) => {
        const on = option.id === value;
        return (
          <Pressable
            key={option.id}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(option.id)}
            className={`min-h-[44px] flex-1 items-center justify-center rounded-xl border-[1.5px] ${
              on ? 'border-olive bg-pill' : 'border-line bg-surface'
            }`}
            style={({ pressed }) => (pressed ? { opacity: 0.85 } : undefined)}
          >
            <Text className={`font-sans text-[12.5px] font-bold ${on ? 'text-olive' : 'text-dim'}`}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Baris tertaut di kaki formulir, mis. "Belum punya akun? Daftar". */
export function AuthLink({
  text,
  action,
  onPress,
}: {
  text: string;
  action: string;
  onPress: () => void;
}) {
  return (
    <View className="mt-5 flex-row items-center justify-center">
      <Text className="font-sans text-[13px] text-dim">{text} </Text>
      <Pressable accessibilityRole="link" onPress={onPress} hitSlop={10}>
        <Text className="font-sans text-[13px] font-bold text-olive">{action}</Text>
      </Pressable>
    </View>
  );
}
