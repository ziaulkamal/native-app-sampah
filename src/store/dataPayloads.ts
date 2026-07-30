import * as categories from '@/api/categories';
import * as customers from '@/api/customers';
import * as misc from '@/api/misc';
import type { PayMethodDto } from '@/api/payments';
import * as zones from '@/api/zones';
import { splitTimeWindow, weekdayIndex } from '@/api/adapters/catalog';
import type { Session, Tariff } from '@/types';
import type { NewCustomer, NewOperator, NewZone, SettableStatus } from './dataTypes';
import type { PayOpts } from './types';

/**
 * Penerjemah bentuk klien → bentuk server, plus dua alur yang menjahit beberapa
 * endpoint jadi satu aksi. Semuanya bebas state: tak menyentuh `set` maupun sesi
 * kecuali yang diserahkan sebagai argumen, jadi bisa dibaca dan diuji sendiri.
 */

/**
 * Pelanggan + titik pertamanya dibuat berurutan. Golongan ikut sejak awal bila admin
 * sudah memilihnya di form; bersama zona, server langsung memverifikasi titiknya.
 */
export async function createCustomer(input: NewCustomer): Promise<void> {
  const person = await customers.createPerson(input.person);
  await customers.createLocation(person.id, {
    label: input.location.label,
    category_id: blankToNull(input.location.categoryId),
    address: input.location.address,
    village_code: blankToNull(input.location.villageCode),
    zone_id: blankToNull(input.location.zoneId),
    latitude: input.location.lat ?? null,
    longitude: input.location.lng ?? null,
  });
}

/** String kosong berarti "tidak diisi", bukan nilai — server mengharapkan null. */
export const blankToNull = (value: string | undefined): string | null =>
  value === undefined || value === '' ? null : value;

/**
 * Petugas mencatat tunai lapangan; pelanggan mengajukan transfer, QRIS, atau **bayar
 * lewat petugas** (§10.2).
 *
 * `tunai_petugas` yang dipilih pelanggan tidak langsung sah — server melahirkannya
 * menunggu konfirmasi petugas. Yang membedakan keduanya bukan metode di sini,
 * melainkan siapa aktornya.
 */
export function methodOf(opts: PayOpts | undefined, session: Session | null): PayMethodDto {
  if (opts?.method === 'qris') return 'qris';
  if (opts?.method === 'transfer') return 'transfer_manual';
  if (opts?.method === 'tunai') return 'tunai_petugas';

  return session?.role === 'operator' ? 'tunai_petugas' : 'tunai_kantor';
}

/**
 * Server memakai penamaan Inggris yang sama maknanya. `menunggu` sengaja di luar
 * jangkauan: mengembalikan orang ke antrean persetujuan bukan sakelar status biasa
 * (butuh alasan + pemberitahuan, lihat PLAN §8), jadi tipenya yang menolaknya.
 */
export function toServerStatus(status: SettableStatus): string {
  if (status === 'aktif') return 'active';
  return status === 'ditangguhkan' ? 'suspended' : 'inactive';
}

/**
 * Satu zona tersimpan lewat tiga endpoint: identitasnya, penugasan petugas, lalu
 * jadwal angkut. Dijalankan berurutan supaya kegagalan di tengah tetap terlaporkan.
 */
export async function saveZone(id: string | null, input: Partial<NewZone>): Promise<void> {
  const zone =
    id === null
      ? await zones.createZone(toZoneInput(input))
      : await zones.updateZone(id, toZoneInput(input));

  // Cakupan disimpan lebih dulu: penugasan petugas dan filter dasbor keduanya
  // bertumpu padanya, jadi zona yang sempat ada tanpa cakupan adalah zona yang
  // untuk sesaat tidak menaungi siapa pun.
  if (input.areaCodes !== undefined) await zones.syncAreas(zone.id, input.areaCodes);
  if (input.operatorIds !== undefined) await zones.assignOperators(zone.id, input.operatorIds);
  if (input.days !== undefined) await zones.syncSchedules(zone.id, toSchedules(input));
}

/** Satu rentang jam berlaku untuk semua hari terpilih — sesuai bentuk formnya. */
function toSchedules(input: Partial<NewZone>): zones.ScheduleInput[] {
  const range = splitTimeWindow(input.timeWindow);
  return (input.days ?? []).map((day) => ({
    weekday: weekdayIndex(day),
    time_start: range?.[0] ?? null,
    time_end: range?.[1] ?? null,
  }));
}

/**
 * Golongan → payload server. `billing_cycle_id` yang menang bila terisi; server
 * menurunkan `scheme` darinya, jadi dua nilai yang bertentangan tidak pernah tersimpan
 * berdampingan.
 */
export function toCategoryInput(
  input: Partial<Omit<Tariff, 'id' | 'color'>>,
): Partial<categories.CategoryInput> {
  return {
    name: input.name,
    amount: input.amount,
    scheme: input.scheme,
    billing_cycle_id: input.cycleId === undefined || input.cycleId === '' ? null : input.cycleId,
    description: input.description,
  };
}

function toZoneInput(input: Partial<NewZone>): zones.ZoneInput {
  return {
    name: input.name ?? '',
    vehicle_type: input.vehicleType ?? null,
  };
}

export function toUserInput(input: Partial<NewOperator>): Partial<misc.UserInput> {
  return {
    name: input.name,
    username: input.username,
    password: input.password,
    phone: input.phone,
    vehicle_type: input.vehicleType,
    role_id: input.roleId,
  };
}

/**
 * Akun petugas butuh `role_id`, sedangkan nama role bebas diubah Super Admin.
 * Karena itu id-nya dicari lewat level (2 = petugas), bukan dicocokkan namanya.
 */
export async function createOperator(input: NewOperator): Promise<void> {
  const roleId = input.roleId ?? (await misc.findRoleIdByLevel(2));
  await misc.createUser({
    name: input.name,
    username: input.username,
    password: input.password,
    phone: input.phone,
    vehicle_type: input.vehicleType,
    role_id: roleId,
  });
}
