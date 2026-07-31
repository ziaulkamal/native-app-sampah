import { useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Text, View } from 'react-native';
import { listCategoryOptions } from '@/api/categories';
import { myLocations } from '@/api/customers';
import type { CategoryOptionDto, ServiceLocationDto } from '@/api/types';
import { ScreenScaffold } from '@/components/layout/ScreenScaffold';
import { SubScreenHeader } from '@/components/layout/SubScreenHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SelectField, TextareaField, TextField } from '@/components/ui/FormField';
import { AREA_ZOOM, geocodeBounds, type MapFocus } from '@/features/map/geocode';
import { DEFAULT_CENTER, readMapCenter } from '@/features/map/mapCenter';
import { MapPicker, type LatLng } from '@/features/map/MapPicker';
import { useWilayah } from '@/features/shared/useWilayah';
import { useApp } from '@/store/AppContext';

const MARKER_COLOR = '#5A6A1E';

/**
 * Pengajuan titik layanan tambahan oleh pelanggan (PLAN §8, diperluas §16.1, §31).
 *
 * Zona TIDAK diisi di sini, dan golongan hanya **diusulkan**: penetapannya tetap
 * wewenang admin saat verifikasi. Karena itu daftar golongannya diambil dari
 * `/categories/options` yang memang tak memuat tarif.
 *
 * Web membungkusnya sebagai dialog; di sini ia layar penuh di dalam tumpukan Beranda —
 * peta setinggi 260dp di dalam dialog ponsel terlalu sempit untuk menaruh pin.
 */
