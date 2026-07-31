import { useMemo } from 'react';
import { todayLabel } from '@/lib/dates';
import { useApp } from '@/store/AppContext';
import type { Bill } from '@/types';

/**
 * Data turunan untuk operator yang login: profil, zona, daftar pelanggan, peta
 * tagihan periode berjalan, serta kas terkumpul & tersetor hari ini.
 */
export function useOperatorData() {
  const { bills, customers, transactions, cashOnHand, zones: allZones, session } = useApp();
  const op = session;
  const zones = allZones.filter((z) => op !== null && z.operatorIds.includes(op.id));
  const zoneIds = zones.map((z) => z.id);
  const list = customers.filter((c) => zoneIds.includes(c.zoneId));

  // Tagihan "berjalan" per pelanggan = tertunggak tertua, jatuh ke bill terakhir bila semua lunas.
  const { billFor, unpaidCountFor } = useMemo(() => {
    const byCustomer = new Map<string, Bill[]>();
    for (const b of bills) {
      const arr = byCustomer.get(b.customerId);
      if (arr) arr.push(b);
      else byCustomer.set(b.customerId, [b]);
    }
    const billFor = new Map<string, Bill>();
    const unpaidCountFor = new Map<string, number>();
    for (const [cid, arr] of byCustomer) {
      // Terlama lebih dulu: server menolak pembayaran yang melompati tagihan lama.
      const unpaid = arr
        .filter((b) => b.status !== 'lunas')
        .sort((a, b) => a.periodStart.localeCompare(b.periodStart));
      unpaidCountFor.set(cid, unpaid.length);
      billFor.set(cid, unpaid[0] ?? arr[0]);
    }
    return { billFor, unpaidCountFor };
  }, [bills]);

  const today = todayLabel();
  const collectedToday = transactions
    .filter((t) => t.operatorId === op?.id && t.date === today && t.status === 'selesai')
    .reduce((a, t) => a + t.amount, 0);

  // Kas datang utuh dari server. Menghitungnya dari setoran hari ini akan salah:
  // setoran yang baru diajukan belum mengurangi kas, dan yang ditolak mengembalikannya.
  const cash = cashOnHand ?? { total: 0, depositable: 0, pendingApproval: 0, deposited: 0 };

  return { op, zones, list, billFor, unpaidCountFor, collectedToday, cash };
}
