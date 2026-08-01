import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { Pressable, Text, View } from 'react-native';
import {
  greetingNow,
  HeroAmount,
  HeroGreeting,
  HeroScaffold,
} from '@/components/layout/HeroScaffold';
import { Avatar } from '@/components/ui/Avatar';
import { Icon, type IconName } from '@/components/ui/Icon';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatCard } from '@/components/ui/StatCard';
import { NotificationBell } from '@/features/notifikasi/NotificationBell';
import { formatRupiah, formatRupiahShort, toPercent } from '@/lib/format';
import { useVerticalRhythm } from '@/lib/rhythm';
import type { OperatorTabParams } from '@/navigation/types';
import { useApp } from '@/store/AppContext';
import { useTheme } from '@/theme/ThemeProvider';
import { colors, shadows } from '@/tokens/tokens';
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
            right={<NotificationBell place="hero" />}
          />
          <HeroAmount
            label="Kas di tangan · belum disetor"
            amount={formatRupiah(cash.total).replace('Rp', '').trim()}
          />
          <Coverage covered={covered} total={list.length} />
        </>
      }
    >
      {/* Rute dan Penagihan sudah jadi tab di bilah bawah; menyisakan keduanya di menu
          hanya menggandakan pintu. Yang unik tinggal dua, jadi muat sebagai kartu berketerangan. */}
      <View className="flex-row gap-3">
        <ActionCard
          icon="qr"
          title="Verifikasi"
          hint="Pengajuan tunai"
          onPress={() => nav.navigate('Beranda', { screen: 'OperatorVerifikasi' })}
        />
        <ActionCard
          icon="receipt"
          title="Setor kas"
          hint={`${formatRupiah(cash.total)} siap`}
          onPress={() => nav.navigate('Beranda', { screen: 'OperatorSetor' })}
        />
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
          {/* Angka tunggakan memang milik statistik ini, bukan sudut ikon menu. */}
          <StatCard
            label="Sisa tagihan"
            value={String(outstanding)}
            unit="pelanggan"
            icon="receipt"
            badge={outstanding > 0 ? String(outstanding) : undefined}
          />
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

      <Note zones={zones.length} />
    </HeroScaffold>
  );
}

/** Pintu aksi lapangan: ikon bisu diberi judul dan keterangan isinya. */
function ActionCard({
  icon,
  title,
  hint,
  onPress,
}: {
  icon: IconName;
  title: string;
  hint: string;
  onPress: () => void;
}) {
  const { mode } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${hint}`}
      onPress={onPress}
      className="flex-1 flex-row items-center gap-3 rounded-[22px] bg-surface px-4 py-[18px]"
      style={({ pressed }) => [shadows.pop, pressed ? { opacity: 0.85 } : undefined]}
    >
      <View className="h-[46px] w-[46px] items-center justify-center rounded-full bg-pill">
        <Icon name={icon} size={22} color={colors[mode].olive} />
      </View>
      <View className="flex-1">
        <Text className="text-[13px] font-extrabold text-ink" numberOfLines={1}>
          {title}
        </Text>
        {/* Keterangannya boleh membungkus: nominal rupiah yang di-ellipsis hilang artinya. */}
        <Text className="mt-0.5 text-[11px] text-dim">{hint}</Text>
      </View>
    </Pressable>
  );
}

/**
 * Aturan kas di kotak info, bukan teks lepas yang mengambang di bawah daftar.
 *
 * Tanpa margin bawah: jarak ekor halaman milik `pb-14` scaffold, bukan kotak terakhirnya.
 */
function Note({ zones }: { zones: number }) {
  const { mode } = useTheme();

  return (
    <View className="flex-row items-start gap-2.5 rounded-xl bg-surface2 px-3.5 py-3">
      <Icon name="info" size={15} color={colors[mode].olive} />
      <Text className="flex-1 text-[11.5px] leading-relaxed text-dim">
        {zones} zona dalam tanggung jawab Anda. Kas di tangan berkurang setelah setoran disetujui
        admin, bukan saat diajukan.
      </Text>
    </View>
  );
}

/**
 * Cakupan penagihan di kaki kepala: satu bilah tipis, bukan kartu tersendiri.
 * Bilahnya lime, satu-satunya warna yang tetap terbaca di atas olive maupun di gelap.
 */
function Coverage({ covered, total }: { covered: number; total: number }) {
  const pct = toPercent(covered, total);
  const rhythm = useVerticalRhythm();

  return (
    // 4dp lebih lapang dari kapsul `HeroPill`: bilah ini punya label di atasnya.
    <View style={{ marginTop: rhythm.hero.footTop + 4 }}>
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