export function TambahLokasi() {
  const { requestLocation } = useApp();
  const nav = useNavigation();
  const [rows, setRows] = useState<ServiceLocationDto[]>([]);
  const [cats, setCats] = useState<CategoryOptionDto[]>([]);
  const [label, setLabel] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [address, setAddress] = useState('');
  const [districtCode, setDistrictCode] = useState('');
  const [villageCode, setVillageCode] = useState('');
  const [coord, setCoord] = useState<LatLng>(DEFAULT_CENTER);
  const [focus, setFocus] = useState<MapFocus | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const { districts, villages } = useWilayah(districtCode);

  // Hanya hasil geocode terakhir yang boleh menang: memilih desa cepat berturut-turut
  // tidak boleh membuat kotak batas lama menimpa yang baru saat jaringan lambat.
  const geoReq = useRef(0);

  useEffect(() => {
    void myLocations()
      .then(setRows)
      .catch(() => setRows([]));
    // Golongan dimuat saat layar dibuka, bukan saat aplikasi start: daftarnya jarang
    // berubah tapi hanya dibutuhkan di sini.
    void listCategoryOptions()
      .then(setCats)
      .catch(() => setCats([]));
    // Titik awal peta dari pengaturan dinas; pin dimulai di sana lalu digeser pelanggan.
    void readMapCenter()
      .then(setCoord)
      .catch(() => setCoord(DEFAULT_CENTER));
  }, []);

  async function focusOn(query: string, minZoom: number): Promise<void> {
    const id = ++geoReq.current;
    const box = await geocodeBounds(query);
    if (id === geoReq.current) setFocus(box ? { bounds: box, minZoom } : null);
  }

  const onDistrict = (code: string) => {
    setDistrictCode(code);
    setVillageCode(''); // Desa lama tak lagi masuk akal begitu kecamatannya diganti.
    const nama = districts.find((d) => d.kode === code)?.nama ?? '';
    if (nama !== '') void focusOn(`${nama}, Indonesia`, AREA_ZOOM.district);
    else setFocus(null);
  };

  const onVillage = (code: string) => {
    setVillageCode(code);
    const desa = villages.find((v) => v.kode === code)?.nama ?? '';
    const kec = districts.find((d) => d.kode === districtCode)?.nama ?? '';
    // Desa lebih dalam dari kecamatan.
    if (desa !== '')
      void focusOn([desa, kec, 'Indonesia'].filter((s) => s !== '').join(', '), AREA_ZOOM.village);
  };

  const canSend = label.trim() !== '' && address.trim() !== '';

  const send = async () => {
    if (!canSend) return;
    setBusy(true);
    const outcome = await requestLocation({
      label: label.trim(),
      requestedCategoryId: categoryId === '' ? undefined : categoryId,
      address: address.trim(),
      villageCode: villageCode === '' ? undefined : villageCode,
      lat: coord.lat,
      lng: coord.lng,
    });
    setBusy(false);

    // Kegagalan sudah tampil sebagai dialog dari store; isian dibiarkan utuh.
    if (outcome === null) {
      setSent(true);
      void myLocations()
        .then(setRows)
        .catch(() => undefined);
    }
  };

  return (
    <ScreenScaffold>
      <SubScreenHeader title="Titik Layanan Saya" />

      <View>
        <Text className="mb-2 text-[13px] font-bold text-ink">Titik yang sudah ada</Text>
        {rows.length === 0 ? (
          <Text className="text-[12px] text-dim">Belum ada titik layanan terdaftar.</Text>
        ) : (
          rows.map((row, i) => (
            <View
              key={row.id}
              className={`flex-row items-center gap-3 py-2 ${
                i === rows.length - 1 ? '' : 'border-b border-line'
              }`}
            >
              <View className="flex-1">
                <Text className="text-[13px] font-semibold text-ink" numberOfLines={1}>
                  {row.label}
                </Text>
                <Text className="text-[11.5px] text-dim" numberOfLines={1}>
                  {row.address}
                </Text>
              </View>
              <Badge
                label={row.status === 'active' ? 'AKTIF' : 'MENUNGGU'}
                tone={row.status === 'active' ? 'success' : 'warning'}
              />
            </View>
          ))
        )}
      </View>

      {sent ? (
        <>
          <Text className="rounded-xl bg-success/10 px-4 py-3 text-[12.5px] text-ink">
            Pengajuan terkirim. Petugas dinas akan memeriksanya, lalu menetapkan golongan tarif dan
            zona layanannya — tagihan baru terbit setelah itu.
          </Text>
          <Button label="Tutup" onPress={() => nav.goBack()} full />
        </>
      ) : (
        <View className="gap-3 border-t border-line pt-4">
          <Text className="text-[13px] font-bold text-ink">Ajukan titik baru</Text>

          <TextField
            label="Nama titik"
            value={label}
            onChangeText={setLabel}
            placeholder="mis. Warung Depan"
          />
          <SelectField
            label="Golongan yang diajukan"
            options={[
              { value: '', label: '— Pilih golongan —' },
              ...cats.map((c) => ({ value: c.id, label: c.name })),
            ]}
            value={categoryId}
            onChange={setCategoryId}
          />

          <TextareaField
            label="Alamat"
            value={address}
            onChangeText={setAddress}
            placeholder="Jl. …, RT/RW"
          />

          <SelectField
            label="Kecamatan"
            options={[
              { value: '', label: '— Pilih kecamatan —' },
              ...districts.map((d) => ({ value: d.kode, label: d.nama })),
            ]}
            value={districtCode}
            onChange={onDistrict}
          />
          <SelectField
            label="Desa / Kelurahan"
            options={[
              { value: '', label: districtCode === '' ? 'Pilih kecamatan dulu' : '— Pilih desa —' },
              ...villages.map((v) => ({ value: v.kode, label: v.nama })),
            ]}
            value={villageCode}
            onChange={onVillage}
            disabled={districtCode === ''}
          />

          <View>
            <Text className="mb-1.5 text-[12.5px] font-semibold text-ink">Titik lokasi</Text>
            {/* Peta hidup di dalam layar yang ikut digulir; untuk menaruh pin dengan
                teliti pakai tombol layar penuh di pojok petanya. */}
            <MapPicker
              value={coord}
              onChange={setCoord}
              color={MARKER_COLOR}
              focus={focus}
              className="h-[260px] rounded-xl"
            />
            <View className="mt-3 flex-row gap-3">
              <View className="flex-1">
                <TextField
                  label="Latitude"
                  keyboardType="numeric"
                  value={String(coord.lat)}
                  onChangeText={(v) => setCoord((c) => ({ ...c, lat: Number(v) || 0 }))}
                />
              </View>
              <View className="flex-1">
                <TextField
                  label="Longitude"
                  keyboardType="numeric"
                  value={String(coord.lng)}
                  onChangeText={(v) => setCoord((c) => ({ ...c, lng: Number(v) || 0 }))}
                />
              </View>
            </View>
            <Text className="mt-1.5 text-[11px] text-dim">
              Pilih kecamatan/desa untuk mengarahkan peta, lalu geser pin atau tekan-tahan untuk
              menaruh titik.
            </Text>
          </View>

          <Text className="text-[11.5px] text-dim">
            Golongan di atas hanya usulan Anda. Golongan tarif final dan zona layanan ditetapkan
            petugas dinas saat pengajuan diperiksa.
          </Text>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Button label="Batal" variant="ghost" full onPress={() => nav.goBack()} />
            </View>
            <View className="flex-1">
              <Button
                label={busy ? 'Mengirim…' : 'Ajukan'}
                full
                disabled={!canSend || busy}
                onPress={() => void send()}
              />
            </View>
          </View>
        </View>
      )}
    </ScreenScaffold>
  );
}
