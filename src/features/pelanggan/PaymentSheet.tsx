import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Modal } from '@/components/ui/Modal';
import { formatRupiah } from '@/lib/format';
import { useApp } from '@/store/AppContext';
import { useTheme } from '@/theme/ThemeProvider';
import { colors, semantic } from '@/tokens/tokens';
import type { Bill } from '@/types';

type Method = 'transfer' | 'qris' | 'tunai';

const METHOD_LABEL: Record<Method, string> = {
  transfer: 'Transfer Bank',
  tunai: 'Via Petugas',
  qris: 'QRIS',
};

/** Sheet pembayaran retribusi: pilih metode → konfirmasi → bukti bayar. */
export function PaymentSheet({ bill, onClose }: { bill: Bill; onClose: () => void }) {
  const { bankAccounts, payBill } = useApp();
  const { mode } = useTheme();
  const primary = bankAccounts.find((b) => b.primary) ?? bankAccounts[0];
  const [method, setMethod] = useState<Method>('transfer');
  const [bankId, setBankId] = useState(primary?.id ?? '');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  // Nomor referensi diterbitkan server, tidak dikarang klien. Kegagalan dilaporkan
  // store lewat dialog, jadi sheet ini tetap terbuka pada pilihan metode semula.
  const confirm = async () => {
    setBusy(true);
    const outcome = await payBill(bill.id, { method });
    setBusy(false);
    if (outcome === null) setDone(true);
  };
  const bank = bankAccounts.find((b) => b.id === bankId);
  const total = bill.amount + bill.penalty;

  return (
    <Modal
      open
      onClose={onClose}
      title={done ? 'Bukti Pembayaran' : 'Bayar Retribusi'}
      footer={
        done ? (
          <Button label="Selesai" size="sm" onPress={onClose} />
        ) : (
          <>
            <Button label="Batal" variant="ghost" size="sm" onPress={onClose} />
            <Button
              label={busy ? 'Memproses…' : 'Konfirmasi Pembayaran'}
              size="sm"
              onPress={() => void confirm()}
              disabled={busy || (method === 'transfer' && !bank)}
            />
          </>
        )
      }
    >
      {done ? (
        <Receipt bill={bill} method={method} bankLabel={bank?.bank} />
      ) : (
        <View className="gap-4">
          <View className="rounded-xl bg-pill p-4">
            <Text className="text-[11px] uppercase tracking-wide text-dim">
              Retribusi {bill.period}
            </Text>
            <Text className="mt-0.5 text-[24px] font-extrabold text-ink">
              {formatRupiah(total)}
            </Text>
          </View>

          <View className="flex-row rounded-xl bg-pill p-1">
            {(['transfer', 'tunai', 'qris'] as Method[]).map((m) => (
              <Pressable
                key={m}
                onPress={() => setMethod(m)}
                accessibilityRole="button"
                accessibilityState={{ selected: method === m }}
                className={`flex-1 items-center rounded-lg py-2 ${
                  method === m ? 'bg-surface shadow-card' : ''
                }`}
              >
                <Text
                  className={`text-[12.5px] font-semibold ${method === m ? 'text-ink' : 'text-dim'}`}
                >
                  {METHOD_LABEL[m]}
                </Text>
              </Pressable>
            ))}
          </View>

          {method === 'tunai' && (
            <Text className="rounded-xl bg-pill px-4 py-3 text-[12.5px] leading-relaxed text-ink">
              Pengajuan dikirim ke petugas wilayah Anda. Tagihan baru lunas setelah petugas menerima
              uangnya dan mengonfirmasi di aplikasinya — jadi simpan bukti serah terimanya.
            </Text>
          )}

          {method === 'transfer' ? (
            <View className="gap-2.5">
              {bankAccounts.map((b) => {
                const on = bankId === b.id;
                return (
                  <Pressable
                    key={b.id}
                    onPress={() => setBankId(b.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    className={`flex-row items-center gap-3 rounded-xl border-[1.5px] p-3 ${
                      on ? 'border-olive bg-pill' : 'border-line bg-surface'
                    }`}
                  >
                    <View className="h-10 w-10 items-center justify-center rounded-lg bg-surface shadow-card">
                      <Icon name="wallet" size={20} color={colors[mode].olive} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[13px] font-bold text-ink">{b.bank}</Text>
                      <Text className="font-mono text-[12px] text-dim">{b.accountNumber}</Text>
                    </View>
                    {on && <Icon name="check" size={20} color={colors[mode].olive} />}
                  </Pressable>
                );
              })}
              <Text className="text-[11px] text-dim">
                Transfer tepat sesuai nominal ke rekening terpilih, lalu konfirmasi.
              </Text>
            </View>
          ) : (
            <View className="items-center gap-2 py-2">
              <View className="h-40 w-40 items-center justify-center rounded-xl border-[1.5px] border-dashed border-line bg-pill">
                <Icon name="qr" size={64} color={colors[mode]['text-dim']} />
              </View>
              <Text className="max-w-[240px] text-center text-[11px] text-dim">
                Pindai untuk membayar {formatRupiah(total)}. Gateway masih sandbox.
              </Text>
            </View>
          )}
        </View>
      )}
    </Modal>
  );
}

/** Bukti pembayaran (ditampilkan setelah konfirmasi). */
function Receipt({ bill, method, bankLabel }: { bill: Bill; method: Method; bankLabel?: string }) {
  const methodLabel =
    method === 'transfer'
      ? `Transfer · ${bankLabel ?? '-'}`
      : method === 'tunai'
        ? 'Tunai via petugas'
        : 'QRIS';

  return (
    <View className="items-center gap-2 py-2">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-success/10">
        <Icon name="check" size={32} color={semantic.success} />
      </View>
      <Text className="text-[18px] font-extrabold text-ink">Pembayaran terkirim</Text>
      <Text className="text-center text-[13px] text-dim">
        Pembayaran retribusi {bill.period} terkirim dan menunggu verifikasi dinas.
      </Text>
      <View className="mt-2 w-full gap-2.5 rounded-xl bg-pill p-4">
        <ReceiptRow label="Nominal" value={formatRupiah(bill.amount + bill.penalty)} />
        <ReceiptRow label="Metode" value={methodLabel} />
        <ReceiptRow label="Status" value="Menunggu verifikasi" />
      </View>
    </View>
  );
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-[12px] text-dim">{label}</Text>
      <Text className="text-[12.5px] font-bold text-ink">{value}</Text>
    </View>
  );
}
