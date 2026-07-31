/**
 * Pembuka sinematik — porting `Splash Abdya Cinematic.dc.html` ke RN.
 *
 * Kanvas desain 1080×1920 tidak diskalakan utuh lalu dipotong: layar Android jauh
 * lebih jangkung dan pemotongan akan memakan "ACEH BARAT DAYA" di tepi. Yang dipakai
 * adalah satuan lebar — semua ukuran dikali `s = lebar layar / 1080` — sementara
 * penempatan tegaknya memakai persen tinggi layar, jadi susunannya tetap sebanding
 * di layar mana pun.
 *
 * Yang tak bisa ikut karena RN tak punya padanannya: `filter: blur()` dan
 * `brightness()` pada kepingan yang melesat. Kaburnya sebagian tergantikan sendiri
 * oleh raster Android yang membesar saat kepingan masuk berskala besar.
 */
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Image,
  Pressable,
  StyleSheet,
  Text,
  type TextStyle,
  View,
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
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { ClipPath, Defs, Image as SvgImage, Polygon } from 'react-native-svg';
import { typography } from '@/tokens/tokens';
import { Debu, Grid, Kilat, Latar, Naik, Percik, Pindai, Sorot, Vinyet, idSvg } from './parts';
import { GOYANG, KEPINGAN, type Keping, RIG, WAKTU } from './pieces';

/** Pengali seluruh durasi: 1 = sepersis desain (±6,3 detik), 0,8 mempercepat. */
const TEMPO = 1;

/** Petunjuk lewati. Layar tetap bisa diketuk untuk melewati walau ini dimatikan. */
const TAMPILKAN_LEWATI = true;

const LOGO = require('../../../../assets/brand/logo-abdya.png');

const MASUK = Easing.bezier(0.14, 0.9, 0.2, 1);
const KAMERA = Easing.bezier(0.33, 0, 0.2, 1);

interface CinematicSplashProps {
  /** Dipanggil sesudah adegan memudar habis. */
  onDone: () => void;
  /** Dipanggil saat frame pertama terukur — tempat menutup splash native. */
  onSiap?: () => void;
}

export function CinematicSplash({ onDone, onSiap }: CinematicSplashProps) {
  const { width, height } = useWindowDimensions();
  const s = width / 1080;
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
    const jeda = setTimeout(tutup, hemat ? 1600 : WAKTU.akhir * TEMPO);
    return () => clearTimeout(jeda);
  }, [hemat, tutup]);

  const gayaKeluar = useAnimatedStyle(() => ({ opacity: keluar.value }));

  // Splash native masih menutupi layar selama pembacaan di atas, jadi frame kosong ini
  // tak pernah terlihat — dan `onSiap` sengaja belum dipanggil.
  if (hemat === null) return <View style={dasar} />;

  return (
    <Animated.View style={[dasar, gayaKeluar]} onLayout={onSiap}>
      <StatusBar style="light" hidden />
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={tutup}
        accessibilityRole="button"
        accessibilityLabel="Lewati pembuka"
      >
        <Latar />
        <Adegan s={s} lebar={width} tinggi={height} diam={hemat} />
        <Vinyet />
        {TAMPILKAN_LEWATI ? (
          <Naik delay={2000} dur={600} tempo={TEMPO} s={s} diam={hemat} style={lewatiKotak}>
            <Text
              style={[lewatiTeks, { fontSize: Math.max(10, 22 * s), letterSpacing: 22 * s * 0.2 }]}
            >
              Ketuk untuk lewati
            </Text>
          </Naik>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

/**
 * Seluruh isi adegan di bawah satu dorongan kamera, persis `camPush` desain yang
 * membungkus grid, debu, lambang, dan teks sekaligus.
 */
function Adegan({
  s,
  lebar,
  tinggi,
  diam,
}: {
  s: number;
  lebar: number;
  tinggi: number;
  diam: boolean;
}) {
  const kam = useSharedValue(0);

  useEffect(() => {
    if (diam) return;
    kam.value = withTiming(1, { duration: WAKTU.kamera * TEMPO, easing: KAMERA });
  }, [diam, kam]);

  const gaya = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(kam.value, [0, 1], [1, 1.075]) }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { transformOrigin: '50% 42%' }, diam ? null : gaya]}
    >
      {diam ? null : (
        <>
          <Grid lebar={lebar * 1.5} tinggi={tinggi * 0.44} s={s} tempo={TEMPO} />
          {WAKTU.debu.map((d) => (
            <Debu key={`${d.x}-${d.y}`} {...d} s={s} tempo={TEMPO} />
          ))}
        </>
      )}

      <View style={rigBaris}>
        <View style={{ width: RIG * s, height: RIG * s }}>
          {diam ? (
            <Image source={LOGO} resizeMode="contain" style={StyleSheet.absoluteFill} />
          ) : (
            <Rig s={s} />
          )}
        </View>
      </View>

      <Teks s={s} diam={diam} />
    </Animated.View>
  );
}

