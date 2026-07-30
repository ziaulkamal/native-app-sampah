import { toFeatureKeys } from '@/lib/permissions';
import type { Role, Session, VehicleType } from '@/types';
import type { UserDto } from '../types';

/** Level backend → role UI. Satu-satunya tempat konversi ini boleh terjadi. */
export function roleFromLevel(level: number): Role {
  if (level <= 1) return 'admin';
  if (level === 2) return 'operator';
  return 'pelanggan';
}

/** DTO akun → sesi domain. */
export function toSession(user: UserDto): Session {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    phone: user.phone,
    email: user.email,
    role: roleFromLevel(user.level),
    level: user.level,
    isSuperAdmin: user.is_super_admin,
    // Dibandingkan dengan `true`, bukan dicoerce: field ini opsional di DTO, dan
    // sesi lama dari server yang belum mengirimnya harus jatuh ke "bukan".
    isEnvSuperAdmin: user.is_env_super_admin === true,
    permissions: toFeatureKeys(user.permissions),
    peopleId: user.people_id,
    avatarUrl: user.avatar_url ?? null,
    vehicleType: toVehicleType(user.vehicle_type),
  };
}

function toVehicleType(value: string | null | undefined): VehicleType | undefined {
  return value === 'mobil' || value === 'becak' ? value : undefined;
}
