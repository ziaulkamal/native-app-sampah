import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginPelanggan } from '@/features/auth/LoginPelanggan';
import { LoginPetugas } from '@/features/auth/LoginPetugas';
import { OtpForm } from '@/features/auth/OtpForm';
import { PilihMasuk } from '@/features/auth/PilihMasuk';
import { RegisterPelanggan } from '@/features/auth/RegisterPelanggan';
import type { AuthStackParams } from './types';

const Stack = createNativeStackNavigator<AuthStackParams>();

/**
 * Alur sebelum masuk. Padanan `features/auth/AuthRoutes.tsx` web.
 *
 * Seluruh layar tanpa header native: `AuthLayout` menggambar kepala bermereknya sendiri
 * (termasuk tombol kembali), dan dua header bertumpuk di layar setinggi 240dp itu
 * memakan ruang yang justru dibutuhkan formulirnya.
 */
export function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PilihMasuk" component={PilihMasuk} />
      <Stack.Screen name="LoginPelanggan" component={LoginPelanggan} />
      <Stack.Screen name="LoginPetugas" component={LoginPetugas} />
      <Stack.Screen name="Otp" component={OtpForm} />
      <Stack.Screen name="Register" component={RegisterPelanggan} />
    </Stack.Navigator>
  );
}
