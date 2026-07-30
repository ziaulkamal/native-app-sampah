/** Helper format ringan. Zero dependency agar aman dipakai lintas platform. */

/** Format angka Rupiah, mis. 25000 → "Rp25.000". */
export function formatRupiah(amount: number): string {
  return 'Rp' + amount.toLocaleString('id-ID');
}

/** Ringkas Rupiah untuk KPI, mis. 12400000 → "Rp12,4 jt". */
export function formatRupiahShort(amount: number): string {
  if (amount >= 1_000_000_000) return `Rp${(amount / 1_000_000_000).toFixed(1)} M`;
  if (amount >= 1_000_000) return `Rp${(amount / 1_000_000).toFixed(1)} jt`;
  if (amount >= 1_000) return `Rp${(amount / 1_000).toFixed(0)} rb`;
  return formatRupiah(amount);
}

/** Persentase bulat dari rasio bagian/total (aman untuk total 0). */
export function toPercent(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((part / total) * 100));
}
