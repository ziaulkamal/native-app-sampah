import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Text, View } from 'react-native';
import { ScreenScaffold } from '@/components/layout/ScreenScaffold';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon, type IconName } from '@/components/ui/Icon';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { formatRupiah } from '@/lib/format';
import {
  BILL_BADGE,
  CUSTOMER_STATUS,
  golonganName,
  SCHEME_LABEL,
  SCHEME_SUFFIX,
} from '@/lib/labels';
import type { PelangganTabParams } from '@/navigation/types';
import { useApp } from '@/store/AppContext';
import { useTheme } from '@/theme/ThemeProvider';
import { colors } from '@/tokens/tokens';
import type { Bill } from '@/types';
import { LocationSwitcher } from './LocationSwitcher';
import { useActiveLocation } from './useActiveLocation';

type Nav = NavigationProp<PelangganTabParams>;

// Aksi cepat menunjuk rute, bukan `ScreenId` seperti di web — tujuannya sama, hanya
// pemilih layarnya kini React Navigation.
const QUICK: { label: string; icon: IconName; go: (nav: Nav) => void }[] = [
  {
    label: 'Bayar',
    icon: 'wallet',
    go: (n) => n.navigate('Tagihan', { screen: 'PelangganTagihan' }),
  },
  {
    label: 'Riwayat',
    icon: 'receipt',
    go: (n) => n.navigate('Tagihan', { screen: 'PelangganRiwayat' }),
  },
  {
    label: 'Jadwal',
    icon: 'calendar',
    go: (n) => n.navigate('Jadwal', { screen: 'PelangganJadwal' }),
  },
  { label: 'Aduan', icon: 'bell', go: (n) => n.navigate('Beranda', { screen: 'PelangganAduan' }) },
];

