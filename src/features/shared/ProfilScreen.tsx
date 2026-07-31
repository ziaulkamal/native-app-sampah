import { useState } from 'react';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { Text, View } from 'react-native';
import { ScreenScaffold } from '@/components/layout/ScreenScaffold';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { formatRupiah } from '@/lib/format';
import { CUSTOMER_STATUS, golonganName, VEHICLE_TYPE } from '@/lib/labels';
import type { ProfilStackParams } from '@/navigation/types';
import { useApp } from '@/store/AppContext';
import { brandLine } from '@/store/branding';
import type { AppContextValue } from '@/store/types';
import { useTheme } from '@/theme/ThemeProvider';
import { AvatarPicker } from './AvatarPicker';
import { GantiPasswordModal } from './GantiPasswordModal';
import { ActionRow, InfoRow, ProfilCard, ToggleRow } from './ProfilParts';

const APP_VERSION = 'v0.1.0';

/** Data profil ternormalisasi lintas role untuk render seragam. */
interface ProfileView {
  name: string;
  eyebrow: string;
  address: string;
  phone?: string;
  extra: { label: string; value: string; badge?: { label: string; tone: BadgeTone } }[];
}

/**
 * Layar Profil (pelanggan & petugas). Foto profil diganti dari sini, identitas
 * disunting di layar `Akun` — di web bagian itu terkunci karena formnya hanya ada di
 * konsol admin. Ganti kata sandi berlaku untuk semua role.
 */
export function ProfilScreen() {
  const app = useApp();
  const { dark, toggleDark } = useTheme();
  const nav = useNavigation<NavigationProp<ProfilStackParams>>();
  const view = app.role === 'operator' ? operatorView(app) : customerView(app);
  const [gantiPassword, setGantiPassword] = useState(false);

  return (
    <ScreenScaffold>
      <View className="items-center gap-3 pt-2">
        <AvatarPicker name={view.name} />
        <View className="items-center">
          <Text className="text-[19px] font-extrabold text-ink">{view.name}</Text>
          <Text className="mt-0.5 text-[12px] font-semibold text-olive">{view.eyebrow}</Text>
        </View>
      </View>

      <ProfilCard title="Identitas">
        <InfoRow label="Nama lengkap" value={view.name} locked first />
        <InfoRow label="Alamat" value={view.address === '' ? '—' : view.address} locked />
        <InfoRow label="Nomor WhatsApp" value={view.phone ?? 'Belum diatur'} locked />
        <ActionRow
          icon="settings"
          label="Ubah identitas akun"
          hint="Nama sebutan, email, nomor HP"
          onPress={() => nav.navigate('Akun')}
        />
      </ProfilCard>

      <ProfilCard title={app.role === 'operator' ? 'Kepegawaian' : 'Langganan'}>
        {view.extra.map((e, i) => (
          <InfoRow
            key={e.label}
            label={e.label}
            first={i === 0}
            value={e.badge ? <Badge label={e.badge.label} tone={e.badge.tone} /> : e.value}
          />
        ))}
      </ProfilCard>

      {/* Dua kartu satu-baris berturut-turut membuat halaman terasa terpotong-potong;
          keduanya sama-sama "pengaturan akun", jadi cukup satu judul seksi. */}
      <ProfilCard title="Keamanan & preferensi">
        <ActionRow
          icon="lock"
          label="Ganti kata sandi"
          hint="Perangkat lain akan dikeluarkan"
          onPress={() => setGantiPassword(true)}
          first
        />
        {/* Sakelar gelap tinggal di `ThemeProvider`, bukan di store seperti web:
            NativeWind yang memegang skema warnanya. */}
        <ToggleRow icon="moon" label="Mode gelap" checked={dark} onChange={toggleDark} />
      </ProfilCard>

      <ProfilCard>
        {/* Keluar itu aksi di tempat, bukan pintu ke layar lain — chevronnya dilepas. */}
        <ActionRow
          icon="logout"
          label="Keluar"
          tone="danger"
          chevron={false}
          onPress={app.signOut}
          first
        />
      </ProfilCard>

      {/* Kredit datang dari pengaturan; versinya tidak — ia milik rilis aplikasi ini,
          bukan milik dinas yang memakainya. */}
      <Text className="text-center text-[11px] text-dim">
        {app.branding.footerCredit ?? brandLine(app.branding)} · {APP_VERSION}
      </Text>

      <GantiPasswordModal open={gantiPassword} onClose={() => setGantiPassword(false)} />
    </ScreenScaffold>
  );
}

/** Profil pelanggan: titik layanannya sendiri, dari `/my/profile`. */
function customerView({ session, customers, zones, tariffs }: AppContextValue): ProfileView {
  const c = customers[0];
  if (c === undefined) {
    return {
      name: session?.name ?? '—',
      eyebrow: 'Pelanggan',
      address: '',
      phone: session?.phone ?? undefined,
      extra: [{ label: 'Status', value: 'Menunggu verifikasi admin dinas' }],
    };
  }

  const zone = zones.find((z) => z.id === c.zoneId);
  const st = CUSTOMER_STATUS[c.status];
  return {
    name: c.name,
    eyebrow: zone?.name ?? 'Pelanggan',
    address: c.address,
    phone: c.phone,
    extra: [
      { label: 'Titik layanan', value: c.label },
      { label: 'Golongan', value: golonganName(tariffs, c.category) },
      { label: 'Tarif', value: formatRupiah(c.tariff) },
      { label: 'Zona layanan', value: zone?.name ?? '—' },
      { label: 'Status', value: st.label, badge: st },
    ],
  };
}

/** Profil petugas: identitas dari sesi, cakupan kerja dari zona yang ditugaskan. */
function operatorView({ session, zones, customers }: AppContextValue): ProfileView {
  const vt = VEHICLE_TYPE[session?.vehicleType ?? 'mobil'];
  const mine = zones.filter((z) => session !== null && z.operatorIds.includes(session.id));
  const zoneIds = mine.map((z) => z.id);

  return {
    name: session?.name ?? '—',
    eyebrow: 'Petugas Retribusi',
    address: '',
    phone: session?.phone ?? undefined,
    extra: [
      { label: 'Jenis kendaraan', value: vt.label, badge: vt },
      { label: 'Username', value: session?.username ?? '—' },
      // Cakupan wilayah menggantikan target rupiah — dinas tidak memakai target.
      { label: 'Zona ditangani', value: `${mine.length} zona` },
      {
        label: 'Titik layanan',
        value: `${customers.filter((c) => zoneIds.includes(c.zoneId)).length} titik`,
      },
    ],
  };
}
