import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { PAGE_SIZES, type PaginationBind } from '@/lib/pagination';
import { useTheme } from '@/theme/ThemeProvider';
import { colors } from '@/tokens/tokens';
import { Icon } from './Icon';
import { Modal } from './Modal';

interface PaginationProps extends PaginationBind {
  /** Kata benda barisnya — "137 pelanggan" lebih terbaca dari "137 baris". */
  unit?: string;
  /** Kunci kontrol selama halaman berikutnya masih diambil dari server. */
  busy?: boolean;
  className?: string;
}

/**
 * Kontrol halaman versi ponsel.
 *
 * Deretan nomor halaman web dilepas: pada lebar 390dp tujuh target 32dp berdempetan
 * jadi barisan yang sulit ditekan tepat, sementara lompat ke halaman 7 hampir tak
 * pernah dipakai di ponsel — yang dipakai maju/mundur. Nomor halaman kini tinggal
 * satu penunjuk "3/14", dan pemilih jumlah baris pindah ke bottom sheet.
 */
export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  unit = 'baris',
  busy = false,
  className = '',
}: PaginationProps) {
  const { mode } = useTheme();
  const [sizeOpen, setSizeOpen] = useState(false);

  // Sama seperti web: daftar yang muat pada ukuran terkecil tak perlu kontrol apa pun.
  if (total <= PAGE_SIZES[0]) return null;

  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <View className={`flex-row flex-wrap items-center gap-x-3 gap-y-2 px-5 py-3 ${className}`}>
      <Text className="font-sans text-[11.5px] text-dim">
        Menampilkan{' '}
        <Text className="font-semibold text-ink">
          {from}–{to}
        </Text>{' '}
        dari {total} {unit}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Jumlah baris per halaman"
        accessibilityValue={{ text: `${pageSize} per halaman` }}
        disabled={busy}
        onPress={() => setSizeOpen(true)}
        className={`h-8 flex-row items-center gap-1 rounded-lg border border-line bg-surface px-2 ${
          busy ? 'opacity-50' : ''
        }`}
      >
        <Text className="font-sans text-[11.5px] text-ink">{pageSize}/hal</Text>
        <Icon name="chevron" size={12} color={colors[mode]['text-dim']} />
      </Pressable>

      <View className="ml-auto flex-row items-center gap-1">
        <Step
          label="Halaman sebelumnya"
          back
          disabled={busy || page <= 1}
          onPress={() => onPageChange(page - 1)}
        />
        <Text className="min-w-[46px] text-center font-sans text-[12px] font-semibold text-ink">
          {page}/{lastPage}
        </Text>
        <Step
          label="Halaman berikutnya"
          disabled={busy || page >= lastPage}
          onPress={() => onPageChange(page + 1)}
        />
      </View>

      <Modal open={sizeOpen} onClose={() => setSizeOpen(false)} title="Baris per halaman">
        {PAGE_SIZES.map((size) => {
          const active = size === pageSize;
          return (
            <Pressable
              key={size}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => {
                onPageSizeChange(size);
                setSizeOpen(false);
              }}
              className={`min-h-[46px] flex-row items-center justify-between rounded-xl px-3.5 py-3 ${
                active ? 'bg-pill' : ''
              }`}
            >
              <Text className={`font-sans text-[13.5px] text-ink ${active ? 'font-semibold' : ''}`}>
                {size} / halaman
              </Text>
              {active && <Icon name="check" size={16} color={colors[mode].olive} />}
            </Pressable>
          );
        })}
      </Modal>
    </View>
  );
}

/** Tombol maju/mundur satu halaman; chevron dibalik untuk arah mundur. */
function Step({
  label,
  back,
  disabled,
  onPress,
}: {
  label: string;
  back?: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const { mode } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={6}
      className={`h-8 w-8 items-center justify-center rounded-lg ${disabled ? 'opacity-40' : ''}`}
    >
      <Icon
        name="chevron"
        size={16}
        color={colors[mode].text}
        style={back === true ? { transform: [{ rotate: '180deg' }] } : undefined}
      />
    </Pressable>
  );
}
