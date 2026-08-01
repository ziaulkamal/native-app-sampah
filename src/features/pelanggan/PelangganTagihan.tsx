import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState, type ReactNode } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Text, View } from 'react-native';
import { ScreenScaffold } from '@/components/layout/ScreenScaffold';
import { ScreenTitle } from '@/components/layout/ScreenTitle';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { Pagination } from '@/components/ui/Pagination';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { formatRupiah } from '@/lib/format';
import { BILL_BADGE } from '@/lib/labels';
import { usePagination } from '@/lib/pagination';
import type { PelangganTagihanParams } from '@/navigation/types';
import { useTheme } from '@/theme/ThemeProvider';
import { colors, semantic, typography } from '@/tokens/tokens';
import type { Bill } from '@/types';
import { LocationSwitcher } from './LocationSwitcher';
import { PaymentSheet } from './PaymentSheet';
import { useActiveLocation } from './useActiveLocation';

type Props = NativeStackScreenProps<PelangganTagihanParams, 'PelangganTagihan'>;

/** Tagihan retribusi milik pelanggan: daftar + entry point bayar. */
export function PelangganTagihan({ route, navigation }: Props) {
  const { active, locations, billsForActive, select } = useActiveLocation();
  const [payTarget, setPayTarget] = useState<Bill | null>(null);
  const { mode } = useTheme();
  const pay = route.params?.pay === true;

  // Tagihan menempel ke TITIK LAYANAN, jadi disaring ke titik yang sedang dipilih.
  // Belum lunas diurutkan dari yang TERLAMA: itu urutan pelunasan yang ditegakkan server.
  const unpaid = billsForActive
    .filter((b) => b.status !== 'lunas')
    .sort((a, b) => a.periodStart.localeCompare(b.periodStart));
  const paid = billsForActive.filter((b) => b.status === 'lunas');
  const outstanding = unpaid.reduce((a, b) => a + b.amount + b.penalty, 0);
  // Hanya riwayatnya yang berhalaman. Daftar "belum dibayar" sengaja utuh: memotongnya
  // menyembunyikan berapa bulan yang sebenarnya tertunggak.
  const { items: shownPaid, bind } = usePagination(paid, active?.id ?? null);

  // Datang dari tombol Bayar (menu beranda / nav bawah): sheet dibuka sendiri di tagihan
  // terlama. Paramnya langsung dicabut supaya kembali ke tab ini tak membukanya lagi.
  const first = unpaid[0];
  useEffect(() => {
    if (!pay) return;
    navigation.setParams({ pay: undefined });
    if (first !== undefined) setPayTarget(first);
  }, [pay, first, navigation]);

  return (
    <ScreenScaffold>
      <ScreenTitle eyebrow="Retribusi" title="Tagihan Saya" />

      {locations.length > 1 && active !== undefined && (
        <LocationSwitcher locations={locations} activeId={active.id} onSelect={select} />
      )}

      {outstanding > 0 ? (
        <OutstandingPanel dark={mode === 'dark'}>
          <Text
            maxFontSizeMultiplier={typography.maxScale}
            className={`text-[11px] uppercase tracking-wide ${mode === 'dark' ? 'text-dim' : 'text-white/80'}`}
          >
            Total belum dibayar
          </Text>
          {/* Menyusut, bukan ter-ellipsis: digit rupiah yang terpotong salah baca. */}
          <Text
            maxFontSizeMultiplier={typography.maxScale}
            className={`mt-1 text-[28px] font-extrabold leading-none ${mode === 'dark' ? 'text-ink' : 'text-white'}`}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            {formatRupiah(outstanding)}
          </Text>
          <Text className={`mt-1.5 text-[12px] ${mode === 'dark' ? 'text-dim' : 'text-white/75'}`}>
            {unpaid.length} tagihan menunggu pembayaran
          </Text>
        </OutstandingPanel>
      ) : (
        <View className="flex-row items-center gap-3 rounded-xl3 bg-surface p-5 shadow-card">
          <View className="h-11 w-11 items-center justify-center rounded-full bg-success/10">
            <Icon name="check" size={24} color={semantic.success} />
          </View>
          <Text className="text-[14px] font-bold text-ink">Semua tagihan lunas 🎉</Text>
        </View>
      )}

      {unpaid.length > 0 && (
        <>
          <SectionHeader title="Belum dibayar" />
          <View className="gap-2.5">
            {unpaid.map((b, i) => (
              // Hanya tagihan terlama yang bisa dibayar — server menolak yang melompat.
              <BillRow
                key={b.id}
                bill={b}
                onPay={i === 0 ? () => setPayTarget(b) : undefined}
                blocked={i > 0}
              />
            ))}
            {/* Aturannya ditulis sekali di kaki daftar, bukan diulang di tiap kartu
                terkunci: yang perlu dijelaskan urutannya, bukan tiap tombolnya. */}
            <Text className="mt-0.5 px-0.5 text-[11.5px] leading-relaxed text-dim">
              Pelunasan berurutan: tagihan terlama dulu, yang lebih baru terkunci sampai lunas.
            </Text>
          </View>
        </>
      )}

      <SectionHeader title="Riwayat tagihan" />
      {paid.length > 0 ? (
        <View className="gap-3">
          {shownPaid.map((b) => (
            <BillRow key={b.id} bill={b} />
          ))}
          <Pagination
            {...bind}
            unit="tagihan lunas"
            className="rounded-xl2 bg-surface shadow-card"
          />
        </View>
      ) : (
        <EmptyState
          icon="receipt"
          title="Belum ada riwayat"
          message="Tagihan yang sudah dibayar akan tampil di sini."
        />
      )}

      {payTarget && <PaymentSheet bill={payTarget} onClose={() => setPayTarget(null)} />}
    </ScreenScaffold>
  );
}

