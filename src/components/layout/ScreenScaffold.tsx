import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { DataBanner } from '@/components/ui/DataBanner';
import { useApp } from '@/store/AppContext';
import { useTheme } from '@/theme/ThemeProvider';
import { colors } from '@/tokens/tokens';

interface ScreenScaffoldProps {
  children: ReactNode;
  /** Layar yang mengatur gulirnya sendiri (mis. berisi FlatList atau peta). */
  scroll?: boolean;
}

/**
 * Kerangka isi layar — pengganti `MobileShell` web.
 *
 * Yang tersisa dari shell web hanyalah bagian ini: header dan nav bawah sudah dipegang
 * React Navigation. Tugasnya menempelkan `DataBanner` di atas isi dan menyediakan
 * tarik-untuk-menyegarkan, dua hal yang di web ada di shell dan akan hilang diam-diam
 * kalau tiap layar harus memasangnya sendiri.
 */
export function ScreenScaffold({ children, scroll = true }: ScreenScaffoldProps) {
  const { dataState, refresh } = useApp();
  const { mode } = useTheme();

  const banner = <DataBanner />;
  if (!scroll) {
    return (
      <View className="flex-1 bg-bg">
        {banner}
        {children}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg">
      {banner}
      <ScrollView
        contentContainerClassName="p-4 gap-4 pb-8"
        refreshControl={
          <RefreshControl
            refreshing={dataState === 'loading'}
            onRefresh={() => void refresh()}
            colors={[colors[mode].olive]}
            tintColor={colors[mode].olive}
          />
        }
      >
        {children}
      </ScrollView>
    </View>
  );
}
