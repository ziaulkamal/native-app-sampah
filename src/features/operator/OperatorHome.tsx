import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { Text, View } from 'react-native';
import {
  greetingNow,
  HeroAmount,
  HeroGreeting,
  HeroScaffold,
} from '@/components/layout/HeroScaffold';
import { Avatar } from '@/components/ui/Avatar';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatCard } from '@/components/ui/StatCard';
import { NotificationBell } from '@/features/notifikasi/NotificationBell';
import { HomeMenu, type HomeMenuItem } from '@/features/shared/HomeMenu';
import { formatRupiah, formatRupiahShort, toPercent } from '@/lib/format';
import type { OperatorTabParams } from '@/navigation/types';
import { useApp } from '@/store/AppContext';
import { CollectRow } from './CollectRow';
import { useOperatorData } from './useOperatorData';

type Nav = NavigationProp<OperatorTabParams>;

/** Beranda Petugas: kas di tangan, cakupan penagihan, aksi lapangan, rute hari ini. */
export function OperatorHome() {
  const { payBill, session } = useApp();
  const nav = useNavigation<Nav>();
  const { op, zones, list, billFor, unpaidCountFor, collectedToday, cash } = useOperatorData();

  const outstanding = list.filter((c) => billFor.get(c.id)?.status !== 'lunas').length;
  // Beban kerja petugas diukur cakupan wilayah, bukan target rupiah (keputusan dinas).
  const covered = list.length - outstanding;

  const menu: HomeMenuItem[] = [
    { label: 'Rute', icon: 'route', onPress: () => nav.navigate('Rute', { screen: 'OperatorRute' }) },
    {
      label: 'Penagihan',
      icon: 'wallet',
      badge: outstanding,
      onPress: () => nav.navigate('Tagih', { screen: 'OperatorPenagihan' }),
    },
    {
      label: 'Verifikasi',
      icon: 'qr',
      onPress: () => nav.navigate('Beranda', { screen: 'OperatorVerifikasi' }),
    },
    {
      label: 'Setor kas',
      icon: 'receipt',
      onPress: () => nav.navigate('Beranda', { screen: 'OperatorSetor' }),
    },
  ];

  return (
    <HeroScaffold
      hero={
        <>
          <HeroGreeting
            avatar={
              <Avatar
                name={op?.name ?? 'Petugas'}
                src={session?.avatarUrl ?? undefined}
                size={44}
                icon="truck"
              />
            }
            greeting={greetingNow()}
            name={op?.name ?? '—'}
            right={<NotificationBell onHero />}
          />
          <HeroAmount
            label="Kas di tangan · belum disetor"
            amount={formatRupiah(cash.total).replace('Rp', '').trim()}
          />
          <Coverage covered={covered} total={list.length} />
        </>
      }
    >
      <HomeMenu items={menu} />

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

      <Text className="px-1 text-[11px] leading-snug text-dim">
        {zones.length} zona dalam tanggung jawab Anda. Kas di tangan berkurang setelah setoran
        disetujui admin, bukan saat diajukan.
      </Text>
    </HeroScaffold>
  );
}

/**
 * Cakupan penagihan di kaki kepala: satu bilah tipis, bukan kartu tersendiri.
 * Bilahnya lime, satu-satunya warna yang tetap terbaca di atas olive maupun di gelap.
 */
function Coverage({ covered, total }: { covered: number; total: number }) {
  const pct = toPercent(covered, total);

  return (
    <View className="mt-6">
      <View className="mb-1.5 flex-row items-center justify-between">
        <Text className="font-sans text-[11px] font-semibold uppercase tracking-wide text-white/70">
          Cakupan penagihan
        </Text>
        <Text className="font-sans text-[12px] font-extrabold text-white">
          {covered}/{total}
        </Text>
      </View>
      <View className="h-1.5 overflow-hidden rounded-full bg-white/20">
        <View className="h-full rounded-full bg-lime" style={{ width: `${pct}%` }} />
      </View>
    </View>
  );
}
