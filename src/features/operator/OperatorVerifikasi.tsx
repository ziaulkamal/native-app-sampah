import { useState } from 'react';
import { View } from 'react-native';
import { ScreenScaffold } from '@/components/layout/ScreenScaffold';
import { SubScreenHeader } from '@/components/layout/SubScreenHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { SearchBar } from '@/components/ui/SearchBar';
import { usePagination } from '@/lib/pagination';
import { useApp } from '@/store/AppContext';
import { CollectRow } from './CollectRow';
import { PengajuanTunai } from './PengajuanTunai';
import { useOperatorData } from './useOperatorData';

/** Verifikasi pembayaran: cari pelanggan lalu catat bayar. Sub-screen. */
export function OperatorVerifikasi() {
  const { payBill } = useApp();
  const { list, billFor, unpaidCountFor } = useOperatorData();
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const matches =
    q === ''
      ? []
      : list.filter((c) => c.name.toLowerCase().includes(q) || c.address.toLowerCase().includes(q));
  // Kata kunci pendek ("a") bisa mencocokkan hampir seluruh zona; halamannya kembali
  // ke satu tiap kali kata kuncinya berubah.
  const { items: shown, bind } = usePagination(matches, query);

  return (
    <ScreenScaffold>
      <SubScreenHeader eyebrow="Operator Retribusi" title="Verifikasi Pembayaran" />

      <PengajuanTunai />

      {/* Tombol "Pindai QR Pelanggan" milik web tidak ikut: lingkup fitur native yang
          disepakati hanya OCR KTP, dan tak ada QR pelanggan yang diterbitkan backend. */}
      <SearchBar value={query} onChangeText={setQuery} placeholder="Cari nama pelanggan…" />

      <View className="gap-3">
        {/* `EmptyState`, bukan teks melayang: keadaan "belum mencari" dan "tidak ketemu"
            di bawah sama-sama kosong, jadi keduanya bicara dengan bahasa yang sama. */}
        {q === '' && (
          <EmptyState
            icon="search"
            title="Cari pelanggan"
            message="Ketik nama atau alamat pelanggan di zona Anda untuk mencatat pembayaran."
          />
        )}
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
        {q !== '' && matches.length === 0 && (
          <EmptyState
            icon="search"
            title="Tidak ditemukan"
            message="Tidak ada pelanggan cocok di zona Anda."
          />
        )}
        {/* Tanpa kata kunci daftarnya memang kosong; kontrol halaman di bawah empty
            state hanya menggantung tanpa ada yang bisa dihalamani. */}
        {q !== '' && (
          <Pagination {...bind} unit="pelanggan" className="rounded-xl2 bg-surface shadow-card" />
        )}
      </View>
    </ScreenScaffold>
  );
}
