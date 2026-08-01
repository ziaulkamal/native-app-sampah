import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenScaffold } from '@/components/layout/ScreenScaffold';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { NotificationBell } from '@/features/notifikasi/NotificationBell';
import { HomeMenu, type HomeMenuItem } from '@/features/shared/HomeMenu';
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
import { colors, semantic, shadows, typography } from '@/tokens/tokens';
import type { Bill } from '@/types';
import { LocationSwitcher } from './LocationSwitcher';
import { useActiveLocation } from './useActiveLocation';

type Nav = NavigationProp<PelangganTabParams>;

/**
 * Beranda Pelanggan: satu tagihan yang harus dibayar sekarang, pintu-pintu layanan,
 * dan ringkasan langganan.
 *
 * Datar, tanpa kepala bermerek: yang paling penting di layar ini adalah kartu tagihan,
 * dan kepala olive selebar layar di atasnya membuat dua blok berwarna beradu — kartunya
 * kalah dan tombol bayarnya terdorong ke bawah lipatan.
 */
export function PelangganHome() {
  const { zones, tariffs, dataState, session } = useApp();
  const { active: customer, locations, billsForActive, select } = useActiveLocation();
  const nav = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  if (customer === undefined) return <NoProfile loading={dataState === 'loading'} />;

  const zone = zones.find((z) => z.id === customer.zoneId);
  const golongan = tariffs.find((t) => t.id === customer.category);
  const status = CUSTOMER_STATUS[customer.status];
  // Belum lunas diurutkan dari yang TERLAMA: itu urutan pelunasan yang ditegakkan server,
  // jadi yang pertama di daftar inilah satu-satunya yang bisa dibayar sekarang.
  const unpaid = billsForActive
    .filter((b) => b.status !== 'lunas')
    .sort((a, b) => a.periodStart.localeCompare(b.periodStart));
  const due = unpaid[0];

  const menu: HomeMenuItem[] = [
    {
      label: 'Bayar',
      icon: 'wallet',
      onPress: () => nav.navigate('Tagihan', { screen: 'PelangganTagihan', params: { pay: true } }),
    },
    {
      label: 'Riwayat',
      icon: 'bars',
      onPress: () => nav.navigate('Tagihan', { screen: 'PelangganRiwayat' }),
    },
    {
      label: 'Jadwal',
      icon: 'calendar',
      onPress: () => nav.navigate('Jadwal', { screen: 'PelangganJadwal' }),
    },
    {
      label: 'Aduan',
      icon: 'bell',
      onPress: () => nav.navigate('Beranda', { screen: 'PelangganAduan' }),
    },
  ];

  return (
    <ScreenScaffold>
      {/* Tab Beranda berjalan `headerShown: false` — tak ada header bawaan yang memikul
          inset, jadi baris identitas ini memikulnya sendiri. */}
      <View className="flex-row items-center gap-3" style={{ paddingTop: insets.top + 6 }}>
        <Avatar name={customer.name} src={session?.avatarUrl ?? undefined} size={46} />
        <View className="min-w-0 flex-1">
          <Text
            maxFontSizeMultiplier={typography.maxScale}
            className="font-sans text-[10.5px] font-semibold uppercase tracking-widest text-olive"
            numberOfLines={1}
          >
            {zone?.name ?? 'Belum berzona'}
          </Text>
          <Text className="mt-1.5 text-[19px] font-extrabold text-ink" numberOfLines={1}>
            {customer.name}
          </Text>
        </View>
        <NotificationBell place="screen" />
      </View>

      {/* Ganti titik langsung di berandanya, bukan lewat sheet: seluruh angka di layar ini
          milik satu titik, jadi tombol pindahnya harus terlihat bersama angkanya. */}
      <LocationSwitcher locations={locations} activeId={customer.id} onSelect={select} />

      <Pressable
        accessibilityRole="button"
        onPress={() => nav.navigate('Beranda', { screen: 'TambahLokasi' })}
        // Bergaris putus-putus, bukan kartu berisi: ini pintu menambah sesuatu yang belum
        // ada, bukan baris data — bentuknya harus beda dari kapsul titik di atasnya.
        className="min-h-[44px] flex-row items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-dashed border-ph"
        style={({ pressed }) => (pressed ? { opacity: 0.6 } : undefined)}
      >
        <PlusIcon />
        <Text className="text-[12.5px] font-semibold text-olive">Ajukan titik layanan baru</Text>
      </Pressable>

      {due === undefined ? <AllPaidCard /> : <DueCard bill={due} others={unpaid.length - 1} />}

      <HomeMenu items={menu} />

      <View className="gap-3">
        <Text className="text-[15px] font-bold text-ink">Langganan</Text>
        <View className="gap-3.5 rounded-xl2 bg-surface p-[18px]" style={shadows.card}>
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
      </View>
    </ScreenScaffold>
  );
}

/**
 * Kartu tagihan yang jatuh tempo — satu-satunya blok berwarna di layar ini.
 *
 * Yang ditampilkan tagihan TERLAMA saja, bukan jumlah seluruh tunggakan: itu angka yang
 * akan benar-benar dibayar kalau tombolnya ditekan, dan server menolak pelunasan yang
 * melompatinya. Sisanya disebut sebagai jumlah, bukan sebagai rupiah, supaya tak ada dua
 * nominal bersaing di satu kartu.
 */
