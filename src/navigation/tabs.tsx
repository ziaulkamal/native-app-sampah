import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NotificationBell } from '@/features/notifikasi/NotificationBell';
import { OperatorHome } from '@/features/operator/OperatorHome';
import { OperatorPenagihan } from '@/features/operator/OperatorPenagihan';
import { OperatorRute } from '@/features/operator/OperatorRute';
import { OperatorSetor } from '@/features/operator/OperatorSetor';
import { OperatorVerifikasi } from '@/features/operator/OperatorVerifikasi';
import { PelangganAduan } from '@/features/pelanggan/PelangganAduan';
import { PelangganHome } from '@/features/pelanggan/PelangganHome';
import { PelangganJadwal } from '@/features/pelanggan/PelangganJadwal';
import { PelangganRiwayat } from '@/features/pelanggan/PelangganRiwayat';
import { PelangganTagihan } from '@/features/pelanggan/PelangganTagihan';
import { TambahLokasi } from '@/features/pelanggan/TambahLokasi';
import { AkunScreen } from '@/features/shared/AkunScreen';
import { ProfilScreen } from '@/features/shared/ProfilScreen';
import { Icon, type IconName } from '@/components/ui/Icon';
import { useTheme } from '@/theme/ThemeProvider';
import { colors, typography } from '@/tokens/tokens';
import type {
  OperatorBerandaParams,
  OperatorPenagihanParams,
  OperatorRuteParams,
  OperatorTabParams,
  PelangganBerandaParams,
  PelangganJadwalParams,
  PelangganTabParams,
  PelangganTagihanParams,
  ProfilStackParams,
} from './types';

/**
 * Tab bawah + tumpukan tiap tab — porting `components/layout/BottomNav.tsx` web.
 *
 * Label, urutan, dan ikonnya sama persis dengan web. Sub-layar sengaja ditaruh di
 * dalam tumpukan tab induknya (aduan di Beranda, riwayat di Tagihan, verifikasi &
 * setor di Beranda): itu menghasilkan sorotan tab yang sama dengan peta `PARENT_TAB`
 * web tanpa perlu memelihara petanya sendiri.
 */

// Dua navigator terpisah, bukan satu yang di-generic-kan: daftar rute keduanya berbeda,
// dan menyatukannya jadi union membuat nama rute tak lagi terperiksa tipe.
const PelangganTab = createBottomTabNavigator<PelangganTabParams>();
const OperatorTab = createBottomTabNavigator<OperatorTabParams>();

function useTabScreenOptions() {
  const { mode } = useTheme();
  const c = colors[mode];
  return {
    headerStyle: { backgroundColor: c.nav },
    headerTitleStyle: { fontFamily: typography.sans, fontWeight: '800' as const, fontSize: 17 },
    headerTintColor: c.text,
    headerRight: () => <NotificationBell />,
    tabBarActiveTintColor: c.olive,
    tabBarInactiveTintColor: c['text-dim'],
    tabBarStyle: { backgroundColor: c.nav, borderTopColor: c.border },
    tabBarLabelStyle: { fontFamily: typography.sans, fontWeight: '600' as const, fontSize: 10.5 },
  };
}

const tabIcon =
  (name: IconName) =>
  ({ color }: { color: string }) => <Icon name={name} size={23} color={color} />;

// --- Pelanggan ---

const PelangganBerandaStack = createNativeStackNavigator<PelangganBerandaParams>();
const PelangganTagihanStack = createNativeStackNavigator<PelangganTagihanParams>();
const PelangganJadwalStack = createNativeStackNavigator<PelangganJadwalParams>();

function BerandaPelanggan() {
  return (
    <PelangganBerandaStack.Navigator screenOptions={{ headerShown: false }}>
      <PelangganBerandaStack.Screen name="PelangganHome" component={PelangganHome} />
      <PelangganBerandaStack.Screen name="PelangganAduan" component={PelangganAduan} />
      <PelangganBerandaStack.Screen name="TambahLokasi" component={TambahLokasi} />
    </PelangganBerandaStack.Navigator>
  );
}