/** Beranda Pelanggan: tagihan retribusi, ringkasan langganan, akses cepat. */
export function PelangganHome() {
  const { zones, tariffs, dataState, session } = useApp();
  const { active: customer, locations, billsForActive, select } = useActiveLocation();
  const nav = useNavigation<Nav>();
  const { mode } = useTheme();

  if (customer === undefined) return <NoProfile loading={dataState === 'loading'} />;

  const zone = zones.find((z) => z.id === customer.zoneId);
  const golongan = tariffs.find((t) => t.id === customer.category);
  // Yang ditonjolkan adalah tagihan TERLAMA yang belum lunas: server mewajibkan
  // pelunasan berurutan, jadi menampilkan yang terbaru akan menyesatkan.
  const bill = oldestUnpaid(billsForActive) ?? billsForActive[0];
  const status = CUSTOMER_STATUS[customer.status];

  return (
    <ScreenScaffold>
      {/* Padanan `MobileTopBar` web. Header bawaan tab hanya memuat nama tab, sedangkan
          identitas titik aktif berubah-ubah — jadi ia tinggal di dalam isi layar. */}
      <View className="flex-row items-center gap-3">
        <Avatar name={customer.name} src={session?.avatarUrl ?? undefined} size={46} />
        <View className="flex-1">
          <Text className="text-[11px] font-semibold uppercase tracking-wide text-dim">
            {zone?.name ?? 'Pelanggan'}
          </Text>
          <Text className="text-[17px] font-extrabold text-ink" numberOfLines={1}>
            {customer.name}
          </Text>
        </View>
      </View>

      {locations.length > 1 && (
        <LocationSwitcher locations={locations} activeId={customer.id} onSelect={select} />
      )}

      <Pressable
        onPress={() => nav.navigate('Beranda', { screen: 'TambahLokasi' })}
        accessibilityRole="button"
        className="h-10 flex-row items-center justify-center gap-2 rounded-xl border border-dashed border-line"
      >
        <Icon name="plus" size={16} color={colors[mode].olive} />
        <Text className="text-[12.5px] font-semibold text-olive">Ajukan titik layanan baru</Text>
      </Pressable>

      {bill && (
        <BillCard
          bill={bill}
          onPay={() => nav.navigate('Tagihan', { screen: 'PelangganTagihan' })}
        />
      )}

      <View className="flex-row gap-2.5">
        {QUICK.map((q) => (
          <Pressable
            key={q.label}
            onPress={() => q.go(nav)}
            accessibilityRole="button"
            className="flex-1 items-center gap-2"
          >
            <View className="aspect-square w-full items-center justify-center rounded-[16px] bg-surface shadow-card">
              <Icon name={q.icon} size={22} color={colors[mode].olive} />
            </View>
            <Text className="text-[11px] font-semibold text-ink">{q.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Jadwal angkut tinggal di menu Jadwal (§31): sebaris di sini hanya memuat nama
          hari, sedangkan layarnya sendiri memberi kalender sepekan bertanggal. */}
      <SectionHeader title="Langganan" />
      <View className="gap-3 rounded-xl2 bg-surface p-4 shadow-card">
        <Row label="Golongan" value={golonganName(tariffs, customer.category)} />
        <Row
          label="Tarif"
          value={`${formatRupiah(customer.tariff)}${golongan ? ' ' + SCHEME_SUFFIX[golongan.scheme] : ''}`}
        />
        <Row label="Skema" value={golongan ? SCHEME_LABEL[golongan.scheme] : '-'} />
        <View className="flex-row items-center justify-between">
          <Text className="text-[12.5px] text-dim">Status</Text>
          <Badge label={status.label} tone={status.tone} />
        </View>
      </View>
    </ScreenScaffold>
  );
}

/** Tagihan terlama yang belum lunas — urutan inilah yang ditegakkan server. */
function oldestUnpaid(bills: Bill[]): Bill | undefined {
  return [...bills]
    .filter((b) => b.status !== 'lunas')
    .sort((a, b) => a.periodStart.localeCompare(b.periodStart))[0];
}

/** Pendaftar yang belum diverifikasi belum punya titik layanan — jelaskan, jangan kosongkan. */
function NoProfile({ loading }: { loading: boolean }) {
  return (
    <ScreenScaffold>
      <View className="mt-6">
        <EmptyState
          icon={loading ? 'receipt' : 'user'}
          title={loading ? 'Memuat data Anda…' : 'Langganan belum aktif'}
          message={
            loading
              ? 'Sedang mengambil profil dan tagihan Anda.'
              : 'Titik layanan Anda belum diverifikasi admin dinas. Tagihan akan muncul setelah aktif.'
          }
        />
      </View>
    </ScreenScaffold>
  );
}

/** Kartu tagihan retribusi periode berjalan. */
function BillCard({ bill, onPay }: { bill: Bill; onPay: () => void }) {
  const { mode } = useTheme();
  const badge = BILL_BADGE[bill.status];
  const paid = bill.status === 'lunas';

  return (
    <LinearGradient
      // Sudut 150° web didekati dengan start/end diagonal; RN tak menerima sudut derajat.
      colors={['#3c4715', colors[mode].olive]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.6, y: 1 }}
      className="rounded-xl3 p-5 shadow-pop"
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-[11px] font-semibold uppercase tracking-wide text-white/80">
          Tagihan {bill.period}
        </Text>
        <Badge label={badge.label} tone={badge.tone} />
      </View>
      <Text className="mt-2 text-[30px] font-extrabold leading-none text-white">
        {formatRupiah(bill.amount + bill.penalty)}
      </Text>
      <Text className="mt-1.5 text-[12px] text-white/75">
        Jatuh tempo {bill.dueDate}
        {bill.penalty > 0 ? ` · termasuk denda ${formatRupiah(bill.penalty)}` : ''}
      </Text>
      {paid ? (
        <View className="mt-4 flex-row items-center gap-2">
          <Icon name="check" size={18} color={colors[mode].lime} />
          <Text className="text-[13px] font-semibold text-lime">Lunas · dibayar {bill.paidAt}</Text>
        </View>
      ) : (
        <Button
          label="Bayar Sekarang"
          variant="secondary"
          full
          className="mt-4"
          icon={<Icon name="wallet" size={20} color={colors[mode].olive} />}
          onPress={onPay}
        />
      )}
    </LinearGradient>
  );
}

/** Baris label–nilai untuk kartu ringkasan. */
function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-[12.5px] text-dim">{label}</Text>
      <Text className="text-[13px] font-bold text-ink">{value}</Text>
    </View>
  );
}
