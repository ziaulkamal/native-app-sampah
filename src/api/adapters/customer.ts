import type { Customer, CustomerStatus, LocationKind, OperatorInfo } from '@/types';
import type { PeopleDto, ServiceLocationDto, UserDto } from '../types';
import { toVehicleType } from './catalog';

/**
 * Satu pelanggan bisa punya beberapa titik layanan (rumah + usaha), dan yang ditagih
 * adalah titiknya. Karena itu tiap titik dipetakan jadi satu baris `Customer`,
 * membawa serta nama pemiliknya. Pendaftar tanpa titik layanan belum bisa ditagih,
 * tapi tetap ditampilkan agar antrean verifikasi tidak terlihat kosong.
 */
export function toCustomers(people: PeopleDto[]): Customer[] {
  return people.flatMap((person) =>
    (person.locations ?? []).length === 0
      ? [withoutLocation(person)]
      : (person.locations ?? []).map((location) => merge(person, location)),
  );
}

function merge(person: PeopleDto, location: ServiceLocationDto): Customer {
  return {
    id: location.id,
    peopleId: person.id,
    name: person.full_name,
    label: location.label,
    address: composeAddress(location.address, location.rt, location.rw),
    zoneId: location.zone_id ?? '',
    villageCode: location.village_code ?? '',
    districtCode: location.district_code ?? '',
    category: location.category?.id ?? '',
    // Nama golongan usulan hanya ikut bila server memuat relasinya; tanpa nama, usulan
    // itu tak bisa ditampilkan sebagai apa pun yang berarti, jadi dianggap tak ada.
    requestedCategory:
      location.requested_category_id != null && location.requested_category_name != null
        ? { id: location.requested_category_id, name: location.requested_category_name }
        : null,
    kind: location.location_kind as LocationKind,
    status: toCustomerStatus(person.status),
    locationStatus: location.status,
    tariff: location.category?.amount ?? 0,
    lat: location.latitude ?? 0,
    lng: location.longitude ?? 0,
    // Dibiarkan `undefined` bila server tak mengirimnya: daftar tanpa `?with=locations`
    // tidak memuat relasi ini, dan `[]` di sana akan terbaca sebagai "tak ada petugas".
    operators: location.operators,
    phone: person.phone_number ?? undefined,
  };
}

/** Baris untuk pendaftar yang belum punya titik layanan; id memakai penanda orang. */
function withoutLocation(person: PeopleDto): Customer {
  return {
    id: `people:${person.id}`,
    peopleId: person.id,
    name: person.full_name,
    label: 'Belum ada titik layanan',
    address: person.street_address ?? '',
    zoneId: '',
    villageCode: '',
    districtCode: '',
    category: '',
    requestedCategory: null,
    kind: 'rumah',
    status: toCustomerStatus(person.status),
    // Tak ada titik, jadi tak ada status titik: dibiarkan kosong alih-alih meminjam
    // status orangnya, yang akan membuat baris ini tampak seperti pengajuan yang menunggu.
    locationStatus: '',
    tariff: 0,
    lat: 0,
    lng: 0,
    phone: person.phone_number ?? undefined,
  };
}

/**
 * Status server lebih rinci daripada yang ditampilkan UI, tapi batas antara
 * "belum ditinjau admin" dan "sudah ditinjau lalu dimatikan" WAJIB terjaga: layar
 * Persetujuan hanya boleh berisi yang pertama, layar Pelanggan hanya yang kedua.
 * `draft` disamakan dengan `pending_verification` — sama-sama menunggu admin.
 */
export function toCustomerStatus(status: string): CustomerStatus {
  if (status === 'active') return 'aktif';
  if (status === 'suspended') return 'ditangguhkan';
  if (status === 'inactive') return 'nonaktif';
  return 'menunggu';
}

/** Akun petugas → OperatorInfo. Cakupan wilayah menggantikan target rupiah. */
export function toOperator(user: UserDto): OperatorInfo {
  return {
    id: user.id,
    name: user.name,
    phone: user.phone ?? '',
    vehicleType: toVehicleType(user.vehicle_type) ?? 'mobil',
    accountSynced: user.status === 'active',
    username: user.username ?? undefined,
    zonesCount: user.zones_count ?? 0,
    servicePointsCount: user.service_points_count ?? 0,
  };
}

function composeAddress(address: string | null, rt: string | null, rw: string | null): string {
  const base = address ?? '';
  if (rt === null && rw === null) return base;
  return `${base}, RT ${rt ?? '-'}/RW ${rw ?? '-'}`;
}
