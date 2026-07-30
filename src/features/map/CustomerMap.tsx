import { useRef, useState } from 'react';
import {
  Camera,
  Map,
  ViewAnnotation,
  type CameraRef,
  type MapRef,
} from '@maplibre/maplibre-react-native';
import { Pressable, Text, View } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { golonganColor, golonganName, LOCATION_KIND } from '@/lib/labels';
import { useApp } from '@/store/AppContext';
import { useTheme } from '@/theme/ThemeProvider';
import { colors } from '@/tokens/tokens';
import type { Customer } from '@/types';
import { useBaseStyle } from './BaseTiles';
import { toLngLat } from './camera';
import { DEFAULT_CENTER } from './mapCenter';
import { FullscreenButton, MapFrame, useMapFullscreen } from './MapFullscreen';
import { MapLegend } from './MapLegend';
import { MapSearch } from './MapSearch';
import { Pin, pinSize, PIN_ANCHOR } from './pinIcon';

const START_ZOOM = 12;

interface CustomerMapProps {
  customers: Customer[];
  className?: string;
  /** Peta menyentuh tepi layar: sudut dan garis tepi kiri-kanan dilepas. */
  bleed?: boolean;
}

/**
 * Peta sebaran titik pelanggan — porting `CustomerMap.tsx` web.
 *
 * `<Popup>` Leaflet diganti kartu di bawah peta, bukan gelembung di atas pin: gelembung
 * setinggi tiga baris menutupi pin-pin di sekitarnya pada layar ponsel, dan menutupnya
 * menuntut ketepatan tap yang tak pantas diminta. Isinya persis sama dengan popup web.
 *
 * Tiap titik digambar sebagai `ViewAnnotation` (satu View asli per pin) karena warnanya
 * datang dari golongan tarif yang bisa ditambah admin kapan saja. Konsekuensinya:
 * peta ini untuk sebaran satu rute/wilayah, bukan ribuan titik sekaligus — lihat PRD §9.
 */
export function CustomerMap({
  customers,
  className = 'h-[540px]',
  bleed = false,
}: CustomerMapProps) {
  const { tariffs } = useApp();
  const { mode } = useTheme();
  const style = useBaseStyle();
  const cam = useRef<CameraRef | null>(null);
  const map = useRef<MapRef | null>(null);
  const { full, toggle } = useMapFullscreen();
  const [selected, setSelected] = useState<Customer | null>(null);

  // Peta di-mount ulang saat masuk/keluar layar penuh, jadi posisi kamera terakhir
  // disimpan sendiri. Sengaja di ref, bukan state: menggeser peta tak boleh memicu
  // render ulang seluruh pin.
  const view = useRef({ center: toLngLat(DEFAULT_CENTER), zoom: START_ZOOM });

  const box = pinSize();
  const active = selected;

  return (
    <MapFrame full={full} onExit={toggle} className={className} bleed={bleed}>
      <Map
        ref={map}
        mapStyle={style}
        logo={false}
        attribution={false}
        style={{ flex: 1 }}
        onPress={() => setSelected(null)}
        onRegionDidChange={(e) => {
          view.current = { center: e.nativeEvent.center, zoom: e.nativeEvent.zoom };
        }}
      >
        <Camera
          ref={cam}
          initialViewState={{ center: view.current.center, zoom: view.current.zoom }}
        />

        {customers.map((c) => (
          <ViewAnnotation
            key={c.id}
            id={c.id}
            lngLat={[c.lng, c.lat]}
            anchor={PIN_ANCHOR}
            onPress={() => setSelected(c)}
          >
            <View style={box}>
              <Pin color={golonganColor(tariffs, c.category)} />
            </View>
          </ViewAnnotation>
        ))}
      </Map>

      {/* Peta sebaran: pencarian hanya menggeser sudut pandang — titik pelanggan
          datang dari data, bukan dari yang diketik di sini. */}
      <MapSearch cam={cam} map={map} placeholder="Cari wilayah atau alamat…" />
      <FullscreenButton full={full} onToggle={toggle} />

      {active === null ? (
        <MapLegend />
      ) : (
        <View className="absolute inset-x-3 bottom-3 rounded-xl2 border border-line bg-surface p-3 shadow-pop">
          <View className="flex-row items-start gap-2">
            <View className="flex-1">
              <Text className="font-sans text-[13px] font-bold text-ink">{active.name}</Text>
              <Text className="font-sans text-[11px] text-dim">{active.label}</Text>
              <Text className="mt-0.5 font-sans text-[11px] text-dim">{active.address}</Text>
              <Text className="mt-1.5 font-sans text-[11px]">
                <Text
                  style={{ color: golonganColor(tariffs, active.category) }}
                  className="font-semibold"
                >
                  {golonganName(tariffs, active.category)}
                </Text>
                <Text className="text-dim"> · {LOCATION_KIND[active.kind]}</Text>
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tutup keterangan titik"
              onPress={() => setSelected(null)}
              hitSlop={8}
              className="h-7 w-7 items-center justify-center rounded-lg bg-pill"
            >
              <Icon name="x" size={14} color={colors[mode].text} />
            </Pressable>
          </View>
        </View>
      )}
    </MapFrame>
  );
}
