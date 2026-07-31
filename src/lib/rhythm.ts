/**
 * Ritme vertikal beranda: jarak yang tumbuh mengikuti tinggi layar.
 *
 * Semua jarak beranda semula konstan, di-tuning untuk layar ~800dp. Di perangkat
 * 6,59" (~880dp) angka yang sama menyisakan ruang kosong di kaki dan membuat kepala
 * terasa pendek — nominalnya "tenggelam". Jadi jaraknya diinterpolasi linear terhadap
 * tinggi jendela, bukan dipilih lewat ambang: ambang membuat dua perangkat yang beda
 * 1dp melompat tata letak, interpolasi membuatnya kontinu.
 *
 * Batas bawahnya 800dp, sengaja dipilih sama dengan layar yang jadi dasar tuning
 * sekarang — pada `height ≤ 800` semua nilai jatuh persis ke angka lama, jadi layar
 * pendek tak berubah sama sekali. Batas atasnya 880dp, tinggi perangkat sasaran;
 * di atas itu jaraknya berhenti tumbuh supaya tablet tidak jadi renggang.
 */

import { useWindowDimensions } from 'react-native';

const BASE_HEIGHT = 800;
const TALL_HEIGHT = 880;

export interface Rhythm {
  /** 0 di layar ≤800dp, 1 di ≥880dp. Terbuka supaya pemakai bisa menurunkan nilai lain. */
  t: number;
  hero: {
    /** Ekstra di bawah `insets.top`. */
    padTop: number;
    /** Sapaan → nominal. */
    amountTop: number;
    /** `fontSize` nominal. */
    amountSize: number;
    /** Nominal → kapsul/cakupan di kaki kepala. */
    footTop: number;
    /** Kaki kepala. Offset -26dp kartu yang menaikinya tetap, jadi ini yang melapangkan. */
    padBottom: number;
  };
  /** Jarak antar seksi konten di bawah kepala. */
  sectionGap: number;
}

export function useVerticalRhythm(): Rhythm {
  const { height } = useWindowDimensions();
  const t = clamp01((height - BASE_HEIGHT) / (TALL_HEIGHT - BASE_HEIGHT));

  return {
    t,
    hero: {
      padTop: lerp(14, 20, t),
      amountTop: lerp(24, 34, t),
      amountSize: lerp(38, 42, t),
      footTop: lerp(18, 26, t),
      padBottom: lerp(50, 62, t),
    },
    sectionGap: lerp(18, 24, t),
  };
}

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

const lerp = (from: number, to: number, t: number): number => from + (to - from) * t;
