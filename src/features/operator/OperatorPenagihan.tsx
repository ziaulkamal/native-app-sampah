import { useEffect, useState } from 'react';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { Text, View } from 'react-native';
import { ScreenScaffold } from '@/components/layout/ScreenScaffold';
import { ScreenTitle } from '@/components/layout/ScreenTitle';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { Pagination } from '@/components/ui/Pagination';
import { SearchBar } from '@/components/ui/SearchBar';
import { formatRupiah } from '@/lib/format';
import { usePagination } from '@/lib/pagination';
import type { OperatorPenagihanParams } from '@/navigation/types';
import { useApp } from '@/store/AppContext';
import { useTheme } from '@/theme/ThemeProvider';
import { colors } from '@/tokens/tokens';
import { CollectRow } from './CollectRow';
import { useOperatorData } from './useOperatorData';

type Filter = 'belum' | 'lunas' | 'semua';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'belum', label: 'Belum bayar' },
  { id: 'lunas', label: 'Lunas' },
  { id: 'semua', label: 'Semua' },
];

/** Penagihan operator: daftar pelanggan di zona + catat pembayaran. Layar tab. */
export function OperatorPenagihan() {
  const { payBill } = useApp();
  const { mode } = useTheme();
  const { params } = useRoute<RouteProp<OperatorPenagihanParams, 'OperatorPenagihan'>>();
  const { list, billFor, unpaidCountFor, collectedToday } = useOperatorData();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('belum');

  // Dibuka dari satu baris rute: kata kuncinya diisi nama pelanggan, bukan disaring
  // diam-diam — petugas tetap melihat kenapa daftarnya menyempit dan bisa menghapusnya.
  const focusId = params?.customerId;
  useEffect(() => {
    if (focusId === undefined) return;
    const name = list.find((c) => c.id === focusId)?.name;
    if (name !== undefined) {
      setQuery(name);
      setFilter('semua');
    }
  }, [focusId, list]);

  const q = query.trim().toLowerCase();
  const rows = list.filter((c) => {
    const bill = billFor.get(c.id);
    if (!bill) return false;
    const okStatus =
      filter === 'semua' ||
      (filter === 'lunas' ? bill.status === 'lunas' : bill.status !== 'lunas');
    const okQuery =
      q === '' || c.name.toLowerCase().includes(q) || c.address.toLowerCase().includes(q);
    return okStatus && okQuery;
  });

  // Satu zona bisa berisi ratusan pelanggan; petugas menagih rumah demi rumah, jadi
  // sepuluh kartu sekali tampil sudah sepadan dengan yang bisa didatangi sekali jalan.
  const { items: shown, bind } = usePagination(rows, `${filter}|${query}`);

  return (
    <ScreenScaffold>
      {/* Kas hari ini cuma penanda, bukan isi layar — selebar layar ia mendorong daftar
          penagihan turun satu blok penuh, jadi disusutkan ke samping judul. */}
      <ScreenTitle
        eyebrow="Operator Retribusi"
        title="Penagihan"
        action={
          <View className="flex-row items-center gap-2 rounded-xl bg-surface px-3 py-2 shadow-card">
            <Icon name="wallet" size={18} color={colors[mode].olive} />
            <View>
              <Text className="text-[13.5px] font-extrabold leading-none text-ink">
                {formatRupiah(collectedToday)}
              </Text>
              <Text className="mt-0.5 text-[10.5px] text-dim">terkumpul hari ini</Text>
            </View>
          </View>
        }
      />

      <SearchBar value={query} onChangeText={setQuery} placeholder="Cari nama atau alamat…" />

      {/* Tiga chip muat dalam satu baris layar HP, jadi tak perlu gulir mendatar. */}
      <View className="flex-row gap-2">
        {FILTERS.map((f) => (
          <Chip
            key={f.id}
            label={f.label}
            active={filter === f.id}
            onPress={() => setFilter(f.id)}
          />
        ))}
      </View>

      <View className="gap-3">
        {shown.map((c) => {
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
        {rows.length === 0 && (
          <EmptyState
            icon="check"
            title="Tidak ada tagihan"
            message="Tidak ada pelanggan pada filter ini."
          />
        )}
        <Pagination {...bind} unit="pelanggan" className="rounded-xl2 bg-surface shadow-card" />
      </View>
    </ScreenScaffold>
  );
}
