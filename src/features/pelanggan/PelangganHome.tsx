import { useState } from 'react';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { Pressable, Text, View } from 'react-native';
import {
  greetingNow,
  HeroAmount,
  HeroGreeting,
  HeroPill,
  HeroScaffold,
} from '@/components/layout/HeroScaffold';
import { ScreenScaffold } from '@/components/layout/ScreenScaffold';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { Modal } from '@/components/ui/Modal';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { NotificationBell } from '@/features/notifikasi/NotificationBell';
import { HomeMenu, type HomeMenuItem } from '@/features/shared/HomeMenu';
import { weekDates } from '@/lib/dates';
import { formatRupiah } from '@/lib/format';
import {
  CUSTOMER_STATUS,
  golonganName,
  LOCATION_KIND,
  SCHEME_LABEL,
  SCHEME_SUFFIX,
  WEEKDAYS,
} from '@/lib/labels';
import type { PelangganTabParams } from '@/navigation/types';
import { useApp } from '@/store/AppContext';
import { useTheme } from '@/theme/ThemeProvider';
import { colors, shadows } from '@/tokens/tokens';
import type { Bill, Customer, Weekday } from '@/types';
import { useActiveLocation } from './useActiveLocation';

type Nav = NavigationProp<PelangganTabParams>;

/** Beranda Pelanggan: nominal tertunggak, pintu-pintu layanan, jadwal, ringkasan setahun. */
export function PelangganHome() {
  const { zones, tariffs, dataState, session } = useApp();
  const { active: customer, locations, billsForActive, select } = useActiveLocation();
  const nav = useNavigation<Nav>();
  const { mode } = useTheme();
  const [switching, setSwitching] = useState(false);

  if (customer === undefined) return <NoProfile loading={dataState === 'loading'} />;

  const zone = zones.find((z) => z.id === customer.zoneId);
  const golongan = tariffs.find((t) => t.id === customer.category);
  const status = CUSTOMER_STATUS[customer.status];
  const unpaid = billsForActive.filter((b) => b.status !== 'lunas');
  const outstanding = unpaid.reduce((sum, b) => sum + b.amount + b.penalty, 0);
  const paidThisYear = sumPaidThisYear(billsForActive);

  // Hanya pintu yang tak ada di bilah bawah. Bayar, Tagihan, Jadwal, dan Profil sudah
  // jadi tab — mengulangnya di sini hanya memperbanyak yang harus dipindai.
  const menu: HomeMenuItem[] = [
    {
      label: 'Riwayat',
      icon: 'bars',
      onPress: () => nav.navigate('Tagihan', { screen: 'PelangganRiwayat' }),
    },
    {
      label: 'Aduan',
      icon: 'bell',
      onPress: () => nav.navigate('Beranda', { screen: 'PelangganAduan' }),
    },
    {
      label: 'Titik',
      icon: 'pin',
      onPress: () => nav.navigate('Beranda', { screen: 'TambahLokasi' }),
    },
    { label: 'Akun', icon: 'settings', onPress: () => nav.navigate('Profil', { screen: 'Akun' }) },
  ];

  return (
    <HeroScaffold
      hero={
        <>
          <HeroGreeting
            avatar={<Avatar name={customer.name} src={session?.avatarUrl ?? undefined} size={44} />}
            greeting={greetingNow()}
            name={customer.name}
            right={<NotificationBell onHero />}
          />
          <HeroAmount
            label={outstanding > 0 ? 'Total belum dibayar' : 'Tak ada tunggakan'}
            amount={formatRupiah(outstanding).replace('Rp', '').trim()}
          />
          {/* Kapsulnya sekaligus pintu ganti titik — chevron baru muncul kalau memang
              ada titik lain untuk dipilih. */}
          <HeroPill
            icon="pin"
            label={`Titik: ${customer.name} · ${zone?.name ?? 'Belum berzona'}`}
            onPress={locations.length > 1 ? () => setSwitching(true) : undefined}
          />
        </>
      }
    >
      <HomeMenu items={menu} />

      <WeekStrip days={zone?.schedule.days ?? []} />

      <View className="flex-row rounded-xl2 bg-surface p-4" style={shadows.card}>
        <SplitHalf
          label={`Dibayar ${new Date().getFullYear()}`}
          value={formatRupiah(paidThisYear)}
        />
        <View className="w-px bg-line" />
        <SplitHalf
          label="Tunggakan"
          value={formatRupiah(outstanding)}
          danger={outstanding > 0}
          note={unpaid.length > 0 ? `${unpaid.length} tagihan` : 'Lunas semua'}
        />
      </View>

      <SectionHeader title="Langganan" />
      <View className="gap-3 rounded-xl2 bg-surface p-4" style={shadows.card}>
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

      {/* Berlatar supaya terbaca sebagai aturan resmi, bukan keterangan yang tercecer. */}
      <View className="mb-2 flex-row items-start gap-2.5 rounded-xl bg-surface2 px-3.5 py-3">
        <Icon name="info" size={15} color={colors[mode].olive} />
        <Text className="flex-1 text-[11.5px] leading-relaxed text-dim">
          Tagihan dilunasi berurutan dari yang terlama — itu aturan yang ditegakkan server.
        </Text>
      </View>

      <Modal open={switching} onClose={() => setSwitching(false)} title="Ganti titik layanan">
        {locations.map((loc) => (
          <LocationRow
            key={loc.id}
            location={loc}
            active={loc.id === customer.id}
            onPress={() => {
              select(loc.id);
              setSwitching(false);
            }}
          />
        ))}
      </Modal>
    </HeroScaffold>
  );
}

