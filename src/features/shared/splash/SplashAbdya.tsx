/**
 * Pembuka aplikasi — porting `Splash Abdya.dc.html` ke RN.
 *
 * Kanvas desain 390×844 dipakai sebagai satuan lebar: semua ukuran dikali
 * `s = lebar layar / 390` dan dibatasi supaya di layar lebar lambangnya tak melar.
 * Penempatan tegaknya mengikuti desain — rig di tengah dengan tarikan ke atas, blok
 * teks menempel di bawahnya, bilah muat di kaki layar.
 *
 * Yang tak bisa ikut karena RN tak punya padanannya: `filter: blur()` pada kepingan
 * yang melesat. Kaburnya sebagian tergantikan raster Android yang membesar saat
 * kepingan masuk berskala 1,35.
 */
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Image,
  Pressable,
  type StyleProp,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  ClipPath,
  Defs,
  Image as SvgImage,
  Polygon,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { typography } from '@/tokens/tokens';

/** Pengali seluruh durasi: 1 = sepersis desain (±4,2 detik), 0,8 mempercepat. */
const TEMPO = 1;

const LOGO = require('../../../../assets/brand/logo-abdya.png');

/** Lebar kanvas desain; jadi pembagi seluruh ukuran. */
const KANVAS = 390;
/** Sisi kotak lambang dalam satuan kanvas; juga viewBox tiap kepingan. */
const RIG = 230;

const MASUK = Easing.bezier(0.16, 1, 0.3, 1);
const BILAH = Easing.bezier(0.4, 0, 0.2, 1);

/** Kapan adegan dianggap habis dan layar mulai memudar ke aplikasi. */
const AKHIR = 4200;

interface Keping {
  /** Titik poligon SVG dalam satuan `RIG`. */
  points: string;
  /** Geser awal (satuan kanvas) dan putaran awal (derajat). */
  tx: number;
  ty: number;
  rot: number;
  /** Jeda masuk (ms, pada tempo 1). */
  delay: number;
}

const titik = (pts: readonly (readonly [number, number])[]) =>
  pts.map(([x, y]) => `${(x / 100) * RIG},${(y / 100) * RIG}`).join(' ');

/** Titik pusat kotak; tiap kepingan adalah juring yang berpangkal di sini. */
const P: readonly [number, number] = [50, 50];

const keping = (
  pts: readonly (readonly [number, number])[],
  tx: number,
  ty: number,
  rot: number,
  delay: number,
): Keping => ({ points: titik(pts), tx, ty, rot, delay });

/** 12 juring yang menutup penuh kotak lambang, searah jarum jam dari atas-tengah. */
const KEPINGAN: readonly Keping[] = [
  keping([P, [50, 0], [78.9, 0]], 67, -251, -24, 150),
  keping([P, [78.9, 0], [100, 0], [100, 21.1]], 184, -184, 18, 220),
  keping([P, [100, 21.1], [100, 50]], 251, -67, -15, 290),
  keping([P, [100, 50], [100, 78.9]], 251, 67, 22, 360),
  keping([P, [100, 78.9], [100, 100], [78.9, 100]], 184, 184, -19, 430),
  keping([P, [78.9, 100], [50, 100]], 67, 251, 14, 500),
  keping([P, [50, 100], [21.1, 100]], -67, 251, -21, 570),
  keping([P, [21.1, 100], [0, 100], [0, 78.9]], -184, 184, 17, 640),
  keping([P, [0, 78.9], [0, 50]], -251, 67, -13, 710),
  keping([P, [0, 50], [0, 21.1]], -251, -67, 20, 780),
  keping([P, [0, 21.1], [0, 0], [21.1, 0]], -184, -184, -16, 850),
  keping([P, [21.1, 0], [50, 0]], -67, -251, 12, 920),
];

/** Papan waktu (ms, tempo 1), disalin dari `animation-delay` tiap lapisan desain. */
const WAKTU = {
  bangun: { dur: 1400, delay: 0 },
  pendar: { dur: 1100, delay: 2000 },
  mapan: { dur: 700, delay: 2050 },
  kepingDur: 1250,
  eyebrow: { dur: 600, delay: 2250 },
  judul: { dur: 600, delay: 2420 },
  garis: { dur: 500, delay: 2580 },
  moto: { dur: 600, delay: 2620 },
  jalur: { dur: 400, delay: 2300 },
  isi: { dur: 1500, delay: 2350 },
  kaki: { dur: 600, delay: 2500 },
} as const;