/** Kotak lambang: 14 kepingan, kilat, percikan, plus goyangan saat semuanya berbenturan. */
function Rig({ s }: { s: number }) {
  const goyang = useSharedValue(0);
  const gx = useMemo(() => GOYANG.x.map((v) => v * s), [s]);
  const gy = useMemo(() => GOYANG.y.map((v) => v * s), [s]);

  useEffect(() => {
    goyang.value = withTiming(1, { duration: WAKTU.goyang * TEMPO, easing: Easing.linear });
  }, [goyang]);

  const gaya = useAnimatedStyle(
    () => ({
      transform: [
        { translateX: interpolate(goyang.value, GOYANG.stop, gx) },
        { translateY: interpolate(goyang.value, GOYANG.stop, gy) },
      ],
    }),
    [gx, gy],
  );

  return (
    <Animated.View style={[StyleSheet.absoluteFill, gaya]}>
      <Kilat sisi={1000} s={s} tempo={TEMPO} />
      {KEPINGAN.map((k) => (
        <KepingLogo key={k.points} keping={k} s={s} />
      ))}
      {WAKTU.percik.map((p) => (
        <Percik key={`${p.x}-${p.y}`} {...p} s={s} tempo={TEMPO} />
      ))}
    </Animated.View>
  );
}

/**
 * Satu juring lambang. `clip-path` web jadi `<ClipPath>` SVG, dan seluruh gambar tetap
 * digambar utuh di balik kliping — itulah yang membuat kepingan pas menyatu di akhir.
 */