/** Satu titik layanan di sheet pemilih; yang aktif ditandai centang, bukan hanya warna. */
function LocationRow({
  location,
  active,
  onPress,
}: {
  location: Customer;
  active: boolean;
  onPress: () => void;
}) {
  const { mode } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      className={`flex-row items-center gap-3 rounded-xl2 border px-4 py-3 ${
        active ? 'border-olive bg-pill' : 'border-line bg-surface'
      }`}
      style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
    >
      <Icon name="pin" size={18} color={colors[mode][active ? 'olive' : 'text-dim']} />
      <View className="flex-1">
        <Text className="text-[13px] font-bold text-ink" numberOfLines={1}>
          {location.label}
        </Text>
        <Text className="mt-0.5 text-[11px] text-dim">{LOCATION_KIND[location.kind]}</Text>
      </View>
      {active && <Icon name="check" size={18} color={colors[mode].olive} />}
    </Pressable>
  );
}

/** Empat hari terdekat pekan ini; hari angkut diberi warna, hari ini diberi ring lime. */
function WeekStrip({ days }: { days: Weekday[] }) {
  const { mode } = useTheme();
  const week = weekDates();
  // Selalu empat ubin: kalau hari ini sudah Jumat, yang ditampilkan empat hari terakhir
  // pekan — menggeser jendela lebih berguna daripada memotongnya jadi satu ubin.
  const start = Math.min(
    Math.max(
      week.findIndex((d) => d.isToday),
      0,
    ),
    week.length - 4,
  );

  return (
    <View>
      <Text className="mb-2.5 px-1 text-[14px] font-extrabold text-ink">Angkut pekan ini</Text>
      <View className="flex-row gap-2.5">
        {week.slice(start, start + 4).map((day, i) => {
          const index = start + i;
          const angkut = days.includes(WEEKDAYS[index].id);
          // Empat ubin yang identik tak menyebut hari ini yang mana; ring lime menyebutnya
          // tanpa menambah baris teks.
          const ring = day.isToday ? { borderWidth: 2, borderColor: colors[mode].lime } : undefined;
          const accent =
            day.isToday && angkut ? 'text-lime' : angkut ? 'text-white/75' : 'text-dim';
          return (
            <View
              key={day.iso}
              className={`flex-1 items-center rounded-[14px] py-3 ${
                angkut ? 'bg-olive' : 'bg-surface'
              }`}
              style={[angkut ? undefined : shadows.card, ring]}
            >
              <Text className={`text-[10.5px] font-bold uppercase ${accent}`}>
                {WEEKDAYS[index].short}
              </Text>
              <Text
                className={`mt-1 text-[15px] font-extrabold ${angkut ? 'text-white' : 'text-ink'}`}
              >
                {day.label.split(' ')[0]}
              </Text>
              <Text className={`mt-0.5 text-[10.5px] font-semibold ${accent}`}>
                {angkut ? 'Angkut' : '—'}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

/** Separuh kartu ringkasan retribusi. */
function SplitHalf({
  label,
  value,
  note,
  danger,
}: {
  label: string;
  value: string;
  note?: string;
  danger?: boolean;
}) {
  return (
    <View className="flex-1 px-2">
      <Text className="text-[11px] font-semibold uppercase tracking-wide text-dim">{label}</Text>
      <Text
        className={`mt-1 text-[17px] font-extrabold ${danger === true ? 'text-danger' : 'text-ink'}`}
        numberOfLines={1}
      >
        {value}
      </Text>
      {note !== undefined && <Text className="mt-0.5 text-[11px] text-dim">{note}</Text>}
    </View>
  );
}

/** Total yang sudah dibayar sepanjang tahun berjalan, dari periode tagihannya. */
function sumPaidThisYear(bills: Bill[]): number {
  const year = String(new Date().getFullYear());
  return bills
    .filter((b) => b.status === 'lunas' && b.periodStart.startsWith(year))
    .reduce((sum, b) => sum + b.amount + b.penalty, 0);
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

/** Baris label–nilai untuk kartu ringkasan. */
function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-[12.5px] text-dim">{label}</Text>
      <Text className="text-[13px] font-bold text-ink">{value}</Text>
    </View>
  );
}
