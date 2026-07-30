import { useEffect, useRef, useState, type RefObject } from 'react';
import type { CameraRef, MapRef } from '@maplibre/maplibre-react-native';
import { Keyboard, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { useTheme } from '@/theme/ThemeProvider';
import { colors } from '@/tokens/tokens';
import { focusPlace } from './camera';
import { geocodeSearch, type GeoPlace } from './geocode';

/** Jeda sebelum permintaan dikirim. Nominatim membatasi ±1 permintaan/detik. */
const DEBOUNCE_MS = 500;

interface MapSearchProps {
  /**
   * Kamera peta yang akan digerakkan. Web memakai `useMap()` dari react-leaflet;
   * MapLibre RN tak menyediakan hook serupa, jadi ref-nya dioper dari pemanggil.
   */
  cam: RefObject<CameraRef | null>;
  map: RefObject<MapRef | null>;
  /**
   * Dipanggil saat sebuah tempat dipilih. Pada peta pemilih titik, ini yang
   * memindahkan pin; pada peta sebaran, dibiarkan kosong — peta hanya bergeser.
   */
  onPick?: (place: GeoPlace) => void;
  placeholder?: string;
}

/**
 * Kotak pencarian tempat di dalam peta — porting `MapSearch.tsx` web.
 *
 * Sumber datanya Nominatim (OpenStreetMap), sama seperti geocode wilayah: tak ada
 * kunci API dan tak ada NIK/data pribadi yang ikut terkirim, hanya kata yang diketik.
 * Gagal-diam: bila layanan luar tak terjangkau, daftar hasil kosong dan peta tetap
 * bisa dipakai dengan tekan-tahan/geser pin.
 *
 * Yang hilang dari versi web dan alasannya: navigasi panah atas/bawah + Enter, serta
 * penandaan baris aktif. Keduanya papan-ketik-dan-tetikus; di ponsel hasilnya
 * disentuh langsung. Penghalang propagasi event Leaflet (`DomEvent`) juga tak perlu —
 * di RN kotak ini anak `View` biasa di atas peta, bukan bagian kanvasnya.
 */
export function MapSearch({
  cam,
  map,
  onPick,
  placeholder = 'Cari tempat atau alamat…',
}: MapSearchProps) {
  const { mode } = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoPlace[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  // Satu pencarian tertunda; ketikan berikutnya membatalkan yang sebelumnya, dan
  // `req` menjaga agar hanya jawaban terbaru yang boleh mengisi daftar.
  const req = useRef(0);
  useEffect(() => {
    const key = query.trim();
    if (key.length < 3) {
      setResults([]);
      setBusy(false);

      return;
    }
    setBusy(true);
    const id = ++req.current;
    const timer = setTimeout(() => {
      void geocodeSearch(key).then((places) => {
        if (id !== req.current) return;
        setResults(places);
        setOpen(true);
        setBusy(false);
      });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  const pick = (place: GeoPlace): void => {
    focusPlace(cam.current, map.current, place);
    onPick?.(place);
    setQuery(place.name.split(',')[0] ?? '');
    setOpen(false);
    Keyboard.dismiss();
  };

  const showList = open && query.trim().length >= 3;

  return (
    // Sisa ruang di kanan atas persis dipakai tombol layar penuh (44dp + jarak).
    <View className="absolute left-3 right-[64px] top-3">
      <View className="justify-center">
        <View pointerEvents="none" className="absolute left-3 z-10">
          <Icon name="search" size={16} color={colors[mode]['text-dim']} />
        </View>
        <TextInput
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          placeholderTextColor={colors[mode]['text-dim']}
          selectionColor={colors[mode].olive}
          accessibilityLabel="Cari tempat di peta"
          returnKeyType="search"
          className="h-11 rounded-xl border border-line bg-surface pl-9 pr-9 font-sans text-[12.5px] text-ink shadow-card"
        />
        {query !== '' && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Kosongkan pencarian"
            onPress={() => {
              setQuery('');
              setResults([]);
              setOpen(false);
            }}
            hitSlop={8}
            className="absolute right-2.5 h-7 w-7 items-center justify-center"
          >
            <Icon name="x" size={14} color={colors[mode]['text-dim']} />
          </Pressable>
        )}
      </View>

      {showList && (
        <View className="mt-1.5 overflow-hidden rounded-xl border border-line bg-surface shadow-pop">
          {busy && <Text className="px-3 py-2.5 font-sans text-[11.5px] text-dim">Mencari…</Text>}
          {!busy && results.length === 0 && (
            <Text className="px-3 py-2.5 font-sans text-[11.5px] text-dim">
              Tidak ada tempat yang cocok.
            </Text>
          )}
          {!busy && results.length > 0 && (
            // Daftar sengaja dibatasi tingginya: di layar pendek hasil enam baris
            // bisa menutupi seluruh peta yang sedang dicari orangnya.
            <ScrollView style={{ maxHeight: 208 }} keyboardShouldPersistTaps="handled">
              {results.map((place, i) => (
                <Pressable
                  key={place.id}
                  accessibilityRole="button"
                  onPress={() => pick(place)}
                  // `last:` tak ada di NativeWind — garis pemisah baris terakhir dilepas manual.
                  className={`px-3 py-2 ${i === results.length - 1 ? '' : 'border-b border-line'}`}
                >
                  <Text numberOfLines={1} className="font-sans text-[12px] font-bold text-ink">
                    {place.name.split(',')[0]}
                  </Text>
                  <Text numberOfLines={1} className="font-sans text-[10.5px] text-dim">
                    {place.name.split(',').slice(1).join(',').trim() || 'Indonesia'}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
}
