import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { ScreenScaffold } from '@/components/layout/ScreenScaffold';
import { SubScreenHeader } from '@/components/layout/SubScreenHeader';
import { Badge } from '@/components/ui/Badge';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Pagination } from '@/components/ui/Pagination';
import { formatRupiah, formatRupiahShort } from '@/lib/format';
import { PAY_METHOD, TX_STATUS } from '@/lib/labels';
import { usePagination } from '@/lib/pagination';
import { useApp } from '@/store/AppContext';
import { semantic } from '@/tokens/tokens';
import type { Transaction, TxStatus } from '@/types';

type Filter = 'semua' | TxStatus;

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'semua', label: 'Semua' },
  { id: 'selesai', label: 'Selesai' },
  { id: 'menunggu', label: 'Menunggu' },
  { id: 'tertunggak', label: 'Tertunggak' },
];

const ICON: Record<TxStatus, IconName> = {
  selesai: 'check',
  menunggu: 'calendar',
  tertunggak: 'bell',
};

// Web mewarnai ikon lewat class `text-*`; RN tak mewarisi warna, jadi hex-nya langsung.
const TINT: Record<TxStatus, string> = {
  selesai: semantic.success,
  menunggu: semantic.warning,
  tertunggak: semantic.danger,
};

/** Riwayat transaksi milik pelanggan yang login. */
export function PelangganRiwayat() {
  const { transactions } = useApp();
  const [filter, setFilter] = useState<Filter>('semua');
  // `/my/payments` sudah dibatasi server ke pelanggan yang masuk.
  const txs = transactions;
  const sum = (s: TxStatus) => txs.filter((t) => t.status === s).reduce((a, t) => a + t.amount, 0);
  const matching = filter === 'semua' ? txs : txs.filter((t) => t.status === filter);
  // Riwayat pelanggan lama bisa puluhan bulan; sepuluh kartu sekali tampil menjaga
  // layar ponsel tetap bisa digulir sampai bawah.
  const { items: shown, bind } = usePagination(matching, filter);

  return (
    <ScreenScaffold>
      <SubScreenHeader title="Riwayat Transaksi" />

      <View className="flex-row gap-2.5">
        <Summary label="Dibayar" value={formatRupiahShort(sum('selesai'))} tone="text-success" />
        <Summary label="Menunggu" value={formatRupiahShort(sum('menunggu'))} tone="text-warning" />
        <Summary
          label="Tertunggak"
          value={formatRupiahShort(sum('tertunggak'))}
          tone="text-danger"
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 pr-4"
      >
        {FILTERS.map((f) => (
          <Chip
            key={f.id}
            label={f.label}
            active={filter === f.id}
            onPress={() => setFilter(f.id)}
          />
        ))}
      </ScrollView>

      <View className="gap-3">
        {shown.map((t) => (
          <TxCard key={t.id} tx={t} />
        ))}
        {shown.length === 0 && (
          <EmptyState
            icon="receipt"
            title="Belum ada transaksi"
            message="Transaksi pada filter ini belum tersedia."
          />
        )}
        <Pagination {...bind} unit="transaksi" className="rounded-xl2 bg-surface shadow-card" />
      </View>
    </ScreenScaffold>
  );
}

function Summary({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <View className="flex-1 rounded-xl2 bg-surface p-3 shadow-card">
      <Text className={`text-[15px] font-extrabold ${tone}`}>{value}</Text>
      <Text className="mt-0.5 text-[10.5px] text-dim">{label}</Text>
    </View>
  );
}

function TxCard({ tx }: { tx: Transaction }) {
  const st = TX_STATUS[tx.status];
  const secondary =
    tx.status === 'selesai'
      ? `${tx.method ? PAY_METHOD[tx.method] : ''}${tx.ref ? ` · ${tx.ref}` : ''} · ${tx.date}`
      : `Jatuh tempo ${tx.date}`;

  return (
    <View className="flex-row items-center gap-3 rounded-xl2 bg-surface p-3.5 shadow-card">
      <View className="h-[42px] w-[42px] items-center justify-center rounded-[12px] bg-pill">
        <Icon name={ICON[tx.status]} size={20} color={TINT[tx.status]} />
      </View>
      <View className="flex-1">
        <Text className="text-[14px] font-bold text-ink">Retribusi {tx.period}</Text>
        <Text className="mt-0.5 text-[11px] text-dim" numberOfLines={1}>
          {secondary}
        </Text>
      </View>
      <View className="items-end">
        <Text className="text-[14.5px] font-extrabold text-ink">{formatRupiah(tx.amount)}</Text>
        <View className="mt-1">
          <Badge label={st.label} tone={st.tone} />
        </View>
      </View>
    </View>
  );
}
