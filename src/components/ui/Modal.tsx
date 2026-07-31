import type { ReactNode } from 'react';
import { Modal as RNModal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { colors } from '@/tokens/tokens';
import { Icon } from './Icon';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  /**
   * Di web ini melebarkan panel jadi 720px. Di ponsel lebarnya selalu penuh, jadi
   * prop-nya dipertahankan agar pemanggil tak perlu diubah, tapi tak berefek.
   */
  wide?: boolean;
}

/**
 * Bottom sheet. Di web komponen ini punya dua wajah — kartu terpusat di desktop,
 * sheet di layar kecil; di sini hanya wajah kedua yang tersisa.
 *
 * Memakai `Modal` bawaan RN, bukan overlay absolute: hanya itu yang menangkap tombol
 * Back Android. Tanpa itu Back akan melompati sheet dan menutup layar di belakangnya.
 */
export function Modal({ open, onClose, title, children, footer }: ModalProps) {
  const { mode } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <RNModal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 justify-end">
        <Pressable
          accessibilityLabel="Tutup"
          onPress={onClose}
          className="absolute inset-0 bg-black/45"
        />
        <View
          style={{ maxHeight: '92%', paddingBottom: insets.bottom }}
          className="rounded-t-[22px] bg-surface shadow-pop"
        >
          {/* `min-h`: judul dua baris atau font sistem besar meninggikan kepalanya,
              bukan memotong judul. */}
          <View className="min-h-[56px] flex-none flex-row items-center justify-between gap-3 border-b border-line px-5 py-2">
            <Text className="flex-1 font-sans text-[15px] font-extrabold text-ink">{title}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tutup"
              onPress={onClose}
              hitSlop={6}
              className="h-9 w-9 items-center justify-center rounded-lg bg-pill"
            >
              <Icon name="x" size={18} color={colors[mode].text} />
            </Pressable>
          </View>

          <ScrollView
            className="p-5"
            contentContainerClassName="gap-3"
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>

          {footer !== undefined && (
            <View className="flex-none flex-row justify-end gap-3 border-t border-line p-4">
              {footer}
            </View>
          )}
        </View>
      </View>
    </RNModal>
  );
}
