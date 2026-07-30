import { useState, type ReactNode } from 'react';
import { Pressable, Text, TextInput, View, type TextInputProps } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { colors } from '@/tokens/tokens';
import { Icon } from './Icon';
import { Modal } from './Modal';

interface WithLabel {
  label: string;
  hint?: string;
  /** Pesan galat per-field dari 422 backend. Web belum punya slot ini. */
  error?: string;
}

const boxCls = 'h-[46px] w-full rounded-xl border bg-surface px-3.5';
const textCls = 'font-sans text-[13.5px] text-ink';

/** Label + slot bantuan/galat yang dipakai ketiga field. */
function Field({ label, hint, error, children }: WithLabel & { children: ReactNode }) {
  return (
    <View>
      <Text className="mb-1.5 font-sans text-[12.5px] font-semibold text-ink">{label}</Text>
      {children}
      {error !== undefined ? (
        <Text className="mt-1 font-sans text-[11px] text-danger">{error}</Text>
      ) : (
        hint !== undefined && <Text className="mt-1 font-sans text-[11px] text-dim">{hint}</Text>
      )}
    </View>
  );
}

/** Warna garis: merah bila galat, olive saat fokus, abu selebihnya. */
function borderClass(focused: boolean, error?: string) {
  if (error !== undefined) return 'border-danger';
  return focused ? 'border-olive' : 'border-line';
}

type TextFieldProps = WithLabel & Omit<TextInputProps, 'style' | 'className'>;

/** Input teks berlabel. */
export function TextField({ label, hint, error, ...rest }: TextFieldProps) {
  const { mode } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <Field label={label} hint={hint} error={error}>
      <TextInput
        {...rest}
        accessibilityLabel={label}
        placeholderTextColor={colors[mode]['text-dim']}
        selectionColor={colors[mode].olive}
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
        className={`${boxCls} ${borderClass(focused, error)} ${textCls}`}
      />
    </Field>
  );
}

interface SelectOption {
  value: string;
  label: string;
}

type SelectFieldProps = WithLabel & {
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

/**
 * Dropdown berlabel. RN tak punya `<select>`, jadi polanya diganti: kotak yang
 * terlihat sama dengan TextField, tapi menekannya membuka bottom sheet berisi opsi.
 *
 * Prop `options` dipertahankan persis seperti web; `value`/`onChange` menggantikan
 * atribut `<select>` yang tak ada padanannya.
 */
export function SelectField({
  label,
  hint,
  error,
  options,
  value,
  onChange,
  placeholder = 'Pilih…',
  disabled,
}: SelectFieldProps) {
  const { mode } = useTheme();
  const [open, setOpen] = useState(false);
  const picked = options.find((o) => o.value === value);

  return (
    <Field label={label} hint={hint} error={error}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: picked?.label ?? placeholder }}
        accessibilityState={{ expanded: open, disabled: disabled === true }}
        disabled={disabled}
        onPress={() => setOpen(true)}
        className={`${boxCls} ${borderClass(open, error)} flex-row items-center justify-between ${
          disabled === true ? 'opacity-50' : ''
        }`}
      >
        <Text className={`${textCls} ${picked === undefined ? 'text-dim' : ''}`} numberOfLines={1}>
          {picked?.label ?? placeholder}
        </Text>
        <Icon name="chevron" size={16} color={colors[mode]['text-dim']} />
      </Pressable>

      <Modal open={open} onClose={() => setOpen(false)} title={label}>
        {options.map((o) => {
          const active = o.value === value;
          return (
            <Pressable
              key={o.value}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => {
                onChange(o.value);
                setOpen(false);
              }}
              className={`min-h-[46px] flex-row items-center justify-between rounded-xl px-3.5 py-3 ${
                active ? 'bg-pill' : ''
              }`}
            >
              <Text className={`${textCls} ${active ? 'font-semibold' : ''} flex-1 pr-3`}>
                {o.label}
              </Text>
              {active && <Icon name="check" size={16} color={colors[mode].olive} />}
            </Pressable>
          );
        })}
      </Modal>
    </Field>
  );
}

/** Textarea berlabel. Tingginya mengikuti web: 2 baris, tak bisa ditarik. */
export function TextareaField({
  label,
  hint,
  error,
  rows = 2,
  ...rest
}: TextFieldProps & { rows?: number }) {
  const { mode } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <Field label={label} hint={hint} error={error}>
      <TextInput
        {...rest}
        multiline
        numberOfLines={rows}
        textAlignVertical="top"
        accessibilityLabel={label}
        placeholderTextColor={colors[mode]['text-dim']}
        selectionColor={colors[mode].olive}
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
        style={{ minHeight: 22 * rows + 20 }}
        className={`w-full rounded-xl border bg-surface px-3.5 py-2.5 ${borderClass(focused, error)} ${textCls}`}
      />
    </Field>
  );
}
