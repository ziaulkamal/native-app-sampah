import type { BillingScheme } from '@/types';

export interface PeriodSlot {
  period: string;
  dueDate: string;
}

/**
 * Pecah satu bulan dasar (mis. "Agu 2026") menjadi sub-periode tagihan sesuai skema:
 * bulanan → 1 · dua_mingguan → 2 (P1/P2) · tiga_mingguan → 2 (P1 hari 1–21, P2 sisanya)
 * · mingguan → 4 (Mgg 1..4). Termasuk jatuh tempo.
 *
 * Cerminan `SchemePeriods` di server, dan sengaja mengikuti aturannya: periode baru
 * hanya dimulai selama masih tersisa satu minggu penuh, sehingga tiga mingguan
 * menghasilkan **dua** periode per bulan — bukan satu.
 */
export function schemePeriods(baseMonth: string, scheme: BillingScheme): PeriodSlot[] {
  const [mon, year] = baseMonth.split(' ');
  if (scheme === 'mingguan') {
    return [7, 14, 21, 28].map((d, i) => ({
      period: `${baseMonth} · Mgg ${i + 1}`,
      dueDate: `${d} ${mon} ${year}`,
    }));
  }
  if (scheme === 'dua_mingguan') {
    return [15, 30].map((d, i) => ({
      period: `${baseMonth} · P${i + 1}`,
      dueDate: `${d} ${mon} ${year}`,
    }));
  }
  if (scheme === 'tiga_mingguan') {
    return [21, 30].map((d, i) => ({
      period: `${baseMonth} · P${i + 1}`,
      dueDate: `${d} ${mon} ${year}`,
    }));
  }
  return [{ period: baseMonth, dueDate: `20 ${mon} ${year}` }];
}
