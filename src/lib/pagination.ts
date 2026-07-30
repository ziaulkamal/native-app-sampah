import { useEffect, useMemo, useState } from 'react';

/**
 * Pilihan jumlah baris per halaman. Yang pertama sekaligus bawaan: sepuluh baris
 * muat di satu layar tanpa menggulir, dan daftar yang lebih panjang dari itu hampir
 * selalu dibaca lewat pencarian, bukan dengan menggulir sampai bawah.
 */
export const PAGE_SIZES = [10, 25, 50, 100] as const;

export type PageSize = (typeof PAGE_SIZES)[number];

export const DEFAULT_PAGE_SIZE: PageSize = PAGE_SIZES[0];

/** Kontrol yang dibaca `<Pagination>`; sengaja satu objek agar bisa disebar. */
export interface PaginationBind {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export interface Paginated<T> {
  /** Potongan baris untuk halaman yang sedang tampil. */
  items: T[];
  /** Jumlah seluruh baris sebelum dipotong — dipakai teks "dari N". */
  total: number;
  bind: PaginationBind;
}

/**
 * Paginasi sisi klien atas baris yang sudah ada di memori.
 *
 * `resetKey` adalah penanda penyaring aktif (kata kunci, chip status, dsb). Tanpa itu,
 * mengganti filter saat berada di halaman 5 akan menyisakan tabel kosong: barisnya
 * tinggal segelintir sementara jendelanya masih menunjuk baris ke-41.
 */
export function usePagination<T>(rows: T[], resetKey: unknown = null): Paginated<T> {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  const total = rows.length;
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  // Dijepit saat dibaca, bukan disimpan: baris bisa menyusut kapan saja (data baru
  // masuk, aduan ditutup) dan halaman aktif harus ikut mundur tanpa render tambahan.
  const current = Math.min(page, lastPage);

  const items = useMemo(
    () => rows.slice((current - 1) * pageSize, current * pageSize),
    [rows, current, pageSize],
  );

  return {
    items,
    total,
    bind: {
      page: current,
      pageSize,
      total,
      onPageChange: setPage,
      // Ukuran baru selalu kembali ke halaman satu: "halaman 5 dari 10" tidak punya
      // padanan yang jelas begitu satu halaman berisi 100, bukan 10.
      onPageSizeChange: (size: number) => {
        setPageSize(size);
        setPage(1);
      },
    },
  };
}

/**
 * Deret nomor halaman yang ringkas: ujung selalu terlihat, tetangga halaman aktif
 * utuh, sisanya diringkas jadi `gap`. Tanpa ini 300 halaman berarti 300 tombol.
 */
export function pageWindow(page: number, lastPage: number): (number | 'gap')[] {
  if (lastPage <= 7) return range(1, lastPage);

  const first = Math.max(2, Math.min(page - 1, lastPage - 4));
  const last = Math.min(lastPage - 1, Math.max(page + 1, 5));
  const around = range(first, last);

  return [
    1,
    ...(first > 2 ? (['gap'] as const) : []),
    ...around,
    ...(last < lastPage - 1 ? (['gap'] as const) : []),
    lastPage,
  ];
}

const range = (from: number, to: number): number[] =>
  Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i);
