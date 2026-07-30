import { useEffect, useState } from 'react';
import { useApp } from '@/store/AppContext';
import type { Role } from '@/types';

const LABEL: Record<Role, string> = {
  pelanggan: 'Pelanggan',
  operator: 'Petugas',
  admin: 'Admin Dinas',
};

/**
 * Tolak sesi yang rolenya tidak cocok dengan layar masuk yang dipakai, lalu keluarkan
 * lagi. Ini pemisahan UX, **bukan** batas keamanan — otorisasi sesungguhnya di server.
 *
 * Satu cabang tambahan dibanding web: akun admin/Super Admin tidak punya konsol di
 * aplikasi ini. Membiarkannya masuk berarti ia sampai di aplikasi yang kosong tanpa
 * tahu kenapa, jadi penolakannya menyebutkan di mana konsolnya berada.
 */
export function useRoleGuard(expect: Role): string | null {
  const { session, signOut } = useApp();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (session === null || session.role === expect) return;
    setMessage(
      session.role === 'admin'
        ? 'Akun ini terdaftar sebagai Admin Dinas. Konsol admin dibuka lewat peramban, bukan aplikasi ini.'
        : `Akun ini terdaftar sebagai ${LABEL[session.role]}. Silakan masuk lewat layar ${LABEL[session.role]}.`,
    );
    signOut();
  }, [session, expect, signOut]);

  return message;
}
