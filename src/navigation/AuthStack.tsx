import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Masuk } from '@/features/auth/Masuk';
import { OtpForm } from '@/features/auth/OtpForm';
import { RegisterPelanggan } from '@/features/auth/RegisterPelanggan';
import { Sandi } from '@/features/auth/Sandi';
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
      <Stack.Screen name="Masuk" component={Masuk} />
      <Stack.Screen name="Sandi" component={Sandi} />
      <Stack.Screen name="Otp" component={OtpForm} />
      <Stack.Screen name="Register" component={RegisterPelanggan} />
    </Stack.Navigator>
  );
}
