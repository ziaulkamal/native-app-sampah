import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { readPulse, type Pulse } from '@/api/sync';
import { readBaseline, writeBaseline } from './pulseBaseline';

/** Sepuluh detik: cukup terasa seketika bagi pengguna, dan denyutnya hanya kueri agregat. */
const POLL_MS = 10_000;

/**
 * Kumpulan yang tak punya pemuat khusus — capnya bergeser berarti seluruh irisan role
 * dimuat ulang. Notifikasi & aduan punya pemuatnya sendiri, jadi tidak di sini.
 */
const BULK = ['registrations', 'locations', 'people', 'bills', 'payments', 'deposits'] as const;

export interface PulseHandlers {
  refreshQuietly: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  refreshComplaints: () => Promise<void>;
}

/**
 * Menjaga layar tetap mutakhir tanpa dimuat ulang: menanyakan cap tiap kumpulan berkala,
 * lalu memuat ulang **hanya** yang capnya bergeser.
 *
 * Sebelum ini konsol memuat datanya sekali saat masuk dan tidak pernah menariknya lagi
 * kecuali oleh mutasi dari tangannya sendiri, sehingga pengajuan yang dikirim pelanggan
 * baru terlihat setelah admin memuat ulang halaman.
 */
export function usePulse(authed: boolean, handlers: PulseHandlers): void {
  // Interval sengaja tidak dibuat ulang tiap aksi berubah; yang terbaru dibaca lewat ref
  // supaya pewaktunya tetap satu selama sesi berjalan.
  const latest = useRef(handlers);
  useEffect(() => {
    latest.current = handlers;
  });

  useEffect(() => {
    if (!authed) {
      writeBaseline(null);
      return;
    }
    let alive = true;

    const tick = async (): Promise<void> => {
      // Padanan `document.hidden` web. Aplikasi di latar belakang tak perlu didenyutkan:
      // layarnya tak terlihat, dan Android membatasi pekerjaan jaringan di sana.
      if (AppState.currentState !== 'active') return;
      let pulse: Pulse;
      try {
        pulse = await readPulse();
      } catch {
        return; // Jaringan putus bukan kabar untuk pengguna; coba lagi periode depan.
      }
      if (!alive) return;

      const prev = readBaseline();
      writeBaseline(pulse);
      // Denyut pertama hanya menetapkan patokan: datanya baru saja dimuat penuh.
      if (prev === null) return;

      const changed = (key: keyof Pulse): boolean => prev[key] !== pulse[key];

      // Pemuatan penuh sudah mencakup notifikasi & aduan, jadi keduanya dilewati.
      if (BULK.some(changed)) {
        void latest.current.refreshQuietly();
        return;
      }
      if (changed('notifications')) void latest.current.refreshNotifications();
      if (changed('complaints')) void latest.current.refreshComplaints();
    };

    // Patokan diambil segera, tanpa menunggu satu periode: perubahan yang mendarat antara
    // pemuatan awal dan denyut pertama kalau tidak akan terlewat selamanya.
    void tick();

    const timer = setInterval(() => void tick(), POLL_MS);
    // Aplikasi yang kembali ke depan diperiksa segera: jeda paling terasa saat pengguna
    // baru kembali menatap layarnya.
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') void tick();
    });

    return () => {
      alive = false;
      clearInterval(timer);
      sub.remove();
    };
  }, [authed]);
}
