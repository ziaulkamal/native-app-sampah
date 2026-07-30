import { Text, View } from 'react-native';
import { EmptyState } from '@/components/ui/EmptyState';
import type { IconName } from '@/components/ui/Icon';
import { ScreenScaffold } from './ScreenScaffold';

interface PlaceholderProps {
  title: string;
  icon?: IconName;
  /** Berkas web yang jadi sumber porting layar ini. */
  source: string;
}

/**
 * Layar yang sudah tersambung navigasi tapi isinya belum diporting.
 *
 * Ada dengan sengaja: kerangka navigasi & store bisa dijalankan dan diuji utuh
 * sebelum ~3.000 baris layar dipindahkan, dan tiap layar menyebutkan berkas web
 * asalnya supaya urutan pengerjaannya tak perlu ditebak lagi nanti.
 */
export function Placeholder({ title, icon = 'grid', source }: PlaceholderProps) {
  return (
    <ScreenScaffold>
      <View className="mt-8">
        <EmptyState icon={icon} title={title} message="Layar ini belum diporting dari web." />
        <Text className="mt-2 text-center font-mono text-[11px] text-dim">{source}</Text>
      </View>
    </ScreenScaffold>
  );
}
