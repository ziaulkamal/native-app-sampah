import { Text, View } from 'react-native';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { formatRupiah } from '@/lib/format';
import { BILL_BADGE, golonganName } from '@/lib/labels';
import { useApp } from '@/store/AppContext';
import { semantic } from '@/tokens/tokens';
import type { Bill, Customer } from '@/types';

interface CollectRowProps {
  customer: Customer;
  bill: Bill;
  onCollect: () => void;
  /** Jumlah tagihan tertunggak lain milik pelanggan (untuk badge "+N"). */
  moreCount?: number;
}

/** Baris pelanggan pada rute/penagihan operator; tombol Catat Bayar bila belum lunas. */
export function CollectRow({ customer, bill, onCollect, moreCount = 0 }: CollectRowProps) {
  const { tariffs } = useApp();
  const badge = BILL_BADGE[bill.status];
  const paid = bill.status === 'lunas';

  return (
    <View className="rounded-xl2 bg-surface p-3.5 shadow-card">
      <View className="flex-row items-center gap-3">
        <View className="h-[44px] w-[44px] items-center justify-center rounded-full bg-pill">
          <Text className="text-[15px] font-bold text-olive">{customer.name[0]}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-[14px] font-bold text-ink" numberOfLines={1}>
            {customer.name}
          </Text>
          <Text className="mt-0.5 text-[11px] text-dim" numberOfLines={1}>
            {golonganName(tariffs, customer.category)} · {customer.address}
          </Text>
        </View>
        <Badge label={badge.label} tone={badge.tone} />
      </View>

      <View className="mt-3 flex-row items-center justify-between gap-2">
        <View className="flex-1 flex-row items-baseline gap-2">
          <Text className="text-[15px] font-extrabold text-ink">{formatRupiah(bill.amount)}</Text>
          <Text className="flex-1 text-[11px] text-dim" numberOfLines={1}>
            {bill.period}
          </Text>
          {moreCount > 0 && (
            <Text className="rounded bg-pill px-1.5 py-0.5 text-[10px] font-bold text-olive">
              +{moreCount}
            </Text>
          )}
        </View>
        {paid ? (
          <View className="flex-row items-center gap-1.5">
            <Icon name="check" size={17} color={semantic.success} />
            <Text className="text-[12.5px] font-semibold text-success">Tercatat</Text>
          </View>
        ) : (
          <Button
            label="Catat Bayar"
            size="sm"
            icon={<Icon name="wallet" size={16} color="#fff" />}
            onPress={onCollect}
          />
        )}
      </View>
    </View>
  );
}
