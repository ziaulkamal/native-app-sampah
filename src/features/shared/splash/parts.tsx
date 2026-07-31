/**
 * Potongan visual splash sinematik yang tak punya padanan langsung di RN.
 *
 * Semua yang di web cukup satu properti CSS — `radial-gradient`, `mask-image`,
 * `mix-blend-mode`, `repeating-linear-gradient` — di sini harus digambar sendiri lewat
 * react-native-svg atau ditumpuk sebagai lapisan. Dipisah ke file ini supaya
 * `CinematicSplash.tsx` tinggal menyusun adegan, bukan ikut mengurus cara menggambar.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode, useEffect, useId, useMemo, useState } from 'react';
import {
  type LayoutChangeEvent,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Defs,
  G,
  Line,
  LinearGradient as SvgGradient,
  Mask,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { WAKTU } from './pieces';

/** `useId` menghasilkan tanda baca yang tak sah di `url(#…)`, jadi dibersihkan dulu. */
export const idSvg = (mentah: string) => `s${mentah.replace(/[^a-zA-Z0-9]/g, '')}`;

const HALUS = Easing.bezier(0.16, 1, 0.3, 1);

interface Henti {
  offset: number;
  warna: string;
  op: number;
}

/** Satu `radial-gradient` sebagai lapisan tersendiri; wadahnya yang menentukan ukuran. */
export function Cahaya({
  henti,
  style,
}: {
  henti: readonly Henti[];
  style?: StyleProp<ViewStyle>;
}) {
  const id = idSvg(useId());
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, style]}
    >
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" rx="50%" ry="50%">
          {henti.map((h) => (
            <Stop key={h.offset} offset={h.offset} stopColor={h.warna} stopOpacity={h.op} />
          ))}
        </RadialGradient>
      </Defs>
      <Rect width="100" height="100" fill={`url(#${id})`} />
    </Svg>
  );
}

/** Latar adegan: gradien radial yang pusatnya di atas-tengah, sama seperti desain. */
export function Latar() {
  const id = idSvg(useId());
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
    >
      <Defs>
        <RadialGradient id={id} cx="50%" cy="34%" rx="90%" ry="55%">
          <Stop offset={0} stopColor="#0e2038" />
          <Stop offset={0.55} stopColor="#060b16" />
          <Stop offset={1} stopColor="#010306" />
        </RadialGradient>
      </Defs>
      <Rect width="100" height="100" fill={`url(#${id})`} />
    </Svg>
  );
}

/** Pengganti `box-shadow: inset` yang tak ada di RN — tepi digelapkan dari luar. */
export function Vinyet() {
  return (
    <Cahaya
      henti={[
        { offset: 0.45, warna: '#000000', op: 0 },
        { offset: 0.8, warna: '#000000', op: 0.42 },
        { offset: 1, warna: '#000000', op: 0.85 },
      ]}
    />
  );
}

/**
 * Lantai grid berperspektif yang bangkit dari bawah layar.
 *
 * Pudarnya ke arah atas digambar sebagai `<Mask>` SVG, bukan lapisan gelap bertumpuk:
 * latarnya sendiri sudah gradien, jadi menimpanya dengan warna apa pun akan terlihat
 * sebagai pita yang tak sewarna.
 */
export function Grid({
  lebar,
  tinggi,
  s,
  tempo,
}: {
  lebar: number;
  tinggi: number;
  s: number;
  tempo: number;
}) {
  const gid = idSvg(useId());
  const mid = `${gid}m`;
  const jarak = Math.max(8, 110 * s);
  const p = useSharedValue(0);

  useEffect(() => {
    p.value = withTiming(1, { duration: WAKTU.grid * tempo, easing: Easing.out(Easing.cubic) });
  }, [p, tempo]);

  const gaya = useAnimatedStyle(
    () => ({
      opacity: p.value * 0.42,
      transform: [
        { perspective: 900 },
        { rotateX: '70deg' },
        { translateY: interpolate(p.value, [0, 1], [120 * s, 0]) },
      ],
    }),
    [s],
  );

  const kolom = useMemo(() => deret(lebar, jarak), [lebar, jarak]);
  const baris = useMemo(() => deret(tinggi, jarak), [tinggi, jarak]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: 'absolute', left: '-25%', width: '150%', bottom: '-4%', height: '44%' },
        { transformOrigin: '50% 100%' },
        gaya,
      ]}
    >
      <Svg width={lebar} height={tinggi}>
        <Defs>
          <SvgGradient id={gid} x1="0" y1="1" x2="0" y2="0">
            <Stop offset={0} stopColor="#ffffff" stopOpacity={1} />
            <Stop offset={0.88} stopColor="#ffffff" stopOpacity={0} />
          </SvgGradient>
          <Mask id={mid}>
            <Rect width={lebar} height={tinggi} fill={`url(#${gid})`} />
          </Mask>
        </Defs>
        <G mask={`url(#${mid})`}>
          {kolom.map((x) => (
            <Line
              key={`k${x}`}
              x1={x}
              y1={0}
              x2={x}
              y2={tinggi}
              stroke="rgba(80,220,255,0.22)"
              strokeWidth={2}
            />
          ))}
          {baris.map((y) => (
            <Line
              key={`b${y}`}
              x1={0}
              y1={y}
              x2={lebar}
              y2={y}
              stroke="rgba(80,220,255,0.30)"
              strokeWidth={2}
            />
          ))}
        </G>
      </Svg>
    </Animated.View>
  );
}