interface SplashAbdyaProps {
  /** Dipanggil sesudah adegan memudar habis. */
  onDone: () => void;
  /** Dipanggil saat frame pertama terukur — tempat menutup splash native. */
  onSiap?: () => void;
}

export function SplashAbdya({ onDone, onSiap }: SplashAbdyaProps) {
  const { width } = useWindowDimensions();
  // Di tablet `width/390` melewati 1,5 dan lambangnya jadi sebesar telapak tangan;
  // pertumbuhannya dihentikan di 1,25.
  const s = Math.min(width / KANVAS, 1.25);
  const [hemat, setHemat] = useState<boolean | null>(null);
  const sudah = useRef(false);
  const keluar = useSharedValue(1);

  // Dibaca sebelum apa pun digambar: menyalakan animasi penuh lalu mematikannya
  // sepersekian detik kemudian justru lebih mengganggu daripada tak beranimasi.
  useEffect(() => {
    let hidup = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => hidup && setHemat(v))
      .catch(() => hidup && setHemat(false));
    return () => {
      hidup = false;
    };
  }, []);

  const tutup = useCallback(() => {
    if (sudah.current) return;
    sudah.current = true;
    keluar.value = withTiming(0, { duration: 380, easing: Easing.in(Easing.quad) }, (habis) => {
      if (habis) runOnJS(onDone)();
    });
  }, [keluar, onDone]);

  useEffect(() => {
    if (hemat === null) return;
    const jeda = setTimeout(tutup, hemat ? 1400 : AKHIR * TEMPO);
    return () => clearTimeout(jeda);
  }, [hemat, tutup]);

  const gayaKeluar = useAnimatedStyle(() => ({ opacity: keluar.value }));

  // Splash native masih menutupi layar selama pembacaan di atas, jadi frame kosong ini
  // tak pernah terlihat — dan `onSiap` sengaja belum dipanggil.
  if (hemat === null) return <View style={dasar} />;

  return (
    <Animated.View style={[dasar, gayaKeluar]} onLayout={onSiap}>
      <StatusBar style="light" hidden />
      {/* 168° CSS diukur pada geometri sebenarnya; di ruang 0–1 milik RN sudutnya
          dikoreksi dengan nisbah lebar/tinggi layar agar arah miringnya sama. */}
      <LinearGradient
        colors={['#0b3d2e', '#0d5a44', '#0e4f74', '#0a3352']}
        locations={[0, 0.38, 0.78, 1]}
        start={{ x: 0.26, y: 0 }}
        end={{ x: 0.74, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Bangun diam={hemat} />

      <Pressable
        style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}
        onPress={tutup}
        accessibilityRole="button"
        accessibilityLabel="Lewati pembuka"
      >
        <Lambang s={s} diam={hemat} />
        <Teks s={s} diam={hemat} />
        <Kaki s={s} diam={hemat} />
      </Pressable>
    </Animated.View>
  );
}

/**
 * Sapuan emas yang menyala di sepertiga atas layar (`bgWake`).
 *
 * Desain memusatkannya di 50%/38% dengan jari-jari 60%×42%; `Cahaya` selalu memusat di
 * kotaknya sendiri, jadi kotaknya yang digeser dan dilebihkan sampai pusat dan
 * jari-jarinya jatuh di tempat yang sama.
 */
function Bangun({ diam }: { diam: boolean }) {
  const p = useSharedValue(diam ? 1 : 0);

  useEffect(() => {
    if (diam) return;
    p.value = withTiming(1, {
      duration: WAKTU.bangun.dur * TEMPO,
      easing: Easing.out(Easing.quad),
    });
  }, [diam, p]);

  const gaya = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 1], [0.25, 1]),
    transform: [{ scale: interpolate(p.value, [0, 1], [1.15, 1]) }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: 'absolute', left: '-10%', width: '120%', top: '-4%', height: '84%' },
        gaya,
      ]}
    >
      <Cahaya
        henti={[
          { offset: 0, warna: 'rgb(255,214,124)', op: 0.22 },
          { offset: 0.7, warna: 'rgb(255,214,124)', op: 0 },
        ]}
        style={{ opacity: 0.5 }}
      />
    </Animated.View>
  );
}

