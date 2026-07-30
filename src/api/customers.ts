import { del, fileHeaders, get, getEnvelope, getPage, post, put } from './client';
import { apiUrl } from './config';
import type { Page } from './envelope';
import type { ActivityDto, DocumentDto, LocalFile, PeopleDto, ServiceLocationDto } from './types';

/** Filter daftar pelanggan yang didukung server. */
export interface PeopleFilter {
  status?: string;
  q?: string;
  village?: string;
  page?: number;
  per_page?: number;
}

/** Biodata pelanggan. NIK dikirim utuh saat menulis, tak pernah dibalikkan utuh. */
export interface PersonInput {
  full_name: string;
  identity_number?: string;
  phone_number?: string;
  email?: string | null;
  gender?: 'L' | 'P' | null;
  birth_place?: string | null;
  /** Format ISO `YYYY-MM-DD` — sama dengan yang dikembalikan server. */
  birthdate?: string | null;
  street_address?: string;
  rt?: string | null;
  rw?: string | null;
  postal_code?: string | null;
  /** Keempatnya kode Kemendagri berjenjang; server menolak anak yang bukan milik induknya. */
  province_code?: string | null;
  regency_code?: string | null;
  district_code?: string | null;
  village_code?: string | null;
}

/**
 * Titik layanan.
 *
 * `category_id` hanya berlaku pada endpoint admin — `/my/locations` membuangnya di
 * server, jadi pelanggan tetap tidak bisa memilih tarifnya sendiri. Sebaliknya
 * `location_kind` kini hanya dikirim alur pelanggan; layar admin memilih golongan
 * tarif dan membiarkan kolom itu memakai bawaan server.
 */