/**
 * Cangkang panel tunggakan. Di terang bergradien olive; di gelap tidak.
 *
 * Alasannya sama dengan kepala beranda (`HeroScaffold`) dan panel kas Setor: olive
 * #5A6A1E gagal 3:1 di atas latar gelap, jadi di sana kontrasnya datang dari permukaan
 * sedikit lebih terang + garis tepi, bukan dari gradien yang meredupkan teks di atasnya.
 */
function OutstandingPanel({ dark, children }: { dark: boolean; children: ReactNode }) {
  // Bulatan hias di sudut, dipotong jadi busur oleh `overflow-hidden` induknya — penanda
  // yang sama dengan kartu tagihan di beranda, supaya dua layar itu terbaca sekeluarga.
  const orb = (
    <View className="absolute -right-10 -top-[46px] h-[150px] w-[150px] rounded-full bg-lime/10" />
  );

  if (dark) {
    return (
      <View className="overflow-hidden rounded-xl3 border border-line bg-surface2 p-5 shadow-pop">
        {orb}
        {children}
      </View>
    );
  }

  return (
    <LinearGradient
      // `colors.light` eksplisit: cabang ini memang hanya jalan di mode terang.
      colors={[colors.light['olive-deep'], colors.light.olive]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.6, y: 1 }}
      className="overflow-hidden rounded-xl3 p-5 shadow-pop"
    >
      {orb}
      {children}
    </LinearGradient>
  );
}

/** Baris tagihan; tombol Bayar untuk yang belum lunas. */
function BillRow({ bill, onPay, blocked }: { bill: Bill; onPay?: () => void; blocked?: boolean }) {
  const badge = BILL_BADGE[bill.status];
  const total = formatRupiah(bill.amount + bill.penalty);
  const { mode } = useTheme();

  // Yang lunas cukup satu baris: statusnya sudah diucapkan badge bercentang di samping
  // nominal, jadi tak perlu baris aksi kedua yang mengulanginya.
  if (bill.status === 'lunas') {
    return (
      <View className="flex-row items-center gap-3 rounded-xl2 bg-surface p-4 shadow-card">
        {/* Ubin centang di kiri: yang membedakan baris lunas dari baris tertunggak harus
            terbaca sebelum mata sampai ke nominal di ujung kanan. */}
        <View className="h-[42px] w-[42px] flex-none items-center justify-center rounded-[14px] bg-success/10">
          <Icon name="check" size={19} color={semantic.success} />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-[14px] font-bold text-ink">Retribusi {bill.period}</Text>
          <Text className="mt-1.5 text-[11.5px] text-dim">Lunas · {bill.paidAt}</Text>
        </View>
        <View className="flex-none items-end gap-2">
          <Text className="text-[14.5px] font-extrabold text-ink">{total}</Text>
          <View className="rounded-full bg-success/10 px-2.5 py-1.5">
            <Text className="font-sans text-[9.5px] font-bold uppercase tracking-wide text-success">
              Lunas
            </Text>
          </View>
        </View>
      </View>
    );
  }

  const locked = blocked === true;
  const dark = mode === 'dark';
  // Olive gelap (#A6B84B) terlalu terang untuk teks putih — di gelap tombol utama dibalik
  // jadi lime berisi teks gelap, pola yang sama dengan `Button` dan FAB bilah bawah.
  const payFg = locked ? colors[mode]['text-dim'] : dark ? colors.light.text : '#fff';

  return (
    <View className="rounded-xl2 bg-surface p-4 shadow-card">
      <View className="flex-row items-start gap-3">
        <View className="min-w-0 flex-1">
          <Text className="text-[14px] font-bold text-ink">Retribusi {bill.period}</Text>
          <Text className="mt-1.5 text-[11.5px] text-dim">Jatuh tempo {bill.dueDate}</Text>
          {/* Denda naik ke blok keterangan: di bawah nominal ia terbaca sebagai potongan
              dari angka di atasnya, padahal ia justru sudah termasuk di dalamnya. */}
          {bill.penalty > 0 && (
            <Text className="mt-1.5 text-[11.5px] font-semibold text-danger">
              Termasuk denda {formatRupiah(bill.penalty)}
            </Text>
          )}
        </View>
        <Badge label={badge.label} tone={badge.tone} />
      </View>
      <View className="mt-3.5 flex-row items-center justify-between gap-3">
        <Text className="text-[16px] font-extrabold text-ink">{total}</Text>
        {/* Yang terkunci tetap bertombol, hanya pudar dan bernama "Terkunci": kartu tanpa
            tombol terbaca sebagai kartu yang memang tak punya aksi, bukan yang belum
            gilirannya. Alasannya ditulis sekali di kaki daftar. */}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: locked }}
          accessibilityHint={
            locked ? 'Lunasi tagihan terlama lebih dulu untuk membuka tagihan ini' : undefined
          }
          disabled={locked}
          onPress={onPay}
          className={`min-h-[44px] flex-none flex-row items-center gap-[7px] rounded-full px-[18px] ${
            locked ? 'bg-pill opacity-[.45]' : dark ? 'bg-lime' : 'bg-olive'
          }`}
          style={({ pressed }) => (pressed ? { opacity: 0.85 } : undefined)}
        >
          <Icon name="wallet" size={15} color={payFg} />
          <Text className="font-sans text-[12.5px] font-bold" style={{ color: payFg }}>
            {locked ? 'Terkunci' : 'Bayar'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