const deret = (panjang: number, jarak: number) => {
  const hasil: number[] = [];
  for (let v = 0; v <= panjang; v += jarak) hasil.push(Math.round(v));
  return hasil;
};

/** Bintik yang terus naik dan memudar; satu-satunya animasi yang berulang selamanya. */
export function Debu({
  x,
  y,
  d,
  warna,
  op,
  dur,
  delay,
  s,
  tempo,
}: {
  x: number;
  y: number;
  d: number;
  warna: string;
  op: number;
  dur: number;
  delay: number;
  s: number;
  tempo: number;
}) {
  const p = useSharedValue(0);

  useEffect(() => {
    p.value = withDelay(
      delay * tempo,
      withRepeat(withTiming(1, { duration: dur * tempo, easing: Easing.linear }), -1, false),
    );
  }, [delay, dur, p, tempo]);

  const gaya = useAnimatedStyle(
    () => ({
      opacity: interpolate(p.value, [0, 0.3, 1], [0, 1, 0]),
      transform: [
        { translateX: interpolate(p.value, [0, 1], [0, 24 * s]) },
        { translateY: interpolate(p.value, [0, 1], [40 * s, -140 * s]) },
      ],
    }),
    [s],
  );

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: 'absolute', left: `${x}%`, top: `${y}%`, width: d * s, height: d * s },
        gaya,
      ]}
    >
      <Cahaya
        henti={[
          { offset: 0, warna: `rgb(${warna})`, op },
          { offset: 0.7, warna: `rgb(${warna})`, op: 0 },
        ]}
      />
    </Animated.View>
  );
}

/** Percikan sekali-tembak di titik benturan kepingan. */
export function Percik({
  x,
  y,
  d,
  warna,
  delay,
  s,
  tempo,
}: {
  x: number;
  y: number;
  d: number;
  warna: string;
  delay: number;
  s: number;
  tempo: number;
}) {
  const p = useSharedValue(0);

  useEffect(() => {
    p.value = withDelay(
      delay * tempo,
      withTiming(1, { duration: WAKTU.percikDur * tempo, easing: Easing.out(Easing.quad) }),
    );
  }, [delay, p, tempo]);

  const gaya = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 0.25, 1], [0, 1, 0]),
    transform: [{ scale: interpolate(p.value, [0, 0.25, 1], [0.2, 1, 2.4]) }],
  }));

  const sisi = d * s;
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: `${x}%`,
          top: `${y}%`,
          width: sisi,
          height: sisi,
          marginLeft: -sisi / 2,
          marginTop: -sisi / 2,
        },
        gaya,
      ]}
    >
      <Cahaya
        henti={[
          { offset: 0, warna: '#ffffff', op: 0.92 },
          { offset: 0.3, warna: `rgb(${warna})`, op: 0.45 },
          { offset: 0.68, warna: `rgb(${warna})`, op: 0 },
        ]}
      />
    </Animated.View>
  );
}

/** Kilat besar saat kepingan terakhir mengunci. */
export function Kilat({ sisi, s, tempo }: { sisi: number; s: number; tempo: number }) {
  const p = useSharedValue(0);

  useEffect(() => {
    p.value = withDelay(
      WAKTU.kilat.delay * tempo,
      withTiming(1, { duration: WAKTU.kilat.dur * tempo, easing: Easing.out(Easing.quad) }),
    );
  }, [p, tempo]);

  const gaya = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 0.18, 1], [0, 1, 0]),
    transform: [{ scale: interpolate(p.value, [0, 1], [0.5, 2.6]) }],
  }));

  const lebar = sisi * s;
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: lebar,
          height: lebar,
          marginLeft: -lebar / 2,
          marginTop: -lebar / 2,
        },
        gaya,
      ]}
    >
      <Cahaya
        henti={[
          { offset: 0, warna: 'rgb(150,255,220)', op: 0.55 },
          { offset: 0.34, warna: 'rgb(90,200,255)', op: 0.18 },
          { offset: 0.66, warna: 'rgb(90,200,255)', op: 0 },
        ]}
      />
    </Animated.View>
  );
}

