/**
 * Format tanggal Indonesia dari tanggal ISO server. Sengaja memotong string, bukan
 * `new Date()`, supaya zona waktu browser tidak menggeser tanggal ke hari sebelumnya.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

/** `2026-07-01…` → `Jul 2026`. String kosong bila tanggalnya tidak ada. */
export function formatPeriod(iso: string | null | undefined): string {
  const parts = split(iso);
  return parts === null ? '' : `${MONTHS[parts.month - 1]} ${parts.year}`;
}

/** `2026-07-20…` → `20 Jul 2026`. String kosong bila tanggalnya tidak ada. */
export function formatDate(iso: string | null | undefined): string {
  const parts = split(iso);
  return parts === null ? '' : `${parts.day} ${MONTHS[parts.month - 1]} ${parts.year}`;
}

/** Bulan dasar `Jul 2026` → `2026-07-01`, bentuk yang diminta endpoint penerbitan tagihan. */
export function periodToIso(period: string): string {
  const [month, year] = period.split(' ');
  const index = MONTHS.indexOf(month);
  return index < 0 ? period : `${year}-${String(index + 1).padStart(2, '0')}-01`;
}

/**
 * Jarak waktu dari sekarang untuk stempel penuh (`created_at` notifikasi, ISO 8601
 * berzona), mis. `5 mnt lalu`. Berbeda dari fungsi di atas, yang ini memang memakai
 * `Date`: yang dibandingkan titik waktu, bukan tanggal kalender — jadi pergeseran
 * zona waktu browser justru yang diinginkan.
 *
 * Lewat seminggu, "9 hr lalu" tak lagi membantu; yang ditampilkan tanggalnya.
 */
export function relativeTime(iso: string | null | undefined): string {
  if (typeof iso !== 'string' || iso === '') return '';
  const at = new Date(iso).getTime();
  if (Number.isNaN(at)) return '';

  const minutes = Math.floor((Date.now() - at) / 60_000);
  if (minutes < 1) return 'baru saja';
  if (minutes < 60) return `${minutes} mnt lalu`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;

  const days = Math.floor(hours / 24);
  return days < 7 ? `${days} hr lalu` : formatDate(iso);
}

function split(
  iso: string | null | undefined,
): { year: string; month: number; day: number } | null {
  if (typeof iso !== 'string' || iso.length < 10) return null;
  const [year, month, day] = iso.slice(0, 10).split('-');
  const monthIndex = Number(month);
  if (monthIndex < 1 || monthIndex > 12) return null;
  return { year, month: monthIndex, day: Number(day) };
}

/** Tanggal hari ini dalam bentuk tampilan yang sama dengan hasil `formatDate`. */
export function todayLabel(): string {
  return formatDate(localIso(new Date()));
}

/** Satu hari di kalender pekan berjalan. */
export interface WeekDay {
  /** `2026-07-27` — tanggal lokal, bukan UTC. */
  iso: string;
  /** `27 Jul`, cukup untuk kalender sepekan yang tahunnya sudah jelas. */
  label: string;
  isToday: boolean;
}

/**
 * Senin–Minggu pekan berjalan, tujuh hari berurut.
 *
 * Pekan dimulai Senin, bukan Minggu seperti `Date.getDay()`: kalender yang dibaca orang
 * di sini memulai pekan di Senin, dan `WEEKDAYS` di `lib/labels` — sumber hari angkut
 * zona — sudah berurut sama. Kedua urutan itu harus tetap sejajar; kalau tidak, jadwal
 * hari Senin akan tergambar di baris Minggu.
 *
 * Berbeda dari fungsi format di atas, di sini `Date` memang dipakai: yang dihitung
 * tanggal kalender **milik pembaca**, bukan tanggal yang dikirim server.
 */
export function weekDates(today: Date = new Date()): WeekDay[] {
  const dow = today.getDay();
  const monday = new Date(today);
  // Minggu (`getDay() === 0`) adalah hari terakhir pekan ini, jadi mundurnya enam hari
  // — bukan nol, yang akan melompatkan seluruh kalender ke pekan berikutnya.
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));

  const todayIso = localIso(today);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const iso = localIso(date);
    return {
      iso,
      label: `${date.getDate()} ${MONTHS[date.getMonth()]}`,
      isToday: iso === todayIso,
    };
  });
}

/** `Date` → `2026-07-27` menurut jam dinding setempat, bukan `toISOString()` yang UTC. */
const localIso = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const pad = (value: number): string => String(value).padStart(2, '0');
