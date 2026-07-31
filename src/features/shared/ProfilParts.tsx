import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Toggle } from '@/components/ui/Toggle';
import { useTheme } from '@/theme/ThemeProvider';
import { colors, semantic } from '@/tokens/tokens';

/** Kartu seksi profil dengan judul opsional. */
export function ProfilCard({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <View>
      {title !== undefined && (
        <Text className="mb-2 px-1 text-[10.5px] font-semibold uppercase tracking-wide text-dim">
          {title}
        </Text>
      )}
      {/* `divide-y` web tak ada di RN; garis pemisahnya dipasang tiap baris lewat
          `Row` di bawah, jadi kartunya sendiri cukup memotong sudut. */}
      <View className="overflow-hidden rounded-xl2 bg-surface shadow-card">{children}</View>
    </View>
  );
}

/** Pembungkus satu baris kartu; garis atas dilewati untuk baris pertama. */
function Row({ first, children }: { first?: boolean; children: ReactNode }) {
  return (
    <View
      className={`flex-row items-center gap-3 px-4 py-3.5 ${first === true ? '' : 'border-t border-line'}`}
    >
      {children}
    </View>
  );
}

/** Baris info label–nilai; opsional read-only (ikon gembok) atau aksi di kanan. */
export function InfoRow({
  label,
  value,
  locked,
  action,
  first,
}: {
  label: string;
  value: ReactNode;
  locked?: boolean;
  action?: ReactNode;
  first?: boolean;
}) {
  const { mode } = useTheme();
  return (
    <Row first={first}>
      <View className="flex-1">
        <Text className="text-[11.5px] text-dim">{label}</Text>
        {typeof value === 'string' ? (
          <Text className="mt-0.5 text-[13.5px] font-semibold text-ink">{value}</Text>
        ) : (
          <View className="mt-1 flex-row">{value}</View>
        )}
      </View>
      {/* `aria-label` web pindah ke pembungkusnya: `Icon` RN tak meneruskan prop aksesibilitas. */}
      {locked === true && (
        <View accessibilityLabel="Tidak bisa diubah">
          <Icon name="lock" size={16} color={colors[mode]['text-dim']} />
        </View>
      )}
      {action}
    </Row>
  );
}

/** Baris aksi yang bisa diketuk (mis. Ubah Password) dengan ikon kiri + chevron. */
export function ActionRow({
  icon,
  label,
  hint,
  tone = 'default',
  onPress,
  first,
}: {
  icon: IconName;
  label: string;
  hint?: string;
  tone?: 'default' | 'danger';
  onPress: () => void;
  first?: boolean;
}) {
  const { mode } = useTheme();
  const tint = tone === 'danger' ? semantic.danger : colors[mode].olive;

  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <Row first={first}>
        <View className="h-9 w-9 items-center justify-center rounded-lg bg-pill">
          <Icon name={icon} size={18} color={tint} />
        </View>
        <View className="flex-1">
          <Text
            className={`text-[13.5px] font-semibold ${tone === 'danger' ? 'text-danger' : 'text-ink'}`}
          >
            {label}
          </Text>
          {hint !== undefined && <Text className="mt-0.5 text-[11.5px] text-dim">{hint}</Text>}
        </View>
        <Icon name="chevron" size={16} color={colors[mode]['text-dim']} />
      </Row>
    </Pressable>
  );
}

/** Baris preferensi dengan switch on/off. */
export function ToggleRow({
  icon,
  label,
  checked,
  onChange,
  first,
}: {
  icon: IconName;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  first?: boolean;
}) {
  const { mode } = useTheme();
  return (
    <Row first={first}>
      <View className="h-9 w-9 items-center justify-center rounded-lg bg-pill">
        <Icon name={icon} size={18} color={colors[mode].olive} />
      </View>
      <Text className="flex-1 text-[13.5px] font-semibold text-ink">{label}</Text>
      <Toggle checked={checked} onChange={onChange} label={label} />
    </Row>
  );
}
