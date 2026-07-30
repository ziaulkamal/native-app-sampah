import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useColorScheme as useSystemScheme } from 'react-native';
import { colorScheme as nativewindScheme, useColorScheme } from 'nativewind';
import { readDarkPref, writeDarkPref } from '@/lib/theme';
import type { ThemeMode } from '@/tokens/tokens';

/**
 * Sakelar tema. Padanan `useEffect` di App.tsx web yang menempelkan class `dark`
 * ke <html>; di sini NativeWind yang memegang class itu, dan `mode` di context
 * disediakan untuk konsumen yang tak bisa memakai className (MapLibre, StatusBar).
 */
interface ThemeValue {
  mode: ThemeMode;
  dark: boolean;
  toggleDark: () => void;
  /** Kembali mengikuti tema sistem, membuang pilihan yang tersimpan. */
  followSystem: () => void;
}

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useSystemScheme();
  const { colorScheme, setColorScheme } = useColorScheme();
  // Pilihan tersimpan baru diketahui setelah satu putaran async. Sampai itu terjadi
  // tema sistem yang berlaku — bukan terang — supaya tak ada kedipan putih di
  // perangkat yang memang bertema gelap.
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    let alive = true;
    void readDarkPref().then((pref) => {
      if (!alive) return;
      if (pref !== null) setColorScheme(pref ? 'dark' : 'light');
      setRestored(true);
    });
    return () => {
      alive = false;
    };
  }, [setColorScheme]);

  // Selama belum ada pilihan tersimpan, perubahan tema sistem tetap diikuti.
  useEffect(() => {
    if (restored) return;
    setColorScheme(system === 'dark' ? 'dark' : 'light');
  }, [restored, system, setColorScheme]);

  const dark = colorScheme === 'dark';

  const toggleDark = useCallback(() => {
    const next = !dark;
    setColorScheme(next ? 'dark' : 'light');
    void writeDarkPref(next);
  }, [dark, setColorScheme]);

  const followSystem = useCallback(() => {
    setColorScheme('system');
    setRestored(false);
  }, [setColorScheme]);

  return (
    <ThemeContext.Provider
      value={{ mode: dark ? 'dark' : 'light', dark, toggleDark, followSystem }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext);
  if (ctx === null) throw new Error('useTheme harus dipakai di dalam <ThemeProvider>');
  return ctx;
}

/**
 * Mode tema di luar pohon React — untuk kode yang berjalan sebelum render
 * (mis. menyusun style peta). Membaca sakelar NativeWind langsung.
 */
export function currentMode(): ThemeMode {
  return nativewindScheme.get() === 'dark' ? 'dark' : 'light';
}