function TagihanPelanggan() {
  return (
    <PelangganTagihanStack.Navigator screenOptions={{ headerShown: false }}>
      <PelangganTagihanStack.Screen name="PelangganTagihan" component={PelangganTagihan} />
      <PelangganTagihanStack.Screen name="PelangganRiwayat" component={PelangganRiwayat} />
    </PelangganTagihanStack.Navigator>
  );
}

function JadwalPelanggan() {
  return (
    <PelangganJadwalStack.Navigator screenOptions={{ headerShown: false }}>
      <PelangganJadwalStack.Screen name="PelangganJadwal" component={PelangganJadwal} />
    </PelangganJadwalStack.Navigator>
  );
}

export function PelangganTabs() {
  const options = useTabScreenOptions();
  return (
    <PelangganTab.Navigator screenOptions={options}>
      <PelangganTab.Screen
        name="Beranda"
        component={BerandaPelanggan}
        options={{ tabBarIcon: tabIcon('home') }}
      />
      <PelangganTab.Screen
        name="Tagihan"
        component={TagihanPelanggan}
        options={{ tabBarIcon: tabIcon('receipt') }}
      />
      <PelangganTab.Screen
        name="Jadwal"
        component={JadwalPelanggan}
        options={{ tabBarIcon: tabIcon('calendar') }}
      />
      <PelangganTab.Screen
        name="Profil"
        component={ProfilStack}
        options={{ tabBarIcon: tabIcon('user') }}
      />
    </PelangganTab.Navigator>
  );
}

// --- Operator ---

const OperatorBerandaStack = createNativeStackNavigator<OperatorBerandaParams>();
const OperatorRuteStack = createNativeStackNavigator<OperatorRuteParams>();
const OperatorTagihStack = createNativeStackNavigator<OperatorPenagihanParams>();

function BerandaOperator() {
  return (
    <OperatorBerandaStack.Navigator screenOptions={{ headerShown: false }}>
      <OperatorBerandaStack.Screen name="OperatorHome" component={OperatorHome} />
      <OperatorBerandaStack.Screen name="OperatorVerifikasi" component={OperatorVerifikasi} />
      <OperatorBerandaStack.Screen name="OperatorSetor" component={OperatorSetor} />
    </OperatorBerandaStack.Navigator>
  );
}

function RuteOperator() {
  return (
    <OperatorRuteStack.Navigator screenOptions={{ headerShown: false }}>
      <OperatorRuteStack.Screen name="OperatorRute" component={OperatorRute} />
    </OperatorRuteStack.Navigator>
  );
}

function TagihOperator() {
  return (
    <OperatorTagihStack.Navigator screenOptions={{ headerShown: false }}>
      <OperatorTagihStack.Screen name="OperatorPenagihan" component={OperatorPenagihan} />
    </OperatorTagihStack.Navigator>
  );
}

export function OperatorTabs() {
  const options = useTabScreenOptions();
  return (
    <OperatorTab.Navigator screenOptions={options}>
      <OperatorTab.Screen
        name="Beranda"
        component={BerandaOperator}
        options={{ tabBarIcon: tabIcon('home') }}
      />
      <OperatorTab.Screen
        name="Rute"
        component={RuteOperator}
        options={{ tabBarIcon: tabIcon('route') }}
      />
      <OperatorTab.Screen
        name="Tagih"
        component={TagihOperator}
        options={{ tabBarIcon: tabIcon('wallet') }}
      />
      <OperatorTab.Screen
        name="Profil"
        component={ProfilStack}
        options={{ tabBarIcon: tabIcon('user') }}
      />
    </OperatorTab.Navigator>
  );
}

// --- Bersama ---

const Profil = createNativeStackNavigator<ProfilStackParams>();

function ProfilStack() {
  return (
    <Profil.Navigator screenOptions={{ headerShown: false }}>
      <Profil.Screen name="Profil" component={ProfilScreen} />
      <Profil.Screen name="Akun" component={AkunScreen} />
    </Profil.Navigator>
  );
}
