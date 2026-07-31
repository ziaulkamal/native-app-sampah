import { useCallback, useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { listPayments } from '@/api/payments';
import type { PaymentDto } from '@/api/types';
import { Button } from '@/components/ui/Button';
import { TextareaField } from '@/components/ui/FormField';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { formatRupiah } from '@/lib/format';
import { usePagination } from '@/lib/pagination';
import { useApp } from '@/store/AppContext';

/**
 * Pengajuan bayar tunai dari pelanggan yang menunggu konfirmasi petugas (PLAN §10.2).
 *
 * Sebelum dikonfirmasi, uangnya belum di tangan siapa pun — pembayaran itu masih niat
 * membayar, dan tagihannya masih terbuka. Menekan **Terima** di sini yang mengubahnya
 * jadi penerimaan kas atas nama petugas, dan sejak itu kas tersebut ikut dalam
 * setorannya ke dinas.
 *
 * Server menolak pengajuan atas titik di luar cakupan petugas, jadi daftar ini bisa
 * memuat baris yang tidak boleh ia sentuh — penolakannya ditampilkan apa adanya
 * daripada disembunyikan dengan penyaringan tebakan di klien.
 */
export function PengajuanTunai() {
  const { acceptPayment, rejectPayment, dataRevision } = useApp();
  const [rows, setRows] = useState<PaymentDto[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<PaymentDto | null>(null);
  const [note, setNote] = useState('');

  // Dipanggil sebelum cabang "antrean kosong" di bawah: hook tidak boleh dilewati render.
  const { items: shown, bind } = usePagination(rows);

  const loadedOnce = useRef(false);
  const load = useCallback(async () => {
    try {
      const page = await listPayments({ status: 'waiting_verification', method: 'tunai_petugas' });
      setRows(page.data);
      loadedOnce.current = true;
    } catch {
      // Sekali antreannya pernah tampil, kegagalan di latar tak mengosongkannya:
      // baris lama masih benar sampai penarikan berikutnya berhasil.
      if (!loadedOnce.current) setRows([]);
    }
  }, []);

  // Antrean ini punya endpoint sendiri di luar store, jadi `dataRevision` yang
  // menghubungkannya: pengajuan tunai baru dari pelanggan menggeser cap `payments`.
  useEffect(() => {
    void load();
  }, [load, dataRevision]);

  // Hasil kedua aksi dilaporkan store (toast bila berhasil, dialog bila gagal);
  // di sini tinggal memuat ulang antreannya.
  const accept = async (payment: PaymentDto) => {
    setBusyId(payment.id);
    const outcome = await acceptPayment(payment.id);
    setBusyId(null);
    if (outcome === null) void load();
  };

  const reject = async () => {
    if (rejecting === null || note.trim() === '') return;
    setBusyId(rejecting.id);
    const outcome = await rejectPayment(rejecting.id, note.trim());
    setBusyId(null);
    if (outcome === null) {
      setRejecting(null);
      setNote('');
      void load();
    }
  };

  if (rows.length === 0) return null;

  return (
    <View>
      <Text className="mb-1 text-[14px] font-extrabold text-ink">Pengajuan bayar tunai</Text>
      <Text className="mb-3 text-[11.5px] leading-snug text-dim">
        Terima hanya setelah uangnya benar-benar Anda pegang — sejak itu kas ini masuk setoran Anda.
      </Text>

      <View className="gap-2.5">
        {shown.map((row) => (
          <View key={row.id} className="rounded-xl2 bg-surface p-4 shadow-card">
            <View className="flex-row items-center gap-3">
              <View className="flex-1">
                <Text className="text-[13.5px] font-bold text-ink" numberOfLines={1}>
                  {row.customer_name ?? '—'}
                </Text>
                <Text className="text-[11.5px] text-dim">{row.payment_code}</Text>
              </View>
              <Text className="text-[14px] font-extrabold text-ink">
                {formatRupiah(row.total_amount)}
              </Text>
            </View>
            {/* Web menaruh dua tombol di baris yang sama dengan nominal; di lebar HP
                keduanya turun ke baris sendiri agar tetap cukup luas untuk ditekan. */}
            <View className="mt-3 flex-row gap-2">
              <View className="flex-1">
                <Button
                  label="Terima"
                  size="sm"
                  full
                  disabled={busyId === row.id}
                  onPress={() => void accept(row)}
                />
              </View>
              <View className="flex-1">
                <Button
                  label="Tolak"
                  variant="ghost"
                  size="sm"
                  full
                  disabled={busyId === row.id}
                  onPress={() => {
                    setRejecting(row);
                    setNote('');
                  }}
                />
              </View>
            </View>
          </View>
        ))}
        <Pagination {...bind} unit="pengajuan" className="rounded-xl2 bg-surface shadow-card" />
      </View>

      <Modal
        open={rejecting !== null}
        onClose={() => setRejecting(null)}
        title="Tolak pengajuan"
        footer={
          <>
            <Button label="Batal" variant="ghost" size="sm" onPress={() => setRejecting(null)} />
            <Button
              label="Tolak"
              variant="danger"
              size="sm"
              disabled={note.trim() === ''}
              onPress={() => void reject()}
            />
          </>
        }
      >
        <View className="gap-3">
          <Text className="text-[12.5px] leading-snug text-dim">
            Tagihannya kembali terbuka sehingga pelanggan bisa mengajukan ulang. Alasannya ikut
            terbaca oleh pelanggan.
          </Text>
          <TextareaField
            label="Alasan"
            value={note}
            onChangeText={setNote}
            placeholder="mis. uang tidak jadi diserahkan"
          />
        </View>
      </Modal>
    </View>
  );
}
