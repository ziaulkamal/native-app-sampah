import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';
import { ScreenScaffold } from '@/components/layout/ScreenScaffold';
import { SubScreenHeader } from '@/components/layout/SubScreenHeader';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Pagination } from '@/components/ui/Pagination';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { formatRupiah } from '@/lib/format';
import { usePagination } from '@/lib/pagination';
import { useApp } from '@/store/AppContext';
import { useTheme } from '@/theme/ThemeProvider';
import { colors } from '@/tokens/tokens';
import type { Deposit } from '@/types';
import { useOperatorData } from './useOperatorData';

const statusLook: Record<Deposit['status'], { label: string; tone: BadgeTone; icon: IconName }> = {
  diajukan: { label: 'Menunggu ACC', tone: 'warning', icon: 'bell' },
  diterima: { label: 'Diterima', tone: 'success', icon: 'check' },
  ditolak: { label: 'Ditolak', tone: 'danger', icon: 'x' },
};

/** Setor kas hasil penagihan ke dinas + riwayat setoran. Sub-screen. */
export function OperatorSetor() {
  const { depositCash, deposits, askConfirm } = useApp();
  const { mode } = useTheme();
  const { op, collectedToday, cash } = useOperatorData();
  const [busy, setBusy] = useState(false);
  const mine = deposits.filter((d) => d.operatorId === op?.id);
  const { items: shown, bind } = usePagination(mine);

  // Uang baru lepas dari tangan petugas setelah dinas menerima. Selama menunggu,
  // tombol setor dikunci supaya tidak menumpuk pengajuan kembar.
  const waiting = cash.pendingApproval > 0;

  // Nominalnya dihitung server: seluruh kas yang boleh diajukan ikut sekaligus, dan
  // pengajuan tak bisa ditarik kembali petugas. Karena itu ditanya dulu.
  const submit = async () => {
    const agreed = await askConfirm({
      title: 'Ajukan setoran?',
      message: `Seluruh kas di tangan Anda (${formatRupiah(cash.total)}) diajukan sekaligus ke dinas. Pengajuan tidak bisa Anda batalkan sendiri — hanya dinas yang menerima atau menolaknya.`,
      confirmLabel: 'Ajukan setoran',
      tone: 'primary',
    });
    if (!agreed) return;
    setBusy(true);
    await depositCash();
    setBusy(false);
  };

  return (
    <ScreenScaffold>
      <SubScreenHeader title="Setor Retribusi" />

      <LinearGradient
        // Sudut 150° web didekati dengan start/end diagonal; RN tak menerima sudut derajat.
        colors={['#3c4715', colors[mode].olive]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.6, y: 1 }}
        className="rounded-xl3 p-5 shadow-pop"
      >
        <Text className="text-[11px] uppercase tracking-wide text-white/80">
          Kas di tangan Anda
        </Text>
        <Text className="mt-1 text-[28px] font-extrabold leading-none text-white">
          {formatRupiah(cash.total)}
        </Text>
        {waiting && (
          <Text className="mt-2 text-[11.5px] leading-snug text-white/80">
            {formatRupiah(cash.pendingApproval)} sedang menunggu keputusan dinas. Uangnya masih Anda
            pegang sampai setoran diterima.
          </Text>
        )}
        <View className="mt-4">
          <Button
            label={
              waiting
                ? 'Menunggu keputusan dinas'
                : `Setor ${formatRupiah(cash.depositable)} ke Dinas`
            }
            variant="secondary"
            full
            icon={<Icon name="wallet" size={20} color={colors[mode].olive} />}
            disabled={busy || waiting || cash.depositable <= 0}
            onPress={() => void submit()}
          />
        </View>
      </LinearGradient>

      <View className="flex-row gap-3">
        <CashTile label="Terkumpul hari ini" amount={collectedToday} />
        <CashTile label="Menunggu ACC" amount={cash.pendingApproval} />
        <CashTile label="Diterima dinas" amount={cash.deposited} />
      </View>

      <View className="gap-3">
        <SectionHeader title="Riwayat setor" />
        {mine.length > 0 ? (
          <>
            {shown.map((d) => (
              <DepositRow key={d.id} deposit={d} />
            ))}
            <Pagination {...bind} unit="setoran" className="rounded-xl2 bg-surface shadow-card" />
          </>
        ) : (
          <EmptyState
            icon="wallet"
            title="Belum ada setoran"
            message="Setoran kas Anda akan tercatat di sini."
          />
        )}
      </View>
    </ScreenScaffold>
  );
}

function CashTile({ label, amount }: { label: string; amount: number }) {
  return (
    <View className="flex-1 rounded-xl2 bg-surface p-3.5 shadow-card">
      <Text className="text-[14px] font-extrabold leading-tight text-ink">
        {formatRupiah(amount)}
      </Text>
      <Text className="mt-1 text-[10.5px] leading-snug text-dim">{label}</Text>
    </View>
  );
}

function DepositRow({ deposit }: { deposit: Deposit }) {
  const { mode } = useTheme();
  const look = statusLook[deposit.status];

  return (
    <View className="flex-row items-start gap-3 rounded-xl2 bg-surface p-3.5 shadow-card">
      <View className="h-10 w-10 items-center justify-center rounded-xl bg-pill">
        <Icon name={look.icon} size={20} color={colors[mode].olive} />
      </View>
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="text-[14px] font-bold text-ink">{formatRupiah(deposit.amount)}</Text>
          <Badge label={look.label} tone={look.tone} />
        </View>
        <Text className="mt-0.5 font-mono text-[11px] text-dim">{deposit.ref}</Text>
        {deposit.rejectionNote !== undefined && (
          <Text className="mt-1.5 text-[11.5px] leading-snug text-danger">
            Ditolak: {deposit.rejectionNote}
          </Text>
        )}
      </View>
      <Text className="text-[11.5px] text-dim">{deposit.date}</Text>
    </View>
  );
}
