import { useEffect, useRef } from 'react';
import {
  Camera,
  Map,
  ViewAnnotation,
  type CameraRef,
  type MapRef,
} from '@maplibre/maplibre-react-native';
import { Text, View } from 'react-native';
import { useBaseStyle } from './BaseTiles';
import { focusArea, toLngLat } from './camera';
import type { MapFocus } from './geocode';
import { FullscreenButton, MapFrame, useMapFullscreen } from './MapFullscreen';
import { MapSearch } from './MapSearch';
import { Pin, pinSize, PIN_ANCHOR } from './pinIcon';

export interface LatLng {
  lat: number;
  lng: number;
}

interface MapPickerProps {
  value: LatLng;
  /**
   * Tanpa `onChange`, peta ini jadi **pratinjau**: pin tak bisa digeser, tekan-tahan
   * tak memindahkannya, dan kotak pencarian tak muncul. Satu properti yang menentukan
   * keduanya, bukan `readOnly` terpisah — dua sakelar yang bisa saling bertentangan
   * cepat atau lambat akan bertentangan.
   */
  onChange?: (v: LatLng) => void;
  /** Warna pin (mengikuti kategori titik). */
  color?: string;
  className?: string;
  /**
   * Fokus area terpilih (kecamatan/desa): kotak batas + zoom minimum. Saat berubah,
   * peta memuat area lalu diperdalam ke `minZoom`. Tidak menggeser pin — hanya sudut
   * pandang.
   */
  focus?: MapFocus | null;
  /** Peta menyentuh tepi layar: sudut dan garis tepi kiri-kanan dilepas. */
  bleed?: boolean;
}

const START_ZOOM = 15;

/**
 * Peta pemilih titik — porting `MapPicker.tsx` web.
 *
 * Satu beda perilaku yang disengaja: web menaruh pin dengan **klik**, di sini dengan
 * **tekan-tahan**. Di ponsel seluruh kanvas adalah area geser; tap tunggal terlalu
 * mudah terpicu di akhir gerakan menggeser, dan pin akan melompat ke tempat yang tak
 * dimaksud. Menggeser pin langsung tetap ada, sama seperti web.
 */
export function MapPicker({
  value,
  onChange,
  color = '#5A6A1E',
  className = 'h-[260px]',
  focus,
  bleed = false,
}: MapPickerProps) {
  const style = useBaseStyle();
  const cam = useRef<CameraRef | null>(null);
  const map = useRef<MapRef | null>(null);
  const { full, toggle } = useMapFullscreen();
  const editable = onChange !== undefined;

  // Pusatkan peta saat koordinat berubah — termasuk saat diisi manual lewat input
  // koordinat di formulir, yang tak menyentuh peta sama sekali.
  useEffect(() => {
    cam.current?.easeTo({ center: [value.lng, value.lat], duration: 300 });
  }, [value.lat, value.lng]);

  useEffect(() => {
    if (focus === undefined || focus === null) return;
    focusArea(cam.current, map.current, focus);
  }, [focus]);

  const box = pinSize();

  return (
    <MapFrame full={full} onExit={toggle} className={className} bleed={bleed}>
      <Map
        ref={map}
        mapStyle={style}
        logo={false}
        attribution={false}
        style={{ flex: 1 }}
        onLongPress={(e) => {
          if (!editable) return;
          const [lng, lat] = e.nativeEvent.lngLat;
          onChange({ lat, lng });
        }}
      >
        {/* `initialViewState` hanya berlaku saat mount: setelah itu kamera digerakkan
            lewat ref, jadi menggeser peta tak dibatalkan oleh render berikutnya. */}
        <Camera ref={cam} initialViewState={{ center: toLngLat(value), zoom: START_ZOOM }} />

        <ViewAnnotation
          id="pin"
          lngLat={[value.lng, value.lat]}
          anchor={PIN_ANCHOR}
          draggable={editable}
          onDragEnd={(e) => {
            const [lng, lat] = e.nativeEvent.lngLat;
            onChange?.({ lat, lng });
          }}
        >
          <View style={box}>
            <Pin color={color} />
          </View>
        </ViewAnnotation>
      </Map>

      {/* Mencari tempat sekaligus menaruh pin di sana: hasil pencarian adalah
          koordinat, dan itulah yang sedang diisi form ini. Pada pratinjau kotak ini
          hilang — mencari tempat yang lalu tak bisa dipilih hanya membingungkan. */}
      {editable && (
        <MapSearch cam={cam} map={map} onPick={(p) => onChange({ lat: p.lat, lng: p.lng })} />
      )}
      <FullscreenButton full={full} onToggle={toggle} />

      {editable && (
        <View className="absolute inset-x-3 bottom-3 rounded-xl border border-line bg-surface px-3 py-2 shadow-card">
          <Text className="font-sans text-[11px] text-dim">
            Tekan-tahan peta untuk menaruh titik, atau geser pinnya.
          </Text>
        </View>
      )}
    </MapFrame>
  );
}
