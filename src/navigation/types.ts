import type { NavigatorScreenParams } from '@react-navigation/native';

/**
 * Peta rute aplikasi. Menggantikan `ScreenId` + `stack` di store web (Tahap 1/4):
 * di sana layar dipilih dengan menulis satu string ke state, di sini oleh navigator —
 * sekaligus memberi tombol Back Android dan gestur geser yang di web tak ada.
 *
 * Susunannya mengikuti `PARENT_TAB` di `BottomNav.tsx` web: sub-layar tinggal di dalam
 * tumpukan tab induknya, sehingga tab yang menyala tetap sama tanpa peta terpisah.
 */

export type AuthStackParams = {
  Masuk: undefined;
  /** Jalur kata sandi; identitas dibawa dari layar Masuk supaya tak diketik dua kali. */
  Sandi: { identity: string };
  /** OTP dikirim ke kanal yang disimpulkan dari bentuk identitasnya. */
  Otp: { identity: string; channel: 'wa' | 'email' };
  Register: undefined;
};

export type PelangganBerandaParams = {
  PelangganHome: undefined;
  PelangganAduan: undefined;
  /** Tanpa `locationId` berarti menambah titik baru. */
  TambahLokasi: { locationId?: string } | undefined;
};

export type PelangganTagihanParams = {
  /** `pay` diisi tombol tengah nav bawah: buka langsung sheet tagihan terlama. */
  PelangganTagihan: { pay?: boolean } | undefined;
  PelangganRiwayat: undefined;
};

export type PelangganJadwalParams = {
  PelangganJadwal: undefined;
};

export type OperatorBerandaParams = {
  OperatorHome: undefined;
  OperatorVerifikasi: undefined;
  OperatorSetor: undefined;
};

export type OperatorRuteParams = {
  OperatorRute: undefined;
};

export type OperatorPenagihanParams = {
  /** `customerId` diisi saat dibuka dari satu baris rute, bukan dari tab. */
  OperatorPenagihan: { customerId?: string } | undefined;
};

export type ProfilStackParams = {
  Profil: undefined;
  Akun: undefined;
};

/**
 * `Bayar`/`Catat` bukan layar: keduanya slot tombol bulat di tengah nav bawah, yang
 * ketukannya dibelokkan ke rute lain sebelum navigator sempat memfokuskannya. Ia tetap
 * harus jadi rute karena hanya rute yang punya kursi di bilah tab.
 */
export type PelangganTabParams = {
  Beranda: NavigatorScreenParams<PelangganBerandaParams>;
  Tagihan: NavigatorScreenParams<PelangganTagihanParams>;
  Bayar: undefined;
  Jadwal: NavigatorScreenParams<PelangganJadwalParams>;
  Profil: NavigatorScreenParams<ProfilStackParams>;
};

export type OperatorTabParams = {
  Beranda: NavigatorScreenParams<OperatorBerandaParams>;
  Rute: NavigatorScreenParams<OperatorRuteParams>;
  Catat: undefined;
  Tagih: NavigatorScreenParams<OperatorPenagihanParams>;
  Profil: NavigatorScreenParams<ProfilStackParams>;
};

export type RootStackParams = {
  Auth: NavigatorScreenParams<AuthStackParams>;
  Pelanggan: NavigatorScreenParams<PelangganTabParams>;
  Operator: NavigatorScreenParams<OperatorTabParams>;
  /**
   * Peta layar penuh TIDAK ada di sini dengan sengaja: ia `Modal` di dalam komponen
   * petanya sendiri (`features/map/MapFullscreen.tsx`), supaya peta pemilih titik tetap
   * menyunting nilai yang sama saat dibesarkan tanpa mengoper koordinat lewat rute.
   */
  /** Pratinjau KTP terkunci. */
  Dokumen: { documentId: string; title: string };
  /** Pemindai OCR KTP; hasilnya dikembalikan lewat `onDone` di store form. */
  ScanKtp: undefined;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParams {}
  }
}
