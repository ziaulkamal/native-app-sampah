import { readPulse, type Pulse } from '@/api/sync';

/**
 * Patokan pembanding denyut data. Di modul sendiri karena dua pihak menyentuhnya:
 * `usePulse` yang membandingkan, dan `mutate` yang menyetel ulang setelah menulis.
 */
let baseline: Pulse | null = null;

export const readBaseline = (): Pulse | null => baseline;

/** `null` mengosongkan patokan — dipakai saat sesi berakhir. */
export const writeBaseline = (pulse: Pulse | null): void => {
  baseline = pulse;
};

/**
 * Setel ulang patokan setelah mutasi kita sendiri memuat data penuh; tanpa ini denyut
 * berikutnya melihat cap bergeser dan memuat ulang yang baru saja dimuat.
 */
export async function resyncBaseline(): Promise<void> {
  try {
    baseline = await readPulse();
  } catch {
    // Patokan lama dibiarkan; paling buruk satu pemuatan ulang yang berlebih.
  }
}