function DueCard({ bill, others }: { bill: Bill; others: number }) {
  const nav = useNavigation<Nav>();
  const { mode } = useTheme();
  const badge = BILL_BADGE[bill.status];
  const dark = mode === 'dark';

  const body = (
    <>
      {/* Bulatan hias di sudut. `overflow-hidden` induknya yang memotongnya jadi busur. */}
      <View className="absolute -right-10 -top-[46px] h-[150px] w-[150px] rounded-full bg-lime/10" />
      <View className="flex-row items-center justify-between gap-2.5">
        <Text
          maxFontSizeMultiplier={typography.maxScale}
          className={`flex-1 font-sans text-[11px] font-semibold uppercase tracking-wide ${
            dark ? 'text-dim' : 'text-white/80'
          }`}
          numberOfLines={1}
        >
          Tagihan {bill.period}
        </Text>
        {/* Bukan `Badge` bertona: di atas olive, latar hijau/kuning transparannya lenyap.
            Di sini statusnya dibaca dari teks, kontrasnya dari kaca putih. */}
        <View className={`rounded-full px-2.5 py-1.5 ${dark ? 'bg-pill' : 'bg-white/20'}`}>
          <Text
            maxFontSizeMultiplier={typography.maxScale}
            className={`font-sans text-[9.5px] font-bold uppercase tracking-wide ${
              dark ? 'text-ink' : 'text-white'
            }`}
          >
            {badge.label}
          </Text>
        </View>
      </View>

      {/* Menyusut, bukan ter-ellipsis: digit rupiah yang terpotong salah baca. */}
      <Text
        maxFontSizeMultiplier={typography.maxScale}
        className={`mt-2.5 text-[30px] font-extrabold leading-none ${dark ? 'text-ink' : 'text-white'}`}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
      >
        {formatRupiah(bill.amount + bill.penalty)}
      </Text>
      <Text className={`mt-1.5 text-[12px] leading-snug ${dark ? 'text-dim' : 'text-white/75'}`}>
        Jatuh tempo {bill.dueDate}
        {bill.penalty > 0 && ` · termasuk denda ${formatRupiah(bill.penalty)}`}
        {others > 0 && `\n${others} tagihan lain menyusul setelah ini lunas`}
      </Text>

      {/* Tombolnya putih di atas olive, bukan olive di atas olive: satu-satunya aksi
          utama layar ini harus jadi bidang paling terang di kartunya. */}
      <Pressable
        accessibilityRole="button"
        onPress={() =>
          nav.navigate('Tagihan', { screen: 'PelangganTagihan', params: { pay: true } })
        }
        className={`mt-[18px] min-h-[52px] flex-row items-center justify-center gap-2.5 rounded-full ${
          dark ? 'bg-lime' : 'bg-surface'
        }`}
        style={({ pressed }) => (pressed ? { opacity: 0.85 } : undefined)}
      >
        <Icon name="wallet" size={18} color={dark ? colors.light.text : colors.light.olive} />
        <Text
          className="font-sans text-[14px] font-bold"
          style={{ color: dark ? colors.light.text : colors.light.olive }}
        >
          Bayar Sekarang
        </Text>
      </Pressable>
    </>
  );

  // Di gelap kartunya tidak bergradien terang: olive #5A6A1E gagal 3:1 di atas latar
  // gelap, jadi kontrasnya datang dari permukaan sedikit lebih terang + garis tepi.
  if (dark) {
    return (
      <View className="overflow-hidden rounded-xl3 border border-line bg-surface2 p-5">{body}</View>
    );
  }

  return (
    <LinearGradient
      colors={[colors.light['olive-deep'], colors.light.olive]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.55, y: 1 }}
      className="overflow-hidden rounded-xl3 p-5"
      style={shadows.pop}
    >
      {body}
    </LinearGradient>
  );
}

/** Ganti kartu tagihan saat tak ada yang tertunggak — bukan ruang kosong. */
function AllPaidCard() {
  return (
    <View className="flex-row items-center gap-3.5 rounded-xl3 bg-surface p-5" style={shadows.card}>
      <View className="h-[46px] w-[46px] flex-none items-center justify-center rounded-full bg-success/10">
        <Icon name="check" size={24} color={semantic.success} />
      </View>
      <View className="flex-1">
        <Text className="text-[15px] font-bold text-ink">Semua tagihan lunas</Text>
        <Text className="mt-1.5 text-[12px] text-dim">
          Tagihan berikutnya terbit di awal periode.
        </Text>
      </View>
    </View>
  );
}

/** Tanda tambah pada tombol titik baru; olive mengikuti tema. */
function PlusIcon() {
  const { mode } = useTheme();
  return <Icon name="plus" size={16} color={colors[mode].olive} />;
}

/**
 * Pendaftar yang belum diverifikasi belum punya titik layanan — jelaskan, jangan kosongkan.
 *
 * Insetnya dipikul sendiri dengan alasan yang sama seperti baris identitas di atas:
 * tab Beranda berjalan tanpa header bawaan.
 */
function NoProfile({ loading }: { loading: boolean }) {
  const insets = useSafeAreaInsets();

  return (
    <ScreenScaffold>
      <View className="mt-6" style={{ paddingTop: insets.top }}>
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

/** Baris label–nilai untuk kartu langganan. */
function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <Text className="text-[12.5px] text-dim">{label}</Text>
      {/* `flex-1` + rata kanan: tarif panjang mendesak labelnya, bukan meluber ke luar kartu. */}
      <Text className="flex-1 text-right text-[13px] font-bold text-ink" numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}
