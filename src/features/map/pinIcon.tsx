import Svg, { G, Path } from 'react-native-svg';

/**
 * Pin tetes air berwarna — padanan `pinIcon.ts` web.
 *
 * Web membangunnya dari string HTML (`L.divIcon`): kotak 22×22 dengan tiga sudut
 * membulat penuh dan satu sudut lancip, diputar −45°. Bentuk itu ditiru di sini
 * dengan path SVG yang sama persis lalu diputar lewat `<G rotation>`, supaya pin di
 * ponsel dan di web adalah bentuk yang sama — bukan dua tafsir yang mirip.
 *
 * Digambar sebagai komponen RN, bukan gambar yang didaftarkan ke MapLibre: warnanya
 * berasal dari golongan tarif yang bisa ditambah admin kapan saja, jadi jumlah
 * warnanya tak diketahui saat kompilasi.
 */

/** Kotak 22×22 dengan sudut kiri-bawah lancip; tiga sudut lain membulat radius 11. */
const TEARDROP = 'M0 22 L0 11 A11 11 0 0 1 11 0 A11 11 0 0 1 22 11 A11 11 0 0 1 11 22 Z';

/**
 * Setelah diputar −45°, ujung lancipnya jatuh di (11, 26.56) — sisi bawah viewBox.
 * Padding −2 memberi ruang untuk garis tepi putih 2px agar tak terpotong.
 */
const VIEW_BOX = '-2 -2 26 30.6';
const RATIO = 30.6 / 26;

/** Titik jangkar pin terhadap kotaknya: tengah-bawah, sama dengan `iconAnchor: [11, 22]` web. */
export const PIN_ANCHOR = 'bottom' as const;

interface PinProps {
  color: string;
  /** Lebar pin dalam dp; tingginya mengikuti rasio bentuknya. */
  size?: number;
}

export function Pin({ color, size = 26 }: PinProps) {
  return (
    <Svg width={size} height={size * RATIO} viewBox={VIEW_BOX}>
      <G rotation={-45} origin="11, 11">
        <Path d={TEARDROP} fill={color} stroke="#FFFFFF" strokeWidth={2} />
      </G>
    </Svg>
  );
}

/** Ukuran kotak pin dalam dp — dipakai pemanggil yang perlu menyediakan ruangnya. */
export const pinSize = (size = 26): { width: number; height: number } => ({
  width: size,
  height: size * RATIO,
});