/** Naiknya sebaris teks dari bawah sambil menajam. Padanan `wordRise` di desain. */
export function Naik({
  delay,
  dur,
  tempo,
  s,
  diam,
  style,
  children,
}: {
  delay: number;
  dur: number;
  tempo: number;
  s: number;
  diam?: boolean;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const p = useSharedValue(0);

  useEffect(() => {
    if (diam) return;
    p.value = withDelay(delay * tempo, withTiming(1, { duration: dur * tempo, easing: HALUS }));
  }, [delay, diam, dur, p, tempo]);

  const gaya = useAnimatedStyle(
    () => ({
      opacity: p.value,
      transform: [
        { translateY: interpolate(p.value, [0, 1], [46 * s, 0]) },
        { scale: interpolate(p.value, [0, 1], [0.965, 1]) },
      ],
    }),
    [s],
  );

  if (diam) return <View style={style}>{children}</View>;
  return <Animated.View style={[style, gaya]}>{children}</Animated.View>;
}

/**
 * Kotak berkliping dengan seberkas cahaya yang menyapu isinya.
 *
 * Desain memakai `mix-blend-mode: screen`; RN tak punya blend mode, jadi berkasnya
 * ditumpuk sebagai gradien putih semi-transparan — di atas teks putih pada latar gelap
 * hasilnya paling mendekati.
 */
export function Sorot({
  delay,
  dur,
  tempo,
  warna,
  diam,
  style,
  onUkur,
  children,
}: {
  delay: number;
  dur: number;
  tempo: number;
  warna: string;
  diam?: boolean;
  style?: StyleProp<ViewStyle>;
  onUkur?: (kotak: { w: number; h: number }) => void;
  children: ReactNode;
}) {
  const [lebar, setLebar] = useState(0);
  const p = useSharedValue(0);

  useEffect(() => {
    if (diam) return;
    p.value = withDelay(
      delay * tempo,
      withTiming(1, { duration: dur * tempo, easing: Easing.out(Easing.quad) }),
    );
  }, [delay, diam, dur, p, tempo]);

  const gaya = useAnimatedStyle(
    () => ({
      opacity: interpolate(p.value, [0, 0.12, 1], [0, 1, 0]),
      transform: [
        { translateX: interpolate(p.value, [0, 1], [-1.3 * lebar, 2.3 * lebar]) },
        { skewX: '-18deg' },
      ],
    }),
    [lebar],
  );

  const ukur = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setLebar(width);
    onUkur?.({ w: width, h: height });
  };

  return (
    <View style={[{ overflow: 'hidden' }, style]} onLayout={ukur}>
      {children}
      {!diam && lebar > 0 ? (
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, gaya]}>
          <LinearGradient
            colors={['rgba(255,255,255,0)', warna, 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

/** Garis pindai tipis yang merayap — `repeating-linear-gradient` + `scanDrift` desain. */
export function Pindai({ lebar, tinggi, jarak }: { lebar: number; tinggi: number; jarak: number }) {
  const p = useSharedValue(0);

  useEffect(() => {
    p.value = withRepeat(withTiming(1, { duration: 600, easing: Easing.linear }), -1, false);
  }, [p]);

  const gaya = useAnimatedStyle(
    () => ({ transform: [{ translateY: interpolate(p.value, [0, 1], [0, jarak * 2]) }] }),
    [jarak],
  );

  // Digambar mulai dua periode di atas kotaknya supaya rayapan tak menyisakan celah.
  const baris = useMemo(() => {
    const hasil: number[] = [];
    for (let y = -jarak * 2; y <= tinggi; y += jarak) hasil.push(Math.round(y));
    return hasil;
  }, [jarak, tinggi]);

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, gaya]}>
      <Svg width={lebar} height={tinggi + jarak * 2} style={{ marginTop: -jarak * 2 }}>
        {baris.map((y) => (
          <Rect
            key={y}
            x={0}
            y={y + jarak * 2}
            width={lebar}
            height={Math.max(1, jarak / 4)}
            fill="#ffffff"
            fillOpacity={0.07}
          />
        ))}
      </Svg>
    </Animated.View>
  );
}
