import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ScreenScaffold } from '@/components/layout/ScreenScaffold';
import { Icon } from '@/components/ui/Icon';
import { Pagination } from '@/components/ui/Pagination';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { CustomerMap } from '@/features/map/CustomerMap';
import { toPercent } from '@/lib/format';
import { usePagination } from '@/lib/pagination';
import { useTheme } from '@/theme/ThemeProvider';
import { colors } from '@/tokens/tokens';
import { useOperatorData } from './useOperatorData';

type View2 = 'list' | 'map';

/** Rute operator: progres penagihan per zona + peta sebaran titik. Layar tab. */
export function OperatorRute() {
  const { zones, list, billFor } = useOperatorData();
  const [view, setView] = useState<View2>('list');
  // Hanya sisi "Zona" yang berhalaman; petanya sengaja utuh, sebaran titik yang
  // dipotong sepuluh-sepuluh berhenti menggambarkan rute.
  const { items: shownZones, bind } = usePagination(zones);

  const header = (
    <View className="flex-row items-center justify-between">
      <View className="flex-1">
        <Text className="text-[9.5px] font-semibold uppercase tracking-wider text-olive">
          Operator Restribusi
        </Text>
        <Text className="text-[20px] font-extrabold text-ink">Rute Saya</Text>
      </View>
      <View className="flex-row rounded-xl bg-pill p-1">
        {(['list', 'map'] as const).map((v) => (
          <Pressable
            key={v}
            onPress={() => setView(v)}
            accessibilityRole="button"
            accessibilityState={{ selected: view === v }}
            className={`rounded-lg px-3 py-1.5 ${view === v ? 'bg-surface shadow-card' : ''}`}
          >
            <Text className={`text-[12px] font-semibold ${view === v ? 'text-ink' : 'text-dim'}`}>
              {v === 'list' ? 'Zona' : 'Peta'}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  // Peta memakan gestur geser, jadi tampilan peta melepas gulir layar dan mengisi
  // sisa tinggi — peta 460dp di dalam ScrollView akan saling rebut sentuhan.
  if (view === 'map') {
    return (
      <ScreenScaffold scroll={false}>
        <View className="p-4 pb-3">{header}</View>
        <CustomerMap customers={list} className="flex-1" bleed />
      </ScreenScaffold>
    );
  }

  return (
    <ScreenScaffold>
      {header}
      <View className="gap-3">
        {shownZones.map((z) => {
          const inZone = list.filter((c) => c.zoneId === z.id);
          const paid = inZone.filter((c) => billFor.get(c.id)?.status === 'lunas').length;
          const pct = toPercent(paid, inZone.length);
          return <ZoneCard key={z.id} name={z.name} paid={paid} total={inZone.length} pct={pct} />;
        })}
        <Pagination {...bind} unit="zona" className="rounded-xl2 bg-surface shadow-card" />
      </View>
    </ScreenScaffold>
  );
}

function ZoneCard({
  name,
  paid,
  total,
  pct,
}: {
  name: string;
  paid: number;
  total: number;
  pct: number;
}) {
  const { mode } = useTheme();
  return (
    <View className="rounded-xl2 bg-surface p-4 shadow-card">
      <View className="flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-pill">
          <Icon name="pin" size={20} color={colors[mode].olive} />
        </View>
        <View className="flex-1">
          <Text className="text-[14px] font-bold text-ink" numberOfLines={1}>
            {name}
          </Text>
          <Text className="mt-0.5 text-[11.5px] text-dim">
            {paid}/{total} pelanggan lunas
          </Text>
        </View>
        <Text className="text-[14px] font-extrabold text-olive">{pct}%</Text>
      </View>
      <View className="mt-3">
        <ProgressBar value={pct} />
      </View>
    </View>
  );
}
