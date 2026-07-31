import { useEffect, useState } from 'react';
import { useApp } from '@/store/AppContext';

/**
 * Tolak sesi yang tak punya konsol di aplikasi ini, lalu keluarkan lagi. Ini pemisahan
 * UX, **bukan** batas keamanan — otorisasi sesungguhnya di server.
 *
 * Sejak pintu masuknya disatukan, role tak lagi dipilih di muka: ia datang dari respons
 * `/auth/login` dan `/me`. Yang tersisa untuk dijaga hanyalah admin/Super Admin, yang
 * kalau dibiarkan masuk akan sampai di aplikasi kosong tanpa tahu kenapa.
 */
export function useRoleGuard(): string | null {
  const { session, signOut } = useApp();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (session === null || session.role !== 'admin') return;
    setMessage(
      `Akun ini terdaftar sebagai ${session.isSuperAdmin ? 'Super Admin' : 'Admin Dinas'}. Konsolnya dibuka lewat peramban, bukan aplikasi ini.`,
    );
    signOut();
  }, [session, signOut]);

  return message;
}
