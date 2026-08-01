import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState, type ReactNode } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';
import { ScreenScaffold } from '@/components/layout/ScreenScaffold';
import { ScreenTitle } from '@/components/layout/ScreenTitle';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
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
          <View className="gap-3">
            {unpaid.map((b, i) => (
              // Hanya tagihan terlama yang bisa dibayar — server menolak yang melompat.
              <BillRow
                key={b.id}
                bill={b}
                onPay={i === 0 ? () => setPayTarget(b) : undefined}
                blocked={i > 0}
              />
            ))}
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
  if (dark) {
    return (
      <View className="rounded-xl3 border border-line bg-surface2 p-5 shadow-pop">{children}</View>
    );
  }

  return (
    <LinearGradient
      // `colors.light` eksplisit: cabang ini memang hanya jalan di mode terang.
      colors={[colors.light['olive-deep'], colors.light.olive]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.6, y: 1 }}
      className="rounded-xl3 p-5 shadow-pop"
    >
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
      <View className="flex-row items-center gap-3 rounded-xl2 bg-surface p-3.5 shadow-card">
        <View className="flex-1">
          <Text className="text-[14px] font-bold text-ink">Retribusi {bill.period}</Text>
          <Text className="mt-0.5 text-[11.5px] text-dim">Lunas · {bill.paidAt}</Text>
        </View>
        <View className="items-end gap-1">
          <Text className="text-[15px] font-extrabold text-ink">{total}</Text>
          <View className="flex-row items-center gap-1 rounded-full bg-success/10 px-2.5 py-1">
            <Icon name="check" size={12} color={semantic.success} />
            <Text className="font-sans text-[10.5px] font-bold tracking-wide text-success">
              Lunas
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="rounded-xl2 bg-surface p-3.5 shadow-card">
      <View className="flex-row items-start gap-3">
        <View className="flex-1">
          <Text className="text-[14px] font-bold text-ink">Retribusi {bill.period}</Text>
          <Text className="mt-0.5 text-[11.5px] text-dim">Jatuh tempo {bill.dueDate}</Text>
        </View>
        <Badge label={badge.label} tone={badge.tone} />
      </View>
      <View className="mt-3 flex-row items-center justify-between gap-3">
        <View>
          <Text className="text-[17px] font-extrabold text-ink">{total}</Text>
          {/* Denda menempel pada nominal, bukan pada tanggal: ia bagian dari yang dibayar. */}
          {bill.penalty > 0 && (
            <Text className="mt-0.5 text-[11.5px] font-semibold text-danger">
              Termasuk denda {formatRupiah(bill.penalty)}
            </Text>
          )}
        </View>
        {blocked === true ? (
          // Tombol pudar terbaca "rusak" oleh orang awam; alasan terkuncinya ditulis saja.
          <View className="max-w-[58%] flex-row items-center gap-1.5">
            <Icon name="lock" size={14} color={colors[mode]['text-dim']} />
            <Text className="flex-1 text-[11.5px] text-dim">Lunasi tagihan terlama lebih dulu</Text>
          </View>
        ) : (
          <Button
            label="Bayar"
            size="sm"
            onPress={onPay}
            icon={<Icon name="wallet" size={16} color="#fff" />}
          />
        )}
      </View>
    </View>
  );
}
