import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ScreenScaffold } from '@/components/layout/ScreenScaffold';
import { ScreenTitle } from '@/components/layout/ScreenTitle';
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
    <ScreenTitle
      eyebrow="Operator Retribusi"
      title="Rute Saya"
      action={<Segmented value={view} onChange={setView} />}
    />
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

/** Pemilih Zona/Peta. Ubinnya 40dp — 30dp sebelumnya di bawah target sentuh repo ini. */
function Segmented({ value, onChange }: { value: View2; onChange: (v: View2) => void }) {
  const { mode } = useTheme();

  return (
    <View className="flex-row rounded-xl bg-pill p-1">
      {(
        [
          { id: 'list', label: 'Zona', icon: 'bars' },
          { id: 'map', label: 'Peta', icon: 'pin' },
        ] as const
      ).map((seg) => {
        const on = value === seg.id;
        return (
          <Pressable
            key={seg.id}
            onPress={() => onChange(seg.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            className={`h-10 flex-row items-center gap-1.5 rounded-lg px-3.5 ${
              on ? 'bg-surface shadow-card' : ''
            }`}
          >
            <Icon
              name={seg.icon}
              size={14}
              color={on ? colors[mode].text : colors[mode]['text-dim']}
            />
            <Text className={`text-[12.5px] font-semibold ${on ? 'text-ink' : 'text-dim'}`}>
              {seg.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
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
  // Bar olive seragam menyembunyikan zona yang tertinggal; di bawah separuh ia jadi warning.
  const behind = pct < 50;

  return (
    <View className="rounded-xl2 bg-surface p-4 shadow-card">
      {/* Ikon pin yang sama di tiap kartu tak membedakan apa-apa — ruangnya diberikan
          ke angka persen, data yang sebenarnya dicari petugas. */}
      <View className="flex-row items-center gap-3">
        <View className="flex-1">
          <Text className="text-[14px] font-bold text-ink" numberOfLines={1}>
            {name}
          </Text>
          <Text className="mt-0.5 text-[11.5px] text-dim">
            {paid}/{total} pelanggan lunas
          </Text>
        </View>
        <Text className={`text-[17px] font-extrabold ${behind ? 'text-warning' : 'text-olive'}`}>
          {pct}%
        </Text>
      </View>
      <View className="mt-3">
        <ProgressBar value={pct} tone={behind ? 'warning' : 'olive'} />
      </View>
    </View>
  );
}
