import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { ScreenScaffold } from '@/components/layout/ScreenScaffold';
import { SubScreenHeader } from '@/components/layout/SubScreenHeader';
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

/** Latar ikon memakai tint status supaya baris bisa dipindai tanpa dibaca. */
const TINT_BG: Record<TxStatus, string> = {
  selesai: 'bg-success/10',
  menunggu: 'bg-warning/10',
  tertunggak: 'bg-danger/10',
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
      <SubScreenHeader eyebrow="Retribusi" title="Riwayat Transaksi" />

      <View className="flex-row gap-2.5">
        <Summary
          label="Dibayar"
          value={formatRupiahShort(sum('selesai'))}
          tint={semantic.success}
        />
        <Summary
          label="Menunggu"
          value={formatRupiahShort(sum('menunggu'))}
          tint={semantic.warning}
        />
        <Summary
          label="Tertunggak"
          value={formatRupiahShort(sum('tertunggak'))}
          tint={semantic.danger}
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

/**
 * Ubin ringkasan. Nominalnya berwarna status, dan itu aman dibaca siapa pun: label di
 * bawahnya mengucapkan status yang sama dengan kata, jadi warna hanya mempercepat
 * pemindaian — bukan satu-satunya yang membedakan ketiganya.
 */
function Summary({ label, value, tint }: { label: string; value: string; tint: string }) {
  return (
    <View className="flex-1 rounded-2xl bg-surface px-3 py-3.5 shadow-card">
      <Text
        className="font-sans text-[15px] font-extrabold"
        style={{ color: tint }}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
      >
        {value}
      </Text>
      <Text className="mt-1.5 text-[10.5px] text-dim">{label}</Text>
    </View>
  );
}

function TxCard({ tx }: { tx: Transaction }) {
  const st = TX_STATUS[tx.status];
  // Statusnya kini dipikul badge di kolom kanan, jadi baris keterangan tinggal
  // menyebutkan yang belum diucapkan siapa pun: cara bayar, referensi, dan tanggal.
  const secondary =
    tx.status === 'selesai'
      ? `${tx.method ? PAY_METHOD[tx.method] : ''}${tx.ref ? ` · ${tx.ref}` : ''} · ${tx.date}`
      : `Jatuh tempo ${tx.date}`;

  return (
    <View className="flex-row items-center gap-3 rounded-xl2 bg-surface p-4 shadow-card">
      <View
        className={`h-[42px] w-[42px] flex-none items-center justify-center rounded-[14px] ${TINT_BG[tx.status]}`}
      >
        <Icon name={ICON[tx.status]} size={20} color={TINT[tx.status]} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="text-[14px] font-bold text-ink">Retribusi {tx.period}</Text>
        <Text className="mt-1.5 text-[11px] leading-snug text-dim" numberOfLines={1}>
          {secondary}
        </Text>
      </View>
      {/* Nominal kembali bertinta: warnanya sudah dipikul badge tepat di bawahnya, dan
          dua penanda warna bertumpuk membuat angkanya terbaca seperti peringatan. */}
      <View className="flex-none items-end gap-2">
        <Text className="text-[14.5px] font-extrabold text-ink">{formatRupiah(tx.amount)}</Text>
        <View className={`rounded-full px-2.5 py-1.5 ${TINT_BG[tx.status]}`}>
          <Text
            className="font-sans text-[9.5px] font-bold uppercase tracking-wide"
            style={{ color: TINT[tx.status] }}
          >
            {st.label}
          </Text>
        </View>
      </View>
    </View>
  );
}
