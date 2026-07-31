import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { Pressable, Text, View } from 'react-native';
import { ScreenScaffold } from '@/components/layout/ScreenScaffold';
import { Avatar } from '@/components/ui/Avatar';
import { Icon, type IconName } from '@/components/ui/Icon';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatCard } from '@/components/ui/StatCard';
import { formatRupiahShort, toPercent } from '@/lib/format';
import type { OperatorBerandaParams } from '@/navigation/types';
import { useApp } from '@/store/AppContext';
import { useTheme } from '@/theme/ThemeProvider';
import { colors } from '@/tokens/tokens';
import { CollectRow } from './CollectRow';
import { useOperatorData } from './useOperatorData';

type Nav = NavigationProp<OperatorBerandaParams>;

const ACTIONS: { to: 'OperatorVerifikasi' | 'OperatorSetor'; label: string; icon: IconName }[] = [
  { to: 'OperatorVerifikasi', label: 'Verifikasi', icon: 'qr' },
  { to: 'OperatorSetor', label: 'Setor Kas', icon: 'wallet' },
];

/** Beranda Petugas: cakupan wilayah, kas hari ini, aksi cepat, rute penagihan. */
export function OperatorHome() {
  const { payBill, session } = useApp();
  const nav = useNavigation<Nav>();
  const { op, zones, list, billFor, unpaidCountFor, collectedToday } = useOperatorData();
  const outstanding = list.filter((c) => billFor.get(c.id)?.status !== 'lunas').length;
  // Beban kerja petugas diukur cakupan wilayah, bukan target rupiah (keputusan dinas).
  const covered = list.length - outstanding;
  const pct = toPercent(covered, list.length);

  return (
    <ScreenScaffold>
      {/* `MobileTopBar` web tak diporting: header tab sudah memegang judul dan lonceng,
          jadi identitas petugas turun jadi baris pertama isi layar. */}
      <View className="flex-row items-center gap-3">
        <Avatar
          name={op?.name ?? 'Petugas'}
          src={session?.avatarUrl ?? undefined}
          size={46}
          icon="truck"
        />
        <View className="flex-1">
          <Text className="text-[9.5px] font-semibold uppercase tracking-wider text-olive">
            Petugas Retribusi
          </Text>
          <Text className="text-[18px] font-extrabold text-ink" numberOfLines={1}>
            {op?.name ?? '—'}
          </Text>
        </View>
      </View>

      <View className="rounded-xl3 bg-surface p-5 shadow-card">
        <View className="mb-1 flex-row items-center justify-between">
          <Text className="text-[11px] font-semibold uppercase tracking-wide text-dim">
            Cakupan penagihan
          </Text>
          <Text className="text-[13px] font-extrabold text-olive">{pct}%</Text>
        </View>
        <Text className="text-[26px] font-extrabold leading-none text-ink">
          {covered} / {list.length} titik
        </Text>
        <Text className="mb-3 mt-1 text-[12px] text-dim">
          {zones.length} zona · {outstanding} titik masih menunggu
        </Text>
        <ProgressBar value={pct} />
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1">
          <StatCard
            label="Terkumpul hari ini"
            value={formatRupiahShort(collectedToday)}
            icon="wallet"
          />
        </View>
        <View className="flex-1">
          <StatCard label="Sisa tagihan" value={`${outstanding} pelanggan`} icon="receipt" />
        </View>
      </View>

      <View className="flex-row gap-3">
        {ACTIONS.map((a) => (
          <ActionCard key={a.to} label={a.label} icon={a.icon} onPress={() => nav.navigate(a.to)} />
        ))}
      </View>

      <View className="gap-3">
        <SectionHeader title="Rute penagihan hari ini" />
        {list.map((c) => {
          const bill = billFor.get(c.id);
          if (!bill) return null;
          return (
            <CollectRow
              key={c.id}
              customer={c}
              bill={bill}
              moreCount={Math.max(0, (unpaidCountFor.get(c.id) ?? 0) - 1)}
              onCollect={() => void payBill(bill.id, { method: 'tunai' })}
            />
          );
        })}
      </View>
    </ScreenScaffold>
  );
}

function ActionCard({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: IconName;
  onPress: () => void;
}) {
  const { mode } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="flex-1 flex-row items-center gap-2.5 rounded-xl2 bg-surface p-3.5 shadow-card"
    >
      <View className="h-9 w-9 items-center justify-center rounded-lg bg-pill">
        <Icon name={icon} size={19} color={colors[mode].olive} />
      </View>
      <Text className="flex-1 text-[13px] font-bold text-ink" numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}
