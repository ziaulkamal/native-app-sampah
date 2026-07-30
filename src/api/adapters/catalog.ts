import type { BillingScheme, Tariff, VehicleType, Weekday, Zone } from '@/types';
import type { CategoryDto, ZoneDto, ZoneScheduleDto } from '../types';

/** Warna cadangan bila golongan belum diberi warna peta oleh admin. */
const FALLBACK_COLOR = '#5A6A1E';

/** Urutan hari mengikuti konvensi server: 0 = Senin … 6 = Minggu. */
const WEEKDAYS: Weekday[] = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'];

/** Golongan retribusi → Tariff domain. */
export function toTariff(dto: CategoryDto): Tariff {
  return {
    id: dto.id,
    name: dto.name,
    amount: dto.amount,
    scheme: dto.scheme as BillingScheme,
    cycleId: dto.billing_cycle_id ?? '',
    cycleName: dto.billing_cycle?.name ?? '',
    description: dto.description ?? '',
    color: dto.map_color ?? FALLBACK_COLOR,
  };
}

/** Zona + jadwal + petugas → Zone domain. */
export function toZone(dto: ZoneDto): Zone {
  return {
    id: dto.id,
    name: dto.name,
    areas: (dto.areas ?? []).map((area) => ({
      code: area.kode,
      name: area.nama,
      // Jenjang di luar kecamatan/desa ditolak server, jadi apa pun selain 2 dibaca
      // sebagai desa daripada memaksakan tipe yang lebih longgar ke seluruh aplikasi.
      level: area.level === 2 ? 2 : 3,
    })),
    areaLabel: dto.area_label ?? '',
    operatorIds: (dto.operators ?? []).map((o) => o.id),
    schedule: {
      days: (dto.schedules ?? []).map(toWeekday).filter((d): d is Weekday => d !== null),
      timeWindow: timeWindow(dto.schedules ?? []),
    },
    customerCount: dto.locations_count ?? 0,
  };
}

/** Armada zona; nilai tak dikenal dianggap kosong daripada dipaksa jadi salah satu. */
export function toVehicleType(value: string | null | undefined): VehicleType | undefined {
  return value === 'mobil' || value === 'becak' ? value : undefined;
}

function toWeekday(schedule: ZoneScheduleDto): Weekday | null {
  return WEEKDAYS[schedule.weekday] ?? null;
}

/**
 * UI menampilkan satu rentang jam untuk seluruh hari, sedangkan server membolehkan
 * jam berbeda per hari. Ambil jam hari pertama; perbedaan antar hari belum ditampilkan.
 */
function timeWindow(schedules: ZoneScheduleDto[]): string | undefined {
  const first = schedules.find((s) => s.time_start !== null && s.time_end !== null);
  if (first === undefined) return undefined;
  return `${trim(first.time_start)} – ${trim(first.time_end)}`;
}

/** `06:00:00` → `06.00`, bentuk yang dipakai di seluruh layar. */
function trim(time: string | null): string {
  return (time ?? '').slice(0, 5).replace(':', '.');
}

/** Weekday domain → index server (0 = Senin). -1 bila tidak dikenali. */
export const weekdayIndex = (day: Weekday): number => WEEKDAYS.indexOf(day);

/** `06.00 – 09.00` → `['06:00', '09:00']`; null bila rentangnya tidak diisi. */
export function splitTimeWindow(window: string | undefined): [string, string] | null {
  if (window === undefined || window.trim() === '') return null;
  const [start, end] = window.split('–').map((part) => part.trim().replace('.', ':'));
  return start === undefined || end === undefined || end === '' ? null : [start, end];
}
