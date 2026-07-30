import type { Customer } from '@/types';

/**
 * Satu pelanggan beserta seluruh titik layanannya. `customers` di store adalah
 * daftar per-titik, jadi orang dengan tiga lokasi muncul tiga kali; bentuk ini
 * mengembalikannya menjadi satu baris per orang.
 */
export interface PersonRow {
  peopleId: string;
  name: string;
  phone?: string;
  /** Status menempel pada orang, bukan titik — seluruh titiknya berbagi nilai ini. */
  status: Customer['status'];
  /**
   * Titik layanan milik orang ini. **Boleh kosong**: pendaftar yang belum
   * diverifikasi belum punya titik, dan ia tetap harus terlihat di antrean.
   */
  locations: Customer[];
  /** Total tarif seluruh titik per periode (Rupiah). */
  totalTariff: number;
  /** Ada titik yang belum diberi golongan, jadi belum bisa ditagih. */
  hasUnverified: boolean;
}

/** Baris `Customer` yang sebenarnya penanda orang tanpa titik layanan. */
export function isPlaceholder(customer: Customer): boolean {
  return customer.id.startsWith('people:');
}

/**
 * Titik yang belum ditinjau dinas — pengajuan pelanggan maupun titik baru buatan loket.
 *
 * Membaca status **titiknya**, bukan `PersonRow.status` di atas: pelanggan yang sudah
 * aktif tetap bisa mengajukan titik kedua, dan titik itulah yang masih menunggu.
 */
export function isPendingLocation(location: Customer): boolean {
  return location.locationStatus === 'pending_verification';
}

/**
 * Kelompokkan daftar per-titik menjadi satu baris per orang, urutan orang
 * mengikuti kemunculan pertamanya supaya urutan dari server tetap terjaga.
 */
export function groupByPeople(customers: Customer[]): PersonRow[] {
  const rows = new Map<string, PersonRow>();

  for (const customer of customers) {
    let row = rows.get(customer.peopleId);
    if (row === undefined) {
      row = {
        peopleId: customer.peopleId,
        name: customer.name,
        phone: customer.phone,
        status: customer.status,
        locations: [],
        totalTariff: 0,
        hasUnverified: false,
      };
      rows.set(customer.peopleId, row);
    }

    // Baris penanda bukan titik layanan sungguhan — ia hanya menahan tempat bagi
    // orang tanpa lokasi, jadi tidak boleh ikut terhitung sebagai satu titik.
    if (isPlaceholder(customer)) continue;

    row.locations.push(customer);
    row.totalTariff += customer.tariff;
    if (customer.category === '') row.hasUnverified = true;
  }

  return [...rows.values()];
}

/**
 * Pencarian menjangkau nama, telepon, dan alamat **tiap** titik: mencari nama
 * jalan salah satu lokasi harus tetap memunculkan pemiliknya.
 */
export function matchesQuery(row: PersonRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (q === '') return true;
  if (row.name.toLowerCase().includes(q)) return true;
  if ((row.phone ?? '').toLowerCase().includes(q)) return true;
  return row.locations.some(
    (l) => l.address.toLowerCase().includes(q) || l.label.toLowerCase().includes(q),
  );
}
