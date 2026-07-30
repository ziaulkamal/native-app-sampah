import { del, get, post, put } from './client';
import type { ZoneDto } from './types';

/**
 * Payload zona layanan. Kolom `district_code`/`village_code` sengaja **tidak** lagi
 * dikirim: cakupan wilayah kini jamak dan disimpan lewat `syncAreas`, dan mengirim
 * keduanya akan meninggalkan dua sumber kebenaran yang bisa berbeda isi.
 */
export interface ZoneInput {
  name: string;
  vehicle_type?: string | null;
}

/** Satu baris jadwal angkut. `weekday` 0 = Senin … 6 = Minggu. */
export interface ScheduleInput {
  weekday: number;
  time_start?: string | null;
  time_end?: string | null;
}

/** Zona beserta jadwal, petugas, dan jumlah titik layanannya. */
export const listZones = (): Promise<ZoneDto[]> => get<ZoneDto[]>('/zones');

export const createZone = (input: ZoneInput): Promise<ZoneDto> => post<ZoneDto>('/zones', input);

export const updateZone = (id: string, input: Partial<ZoneInput>): Promise<ZoneDto> =>
  put<ZoneDto>(`/zones/${id}`, input);

/** Ditolak server (ERR_ZONE_IN_USE) bila masih ada titik layanan di dalamnya. */
export const deleteZone = (id: string): Promise<null> => del<null>(`/zones/${id}`);

/** Petugas becak dibatasi tepat satu zona — aturan itu ditegakkan server. */
export const assignOperators = (id: string, userIds: string[]): Promise<ZoneDto> =>
  post<ZoneDto>(`/zones/${id}/operators`, { user_ids: userIds });

export const syncSchedules = (id: string, schedules: ScheduleInput[]): Promise<ZoneDto> =>
  put<ZoneDto>(`/zones/${id}/schedules`, { schedules });

/**
 * Mengganti seluruh cakupan wilayah zona. Daftar kosong sah — itulah cara
 * mengosongkannya. Server menolak cakupan yang bertindih di dalam satu zona
 * (`ERR_AREA_OVERLAP`); tindih antar-zona justru diizinkan.
 */
export const syncAreas = (id: string, codes: string[]): Promise<ZoneDto> =>
  put<ZoneDto>(`/zones/${id}/areas`, { wilayah_codes: codes });
