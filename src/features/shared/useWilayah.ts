import { useEffect, useState } from 'react';
import * as misc from '@/api/misc';
import type { WilayahDto } from '@/api/types';
import type { DataState } from '@/types';

/** Kecamatan & desa di bawah wilayah operasional dinas, seluruhnya dari server. */
export interface WilayahOptions {
  districts: WilayahDto[];
  villages: WilayahDto[];
  state: DataState;
}

/** Cadangan terakhir: Provinsi Aceh → Kabupaten Aceh Barat Daya. */
const DEFAULT_COVERAGE = { province: '11', regency: '11.12' };

/**
 * Kecamatan & desa untuk form titik layanan — porting `features/admin/useWilayah.ts` web.
 *
 * Yang ikut ke sini hanya jenjang kecamatan→desa. Kaskade empat jenjang milik web
 * dipakai layar Super Admin yang memang tinggal di web, jadi memindahkannya berarti
 * membawa kode yang tak punya pemanggil.
 */
export function useWilayah(districtCode: string): WilayahOptions {
  const [districts, setDistricts] = useState<WilayahDto[]>([]);
  const [villages, setVillages] = useState<WilayahDto[]>([]);
  const [state, setState] = useState<DataState>('loading');

  useEffect(() => {
    let alive = true;
    void loadDistricts()
      .then((list) => {
        if (!alive) return;
        setDistricts(list);
        setState(list.length === 0 ? 'empty' : 'normal');
      })
      .catch(() => alive && setState('error'));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (districtCode === '') {
      setVillages([]);
      return;
    }
    let alive = true;
    void misc
      .listChildren(districtCode)
      .then((list) => alive && setVillages(list))
      .catch(() => alive && setVillages([]));
    return () => {
      alive = false;
    };
  }, [districtCode]);

  return { districts, villages, state };
}

/**
 * Cakupan kerja dinas: pengaturan server dulu, bawaan di atas sebagai cadangan.
 * `/settings` boleh saja ditolak untuk pelanggan — karena itu galatnya ditelan,
 * bukan diteruskan: form tetap harus bisa dipakai.
 */
async function loadDistricts(): Promise<WilayahDto[]> {
  const settings = await misc.readSettings().catch(() => ({}) as Record<string, unknown>);
  const stored = settings.regency_code;
  const regency = typeof stored === 'string' && stored !== '' ? stored : DEFAULT_COVERAGE.regency;

  return misc.listChildren(regency);
}