/** Kotak lambang: pendaran emas di belakang, 12 kepingan, lalu satu embusan `settle`. */
function Lambang({ s, diam }: { s: number; diam: boolean }) {
  const p = useSharedValue(0);

  useEffect(() => {
    if (diam) return;
    p.value = withDelay(
      WAKTU.mapan.delay * TEMPO,
      withTiming(1, { duration: WAKTU.mapan.dur * TEMPO, easing: Easing.out(Easing.quad) }),
    );
  }, [diam, p]);

  const gaya = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(p.value, [0, 0.45, 1], [1, 1.045, 1]) }],
  }));

  const sisi = RIG * s;
  return (
    <Animated.View
      pointerEvents="none"
      // Tarikan ke atas desain: rig duduk lebih tinggi dari titik tengah supaya blok
      // teks di bawahnya ikut terbaca sebagai satu kesatuan.
      style={[{ width: sisi, height: sisi, marginTop: -52 * s }, diam ? null : gaya]}
    >
      {diam ? null : <Pendar />}
      {diam ? (
        <Image source={LOGO} resizeMode="contain" style={StyleSheet.absoluteFill} />
      ) : (
        KEPINGAN.map((k) => <KepingLogo key={k.points} keping={k} s={s} />)
      )}
    </Animated.View>
  );
}

/** Denyut cahaya sekali jalan tepat saat kepingan terakhir mengunci. */
function Pendar() {
  const p = useSharedValue(0);

  useEffect(() => {
    p.value = withDelay(
      WAKTU.pendar.delay * TEMPO,
      withTiming(1, { duration: WAKTU.pendar.dur * TEMPO, easing: Easing.out(Easing.quad) }),
    );
  }, [p]);

  const gaya = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 0.35, 1], [0, 0.85, 0]),
    transform: [{ scale: interpolate(p.value, [0, 1], [0.75, 1.9]) }],
  }));

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, gaya]}>
      <Cahaya
        henti={[
          { offset: 0, warna: 'rgb(255,226,157)', op: 0.55 },
          { offset: 0.65, warna: 'rgb(255,226,157)', op: 0 },
        ]}
      />
    </Animated.View>
  );
}

/**
 * Satu juring lambang. `clip-path` web jadi `<ClipPath>` SVG, dan seluruh gambar tetap
 * digambar utuh di balik kliping — itulah yang membuat kepingan pas menyatu di akhir.
 */
function KepingLogo({ keping: k, s }: { keping: Keping; s: number }) {
  const id = idSvg(useId());
  const p = useSharedValue(0);

  useEffect(() => {
    p.value = withDelay(
      k.delay * TEMPO,
      withTiming(1, { duration: WAKTU.kepingDur * TEMPO, easing: MASUK }),
    );
  }, [k, p]);

  const gaya = useAnimatedStyle(
    () => ({
      opacity: interpolate(p.value, [0, 0.55], [0, 1], Extrapolation.CLAMP),
      transform: [
        { translateX: interpolate(p.value, [0, 1], [k.tx * s, 0]) },
        { translateY: interpolate(p.value, [0, 1], [k.ty * s, 0]) },
        { rotate: `${interpolate(p.value, [0, 1], [k.rot, 0])}deg` },
        { scale: interpolate(p.value, [0, 1], [1.35, 1]) },
      ],
    }),
    [k, s],
  );

  const sisi = RIG * s;
  return (
    <Animated.View style={[StyleSheet.absoluteFill, gaya]}>
      <Svg width={sisi} height={sisi} viewBox={`0 0 ${RIG} ${RIG}`}>
        <Defs>
          <ClipPath id={id}>
            <Polygon points={k.points} />
          </ClipPath>
        </Defs>
        <SvgImage
          href={LOGO}
          x={0}
          y={0}
          width={RIG}
          height={RIG}
          preserveAspectRatio="xMidYMid meet"
          clipPath={`url(#${id})`}
        />
      </Svg>
    </Animated.View>
  );
}

