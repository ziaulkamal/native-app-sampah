import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useApp } from '@/store/AppContext';
import { useTheme } from '@/theme/ThemeProvider';
import { colors, semantic } from '@/tokens/tokens';
import { Icon } from './Icon';

/**
 * Keadaan pemuatan data global. Muncul di atas konten tiap layar supaya tiap layar
 * punya keadaan memuat/gagal tanpa harus menuliskannya ulang satu per satu.
 *
 * Di ponsel bar ini bukan satu-satunya jalan mencoba lagi: layar berdaftar memakai
 * `RefreshControl` (tarik-untuk-menyegarkan) yang memanggil `refresh()` yang sama.
 */
export function DataBanner() {
  const { dataState, dataError, refresh } = useApp();
  if (dataState === 'loading') return <Bar tone="info" message="Memuat data dari server…" />;
  if (dataState !== 'error') return null;

  return (
    <Bar
      tone="danger"
      message={dataError ?? 'Gagal memuat data.'}
      action={
        <Pressable accessibilityRole="button" onPress={() => void refresh()} hitSlop={8}>
          <Text className="font-sans text-[12.5px] font-bold text-danger underline">Coba lagi</Text>
        </Pressable>
      }
    />
  );
}

function Bar({
  tone,
  message,
  action,
}: {
  tone: 'info' | 'danger';
  message: string;
  action?: ReactNode;
}) {
  const { mode } = useTheme();
  const danger = tone === 'danger';
  return (
    <View
      accessibilityRole={danger ? 'alert' : undefined}
      accessibilityLiveRegion={danger ? 'assertive' : 'polite'}
      className={`flex-row items-center gap-2.5 px-4 py-2.5 ${danger ? 'bg-danger/10' : 'bg-pill'}`}
    >
      <Icon
        name={danger ? 'bell' : 'receipt'}
        size={16}
        color={danger ? semantic.danger : colors[mode].olive}
      />
      <Text
        className={`min-w-0 flex-1 font-sans text-[12.5px] font-semibold ${danger ? 'text-danger' : 'text-olive'}`}
      >
        {message}
      </Text>
      {action}
    </View>
  );
}
