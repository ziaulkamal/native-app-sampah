import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';
import { colors, semantic, typography } from '@/tokens/tokens';
import type { ThemeMode } from '@/tokens/tokens';

/**
 * Tema React Navigation dari token yang sama dengan layarnya.
 *
 * Wajib disetel: warna bawaan navigator adalah biru iOS/Android, dan warna itu akan
 * muncul di latar layar saat transisi — satu kilas putih/biru di tengah palet olive
 * yang justru paling terlihat karena hanya sekejap.
 */
export function navTheme(mode: ThemeMode): Theme {
  const base = mode === 'dark' ? DarkTheme : DefaultTheme;
  const c = colors[mode];

  return {
    ...base,
    dark: mode === 'dark',
    colors: {
      primary: c.olive,
      background: c.bg,
      card: c.nav,
      text: c.text,
      border: c.border,
      notification: semantic.danger,
    },
    fonts: {
      regular: { fontFamily: typography.sans, fontWeight: '400' },
      medium: { fontFamily: typography.sans, fontWeight: '500' },
      bold: { fontFamily: typography.sans, fontWeight: '700' },
      heavy: { fontFamily: typography.sans, fontWeight: '800' },
    },
  };
}
