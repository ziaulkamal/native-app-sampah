import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';
import { ScreenScaffold } from '@/components/layout/ScreenScaffold';
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
import { colors, semantic } from '@/tokens/tokens';
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
      <View>
        <Text className="text-[9.5px] font-semibold uppercase tracking-wider text-olive">
          Retribusi
        </Text>
        <Text className="text-[20px] font-extrabold text-ink">Tagihan Saya</Text>
      </View>

      {locations.length > 1 && active !== undefined && (
        <LocationSwitcher locations={locations} activeId={active.id} onSelect={select} />
      )}

      {outstanding > 0 ? (
        <LinearGradient
          colors={['#3c4715', colors[mode].olive]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.6, y: 1 }}
          className="rounded-xl3 p-5 shadow-pop"
        >
          <Text className="text-[11px] uppercase tracking-wide text-white/80">
            Total belum dibayar
          </Text>
          <Text className="mt-1 text-[28px] font-extrabold leading-none text-white">
            {formatRupiah(outstanding)}
          </Text>
          <Text className="mt-1.5 text-[12px] text-white/75">
            {unpaid.length} tagihan menunggu pembayaran
          </Text>
        </LinearGradient>
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

/** Baris tagihan; tombol Bayar untuk yang belum lunas. */
function BillRow({ bill, onPay, blocked }: { bill: Bill; onPay?: () => void; blocked?: boolean }) {
  const badge = BILL_BADGE[bill.status];
  const paid = bill.status === 'lunas';

  return (
    <View className="rounded-xl2 bg-surface p-3.5 shadow-card">
      <View className="flex-row items-center gap-3">
        <View className="flex-1">
          <Text className="text-[14px] font-bold text-ink">Retribusi {bill.period}</Text>
          <Text className="mt-0.5 text-[11.5px] text-dim">
            {paid ? `Lunas · ${bill.paidAt}` : `Jatuh tempo ${bill.dueDate}`}
          </Text>
          {bill.penalty > 0 && (
            <Text className="mt-0.5 text-[11.5px] font-semibold text-danger">
              Termasuk denda {formatRupiah(bill.penalty)}
            </Text>
          )}
        </View>
        <Badge label={badge.label} tone={badge.tone} />
      </View>
      <View className="mt-3 flex-row items-center justify-between">
        <Text className="text-[15px] font-extrabold text-ink">
          {formatRupiah(bill.amount + bill.penalty)}
        </Text>
        {paid ? (
          <View className="flex-row items-center gap-1.5">
            <Icon name="check" size={17} color={semantic.success} />
            <Text className="text-[12.5px] font-semibold text-success">Lunas</Text>
          </View>
        ) : (
          <Button
            label="Bayar"
            size="sm"
            onPress={onPay}
            disabled={blocked}
            icon={<Icon name="wallet" size={16} color="#fff" />}
            accessibilityHint={blocked ? 'Lunasi tagihan terlama lebih dulu' : undefined}
          />
        )}
      </View>
    </View>
  );
}
