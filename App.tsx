import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlertHost } from '@/components/ui/Alert';
import { ToastHost } from '@/components/ui/Toast';
import { RootNavigator } from '@/navigation/RootNavigator';
import { AppProvider } from '@/store/AppContext';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import './global.css';

// Splash native ditahan sampai layar JS pertama benar-benar tergambar (lihat
// `RootNavigator`), lalu memudar — tanpa ini ada satu frame kosong di antaranya.
void SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: 320, fade: true });

/**
 * Akar aplikasi — padanan `App.tsx` + `main.tsx` web.
 *
 * Urutan pembungkusnya penting: `ThemeProvider` di luar `AppProvider` karena ikon,
 * peta, dan tema navigasi membaca warna lewat `useTheme()` bahkan sebelum ada sesi;
 * `AlertHost`/`ToastHost` di luar navigator supaya dialog & toast tetap tampil di
 * atas layar mana pun, persis seperti web memasangnya sekali di akar.
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppProvider>
          <RootNavigator />
          <AlertHost />
          <ToastHost />
          <ThemedStatusBar />
        </AppProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

/** Ikon jam & baterai ikut tema; `auto` saja salah saat tema aplikasi ≠ tema sistem. */
function ThemedStatusBar() {
  const { dark } = useTheme();
  return <StatusBar style={dark ? 'light' : 'dark'} />;
}