function KepingLogo({ keping, s }: { keping: Keping; s: number }) {
  const id = idSvg(useId());
  const p = useSharedValue(0);

  useEffect(() => {
    p.value = withDelay(
      keping.delay * TEMPO,
      withTiming(1, { duration: keping.dur * TEMPO, easing: MASUK }),
    );
  }, [keping, p]);

  const gaya = useAnimatedStyle(
    () => ({
      opacity: interpolate(p.value, [0, 0.45], [0, 1], Extrapolation.CLAMP),
      transform: [
        { translateX: interpolate(p.value, [0, 0.86, 1], [keping.tx * s, 0, 0]) },
        { translateY: interpolate(p.value, [0, 0.86, 1], [keping.ty * s, 0, 0]) },
        { rotate: `${interpolate(p.value, [0, 0.86, 1], [keping.rot, 0, 0])}deg` },
        { scale: interpolate(p.value, [0, 0.86, 1], [keping.sc, 1.05, 1]) },
      ],
    }),
    [keping, s],
  );

  const sisi = RIG * s;
  return (
    <Animated.View style={[StyleSheet.absoluteFill, gaya]}>
      <Svg width={sisi} height={sisi} viewBox={`0 0 ${RIG} ${RIG}`}>
        <Defs>
          <ClipPath id={id}>
            <Polygon points={keping.points} />
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

/** Blok tulisan: dua baris kecil, judul, garis, lalu moto. */
function Teks({ s, diam }: { s: number; diam: boolean }) {
  const [judul, setJudul] = useState({ w: 0, h: 0 });

  const baris: TextStyle = {
    fontFamily: typography.sans,
    fontSize: 62 * s,
    fontWeight: '600',
    letterSpacing: 62 * s * 0.2,
    color: '#ffffff',
    textShadowColor: 'rgba(120,255,214,0.45)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 34 * s,
  };

  return (
    <>
      <View style={[teksBlok, { paddingHorizontal: 90 * s, gap: 18 * s }]}>
        {(['PEMERINTAH', 'KABUPATEN'] as const).map((kata, i) => (
          <Naik
            key={kata}
            delay={WAKTU.naik[i].delay}
            dur={WAKTU.naik[i].dur}
            tempo={TEMPO}
            s={s}
            diam={diam}
          >
            <Sorot
              delay={WAKTU.sapu[i].delay}
              dur={WAKTU.sapu[i].dur}
              tempo={TEMPO}
              warna="rgba(190,255,235,0.85)"
              diam={diam}
              style={{ paddingHorizontal: 6 * s, paddingVertical: 2 * s }}
            >
              <Text style={baris}>{kata}</Text>
            </Sorot>
          </Naik>
        ))}

        <Naik delay={WAKTU.naik[2].delay} dur={WAKTU.naik[2].dur} tempo={TEMPO} s={s} diam={diam}>
          <Sorot
            delay={WAKTU.sapu[2].delay}
            dur={WAKTU.sapu[2].dur}
            tempo={TEMPO}
            warna="rgba(255,236,190,0.9)"
            diam={diam}
            style={{ paddingHorizontal: 10 * s, paddingVertical: 6 * s }}
            onUkur={setJudul}
          >
            <Text
              style={{
                fontFamily: typography.sans,
                fontSize: 104 * s,
                fontWeight: '800',
                letterSpacing: 104 * s * 0.015,
                lineHeight: 104 * s * 1.06,
                textAlign: 'center',
                color: '#ffffff',
                textShadowColor: 'rgba(74,222,159,0.55)',
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 46 * s,
              }}
            >
              ACEH BARAT DAYA
            </Text>
            {!diam && judul.w > 0 ? (
              <Pindai lebar={judul.w} tinggi={judul.h} jarak={Math.max(2, 4 * s)} />
            ) : null}
          </Sorot>
        </Naik>

        <Garis s={s} diam={diam} />

        <Naik delay={WAKTU.moto.delay} dur={WAKTU.moto.dur} tempo={TEMPO} s={s} diam={diam}>
          <Text
            style={{
              fontFamily: typography.sans,
              fontSize: 42 * s,
              fontWeight: '500',
              fontStyle: 'italic',
              letterSpacing: 42 * s * 0.06,
              textAlign: 'center',
              color: 'rgba(255,255,255,0.86)',
              textShadowColor: 'rgba(255,196,92,0.35)',
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 26 * s,
            }}
          >
            “Sapeue Kheuen Sahou Langkah”
          </Text>
        </Naik>
      </View>

      <Naik
        delay={WAKTU.jejak.delay}
        dur={WAKTU.jejak.dur}
        tempo={TEMPO}
        s={s}
        diam={diam}
        style={jejakKotak}
      >
        <Text
          style={{
            fontFamily: typography.mono,
            fontSize: Math.max(9, 26 * s),
            letterSpacing: 26 * s * 0.4,
            color: 'rgba(190,220,235,0.55)',
          }}
        >
          ABDYA DIGITAL
        </Text>
      </Naik>
    </>
  );
}

/** Garis pemisah hijau-ke-kuning yang tumbuh dari tengah. */
function Garis({ s, diam }: { s: number; diam: boolean }) {
  const p = useSharedValue(0);

  useEffect(() => {
    if (diam) return;
    p.value = withDelay(
      WAKTU.garis.delay * TEMPO,
      withTiming(1, { duration: WAKTU.garis.dur * TEMPO, easing: Easing.bezier(0.16, 1, 0.3, 1) }),
    );
  }, [diam, p]);

  const gaya = useAnimatedStyle(() => ({ opacity: p.value, transform: [{ scaleX: p.value }] }));

  return (
    <Animated.View style={[{ width: 520 * s, height: Math.max(1, 2 * s) }, diam ? null : gaya]}>
      <LinearGradient
        colors={['rgba(74,222,159,0)', '#4ade9f', '#ffc45c', 'rgba(255,196,92,0)']}
        locations={[0, 0.3, 0.7, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

const dasar = { flex: 1, backgroundColor: '#010306' } as const;

const rigBaris = {
  position: 'absolute',
  left: 0,
  right: 0,
  top: '13%',
  alignItems: 'center',
} as const;

const teksBlok = {
  position: 'absolute',
  left: 0,
  right: 0,
  top: '58.9%',
  alignItems: 'center',
} as const;

const jejakKotak = {
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: '5%',
  alignItems: 'center',
} as const;

const lewatiKotak = {
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: '1.6%',
  alignItems: 'center',
} as const;

const lewatiTeks = { fontFamily: typography.mono, color: 'rgba(190,220,235,0.32)' } as const;