export interface LocationInput {
  label: string;
  location_kind?: ServiceLocationDto['location_kind'];
  category_id?: string | null;
  /**
   * Usulan golongan dari pelanggan (§31). Kebalikan `category_id`: justru inilah yang
   * hanya berarti di `/my/locations`, dan ia tak pernah jadi dasar tarif.
   */
  requested_category_id?: string | null;
  address: string;
  rt?: string | null;
  rw?: string | null;
  village_code?: string | null;
  zone_id?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

/** Profil pelanggan yang sedang masuk: biodata, titik layanan, golongan, zona + jadwal. */
export const myProfile = (): Promise<PeopleDto> => get<PeopleDto>('/my/profile');

/** Titik layanan milik pelanggan yang sedang masuk, berikut status pengajuannya. */
export const myLocations = (): Promise<ServiceLocationDto[]> =>
  get<ServiceLocationDto[]>('/my/locations');

/**
 * Pengajuan titik layanan tambahan oleh pelanggan sendiri.
 *
 * Golongan dan zona **tidak** ikut dikirim: keduanya wewenang admin dan ditetapkan
 * saat verifikasi. Pelanggan yang memilih golongannya sendiri berarti memilih
 * tarifnya sendiri. Yang ikut adalah `requested_category_id` — usulannya, yang dibaca
 * admin sebagai nilai awal dan tak pernah menagih apa pun.
 */
export const requestMyLocation = (
  input: Omit<LocationInput, 'zone_id'>,
): Promise<ServiceLocationDto> => post<ServiceLocationDto>('/my/locations', input);

/** `with=locations` membawa titik layanan + golongannya sekaligus (hindari N+1 jaringan). */
export const listPeople = (filter: PeopleFilter = {}): Promise<Page<PeopleDto>> =>
  getPage<PeopleDto>('/people', {
    query: { ...filter, with: 'locations', per_page: filter.per_page ?? 100 },
  });

export const createPerson = (input: PersonInput): Promise<PeopleDto> =>
  post<PeopleDto>('/people', input);

export const updatePerson = (id: string, input: Partial<PersonInput>): Promise<PeopleDto> =>
  put<PeopleDto>(`/people/${id}`, input);

/** `suspended` menghentikan penerbitan tagihan baru, tapi akun tetap bisa masuk. */
export const setPersonStatus = (id: string, status: string, reason?: string): Promise<PeopleDto> =>
  put<PeopleDto>(`/people/${id}/status`, { status, reason });

/** Verifikasi biodata sekaligus mengaktifkan akun login pelanggan. */
export const verifyPerson = (id: string): Promise<PeopleDto> =>
  post<PeopleDto>(`/people/${id}/verify`);

/**
 * Tolak pendaftar mandiri. Tidak bisa dibatalkan: biodata, akun, berkas KTP, dan
 * notifikasinya hilang seluruhnya, jadi responsnya kosong — tak ada lagi yang
 * bisa dipulangkan server.
 */
export const rejectPerson = (id: string, reason: string): Promise<null> =>
  post<null>(`/people/${id}/reject`, { reason });

/** Detail pelanggan beserta isian yang masih menghalangi verifikasi. */
export interface PersonDetail {
  person: PeopleDto;
  /** Kunci field yang belum terisi; kosong berarti siap disetujui. */
  missing: string[];
  /** Ringkasan tagihan per titik layanan; kosong bila tidak diminta lewat `?with=`. */
  billsSummary: Record<string, BillsSummary>;
}

export async function getPerson(id: string, withParts?: string[]): Promise<PersonDetail> {
  const envelope = await getEnvelope<PeopleDto>(`/people/${id}`, {
    query: { with: withParts === undefined ? undefined : withParts.join(',') },
  });
  const missing = envelope.meta?.missing;
  const summary = envelope.meta?.bills_summary;

  return {
    person: envelope.data,
    missing: Array.isArray(missing) ? missing.map(String) : [],
    // Peta `service_location_id` → ringkasan; hanya ada bila diminta lewat `?with=`.
    billsSummary: isSummaryMap(summary) ? summary : {},
  };
}

/** Ringkasan tagihan satu titik layanan, sebagaimana dikirim `meta.bills_summary`. */
export interface BillsSummary {
  unpaid_count: number;
  outstanding_amount: number;
  penalty_amount: number;
  oldest_unpaid_period: string | null;
  last_paid_at: string | null;
}

function isSummaryMap(value: unknown): value is Record<string, BillsSummary> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * NIK utuh satu pelanggan. Sengaja diminta per klik "lihat", bukan ikut di daftar:
 * server mencatat tiap pembukaan atas nama admin yang memintanya.
 */
export const personIdentity = (id: string): Promise<{ nik: string }> =>
  get<{ nik: string }>(`/people/${id}/identity`);

/** Jejak perubahan biodata: siapa mengubah apa, kapan. */
export const personActivities = (id: string): Promise<ActivityDto[]> =>
  get<ActivityDto[]>(`/people/${id}/activities`);

/** Foto profil pelanggan; dikirim multipart karena berupa berkas. */
export function uploadPersonAvatar(id: string, file: LocalFile): Promise<PeopleDto> {
  const form = new FormData();
  form.append('avatar', file as unknown as Blob);

  return post<PeopleDto>(`/people/${id}/avatar`, form);
}

/** Berkas resmi pelanggan — KTP pendaftar dibaca dari sini saat menilai persetujuan. */
export const listPersonDocuments = (peopleId: string): Promise<DocumentDto[]> =>
  get<DocumentDto[]>(`/people/${peopleId}/documents`);

/**
 * Sumber gambar berkas untuk `<Image source={…}>`.
 *
 * Web mengambilnya sebagai blob lalu merender `blob:` URL. Di RN tak ada
 * `URL.createObjectURL`, jadi alamatnya diserahkan langsung ke `<Image>` beserta
 * bearer token — server memang tak menerbitkan URL bertanda tangan, sehingga tanpa
 * header balasannya 401 dan gambarnya kosong tanpa pesan apa pun.
 */
export const documentSource = (
  documentId: string,
): { uri: string; headers: Record<string, string> } => ({
  uri: apiUrl(`/documents/${documentId}/content`),
  headers: fileHeaders(),
});

export const createLocation = (
  peopleId: string,
  input: LocationInput,
): Promise<ServiceLocationDto> => post<ServiceLocationDto>(`/people/${peopleId}/locations`, input);

export const updateLocation = (
  id: string,
  input: Partial<LocationInput>,
): Promise<ServiceLocationDto> => put<ServiceLocationDto>(`/locations/${id}`, input);

/**
 * Verifikasi titik layanan: menetapkan golongan **dan** zona sekaligus.
 *
 * Keduanya wajib di server. Tanpa golongan, penerbitan tagihan melewati titik ini
 * diam-diam; tanpa zona, tak ada petugas yang menjangkaunya kecuali admin menugaskan
 * seseorang secara langsung. Dua-duanya gagal senyap dan baru ketahuan berbulan
 * kemudian, saat ada yang bertanya kenapa satu pelanggan tak pernah ditagih.
 */
export const verifyLocation = (
  id: string,
  categoryId: string,
  zoneId: string,
): Promise<ServiceLocationDto> =>
  post<ServiceLocationDto>(`/locations/${id}/verify`, { category_id: categoryId, zone_id: zoneId });

/**
 * Menolak pengajuan titik layanan (§31): titiknya dibuang, alasannya masuk ke lonceng
 * pengajunya.
 *
 * Balasannya kosong dengan sengaja — yang ditolak sudah tidak ada lagi untuk digambar.
 */
export const rejectLocation = (id: string, reason: string): Promise<null> =>
  post<null>(`/locations/${id}/reject`, { reason });

/**
 * Penugasan petugas **langsung** ke satu titik layanan (§7) — pelengkap penugasan per
 * zona, untuk pelanggan yang ditangani orang tertentu terlepas dari wilayahnya.
 *
 * Daftar dikirim utuh, bukan selisihnya: server memperlakukan `user_ids` sebagai
 * pengganti seluruh penugasan langsung titik itu. Daftar kosong sah — itulah cara
 * mencabut semuanya sekaligus, dan cakupan lewat zona tetap berjalan.
 */
export const assignLocationOperators = (
  locationId: string,
  userIds: string[],
): Promise<ServiceLocationDto> =>
  post<ServiceLocationDto>(`/locations/${locationId}/operators`, { user_ids: userIds });

/** Cabut satu petugas dari titik, tanpa menyentuh penugasan langsung yang lain. */
export const detachLocationOperator = (
  locationId: string,
  userId: string,
): Promise<ServiceLocationDto> =>
  del<ServiceLocationDto>(`/locations/${locationId}/operators/${userId}`);

/**
 * Usulan alamat KTP dari catatan Dukcapil (§27).
 *
 * Yang dikembalikan **hanya empat kode wilayah**: nama, tanggal lahir, dan alamat
 * jalan ikut datang dari gateway tetapi sengaja berhenti di server. `status`
 * menjelaskan mengapa usulannya kosong — layar memakainya untuk memilih diam, bukan
 * untuk menampilkan pesan galat.
 */
export interface DukcapilSuggestion {
  status: 'found' | 'not_found' | 'ambiguous' | 'inactive' | 'unreachable' | 'unreadable';
  found: boolean;
  province_code: string | null;
  regency_code: string | null;
  district_code: string | null;
  village_code: string | null;
}

/**
 * POST meski tidak menyimpan apa pun: NIK tak pantas tertinggal di riwayat peramban
 * maupun log akses sebagai bagian dari URL.
 */
export const lookupDukcapil = (
  identityNumber: string,
  fullName: string,
): Promise<DukcapilSuggestion> =>
  post<DukcapilSuggestion>('/people/dukcapil-lookup', {
    identity_number: identityNumber,
    full_name: fullName,
  });

/**
 * Langkah pertama alur yang sama: memeriksa **NIK saja**, sebelum namanya diketik.
 *
 * `name_hint` datang sudah tersamar dari hulu (`ZI** KA**`) dan memang tidak lebih
 * dari itu — ia penanda bahwa NIK-nya tercatat, bukan nilai yang bisa diisikan.
 * Karena itu tempatnya di layar adalah placeholder isian nama.
 */
export interface DukcapilNameHint {
  status: DukcapilSuggestion['status'];
  found: boolean;
  name_hint: string | null;
}

export const peekDukcapil = (identityNumber: string): Promise<DukcapilNameHint> =>
  post<DukcapilNameHint>('/people/dukcapil-peek', { identity_number: identityNumber });

/**
 * Usulan biodata untuk pendaftar yang **sudah tersimpan**, dipakai layar tinjau.
 *
 * Bedanya dengan `lookupDukcapil`: NIK-nya tidak dikirim dari sini — server yang
 * membacanya sendiri dari baris orangnya. Karena itu tanggal lahir & jenis kelamin
 * ikut dikembalikan, dan keduanya selalu ada selama NIK-nya terbaca, bahkan saat
 * gateway padam (`status: 'unreachable'`) — keduanya murni turunan NIK.
 *
 * GET, bukan POST: tak ada NIK yang lewat URL, dan permintaannya tak mengubah apa pun.
 */
export interface PersonSuggestion extends DukcapilSuggestion {
  birthdate: string | null;
  gender: 'L' | 'P' | null;
}

export const suggestPersonBiodata = (id: string): Promise<PersonSuggestion> =>
  get<PersonSuggestion>(`/people/${id}/dukcapil-suggest`);