/** Blok tulisan di bawah lambang: kop, nama kabupaten, garis emas, lalu moto. */
function Teks({ s, diam }: { s: number; diam: boolean }) {
  return (
    <View
      pointerEvents="none"
      style={{
        alignItems: 'center',
        gap: 10 * s,
        marginTop: 26 * s,
        paddingHorizontal: 28 * s,
      }}
    >
      <Muncul {...WAKTU.eyebrow} s={s} diam={diam}>
        <Text
          style={{
            fontFamily: typography.sans,
            fontSize: 12 * s,
            fontWeight: '600',
            letterSpacing: 12 * s * 0.28,
            textTransform: 'uppercase',
            color: 'rgba(255,232,180,0.82)',
          }}
        >
          Pemerintah Kabupaten
        </Text>
      </Muncul>

      <Muncul {...WAKTU.judul} s={s} diam={diam}>
        <Text
          style={{
            fontFamily: typography.sans,
            fontSize: 29 * s,
            fontWeight: '800',
            letterSpacing: 29 * s * 0.03,
            textAlign: 'center',
            color: '#ffffff',
            textShadowColor: 'rgba(0,0,0,0.35)',
            textShadowOffset: { width: 0, height: 2 * s },
            textShadowRadius: 18 * s,
          }}
        >
          Aceh Barat Daya
        </Text>
      </Muncul>

      <Muncul {...WAKTU.garis} s={s} diam={diam}>
        <LinearGradient
          colors={['rgba(255,214,124,0)', '#ffd67c', 'rgba(255,214,124,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width: 46 * s, height: Math.max(1, 2 * s) }}
        />
      </Muncul>

      <Muncul {...WAKTU.moto} s={s} diam={diam}>
        <Text
          style={{
            fontFamily: typography.sans,
            fontSize: 13 * s,
            fontWeight: '500',
            fontStyle: 'italic',
            letterSpacing: 13 * s * 0.04,
            textAlign: 'center',
            color: 'rgba(255,255,255,0.7)',
          }}
        >
          Sapeue Kheuen Sahou Langkah
        </Text>
      </Muncul>
    </View>
  );
}

/** Kaki layar: bilah muat yang terisi penuh menjelang adegan habis, lalu kredit layanan. */
function Kaki({ s, diam }: { s: number; diam: boolean }) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 46 * s,
        alignItems: 'center',
        gap: 14 * s,
      }}
    >
      <Muncul {...WAKTU.jalur} s={s} diam={diam}>
        <View
          style={{
            width: 118 * s,
            height: Math.max(2, 3 * s),
            borderRadius: 2,
            backgroundColor: 'rgba(255,255,255,0.16)',
            overflow: 'hidden',
          }}
        >
          <Isi diam={diam} />
        </View>
      </Muncul>

      <Muncul {...WAKTU.kaki} s={s} diam={diam}>
        <Text
          style={{
            fontFamily: typography.sans,
            fontSize: Math.max(9, 10 * s),
            letterSpacing: 10 * s * 0.2,
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.45)',
          }}
        >
          Layanan Digital Abdya
        </Text>
      </Muncul>
    </View>
  );
}

/** Isi bilah muat; lebarnya yang tumbuh, bukan skalanya — gradiennya tak boleh gepeng. */
function Isi({ diam }: { diam: boolean }) {
  const p = useSharedValue(diam ? 1 : 0);

  useEffect(() => {
    if (diam) return;
    p.value = withDelay(
      WAKTU.isi.delay * TEMPO,
      withTiming(1, { duration: WAKTU.isi.dur * TEMPO, easing: BILAH }),
    );
  }, [diam, p]);

  const gaya = useAnimatedStyle(() => ({ width: `${p.value * 100}%` }));

  return (
    <Animated.View style={[{ height: '100%', borderRadius: 2 }, gaya]}>
      <LinearGradient
        colors={['#ffd67c', '#ffffff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[StyleSheet.absoluteFill, { borderRadius: 2 }]}
      />
    </Animated.View>
  );
}

/** Naiknya satu elemen dari bawah sambil menajam. Padanan `riseIn` di desain. */
function Muncul({
  delay,
  dur,
  s,
  diam,
  children,
}: {
  delay: number;
  dur: number;
  s: number;
  diam: boolean;
  children: React.ReactNode;
}) {
  const p = useSharedValue(0);

  useEffect(() => {
    if (diam) return;
    p.value = withDelay(
      delay * TEMPO,
      withTiming(1, { duration: dur * TEMPO, easing: Easing.out(Easing.quad) }),
    );
  }, [delay, diam, dur, p]);

  const gaya = useAnimatedStyle(
    () => ({
      opacity: p.value,
      transform: [{ translateY: interpolate(p.value, [0, 1], [14 * s, 0]) }],
    }),
    [s],
  );

  if (diam) return <View>{children}</View>;
  return <Animated.View style={gaya}>{children}</Animated.View>;
}

/** `useId` menghasilkan tanda baca yang tak sah di `url(#…)`, jadi dibersihkan dulu. */
const idSvg = (mentah: string) => `s${mentah.replace(/[^a-zA-Z0-9]/g, '')}`;

/** Satu `radial-gradient` sebagai lapisan tersendiri; wadahnya yang menentukan ukuran. */
function Cahaya({
  henti,
  style,
}: {
  henti: readonly { offset: number; warna: string; op: number }[];
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

const dasar = { flex: 1, backgroundColor: '#0b3d2e' } as const;
