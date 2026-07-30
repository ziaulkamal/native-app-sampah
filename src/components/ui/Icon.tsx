import type { StyleProp, ViewStyle } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';
import { colors } from '@/tokens/tokens';

/**
 * Set ikon aplikasi — porting `components/ui/Icon.tsx` web ke react-native-svg.
 *
 * Data path-nya SAMA PERSIS dengan web, jadi bentuk ikon tak bergeser sedikit pun
 * antar platform. Yang berubah hanya cara mewarnai dan mengukurnya:
 *
 * - Web mewarisi warna lewat `currentColor` dari class induk (`text-olive`).
 *   RN tidak punya pewarisan CSS, jadi warna masuk sebagai prop `color`.
 * - Web mengatur ukuran lewat class (`w-7 h-7`); di sini lewat prop `size`.
 *
 * Keduanya tercatat sebagai "re-pattern" di docs/MAPPING.md.
 */

export type IconName =
  | 'home'
  | 'user'
  | 'users'
  | 'receipt'
  | 'wallet'
  | 'calendar'
  | 'bell'
  | 'route'
  | 'truck'
  | 'trash'
  | 'bars'
  | 'grid'
  | 'pin'
  | 'settings'
  | 'search'
  | 'back'
  | 'plus'
  | 'logout'
  | 'check'
  | 'shield'
  | 'star'
  | 'menu'
  | 'chevron'
  | 'x'
  | 'sun'
  | 'moon'
  | 'edit'
  | 'qr'
  | 'camera'
  | 'phone'
  | 'whatsapp'
  | 'google'
  | 'lock'
  | 'warn'
  | 'info'
  | 'expand'
  | 'shrink';

interface IconProps {
  name: IconName;
  /** Sisi ikon dalam dp. Web memakai class; di sini angka. */
  size?: number;
  /**
   * Warna garis. Bawaannya warna teks tema berjalan — padanan terdekat dari
   * `currentColor` di web, supaya pemanggil hanya perlu menyebut warna saat ia
   * memang ingin menyimpang (mis. ikon olive di dalam kartu).
   */
  color?: string;
  /** Menukar isian untuk state toggle (mis. bintang aktif). */
  filled?: boolean;
  /** Untuk transform saja — web memutar chevron lewat class `rotate-180`. */
  style?: StyleProp<ViewStyle>;
}

/** Ikon stroke. Ukuran lewat `size`; warna mengikuti tema kecuali ditimpa. */
export function Icon({ name, size = 24, color: override, filled, style }: IconProps) {
  const { mode } = useTheme();
  const color = override ?? colors[mode].text;
  const s = {
    stroke: color,
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none' as const,
  };
  const box = { width: size, height: size, viewBox: '0 0 24 24', style };

  switch (name) {
    case 'home':
      return (
        <Svg {...box}>
          <Path {...s} d="M4 11l8-7 8 7v8a1 1 0 01-1 1h-4v-6H9v6H5a1 1 0 01-1-1v-8z" />
        </Svg>
      );
    case 'user':
      return (
        <Svg {...box}>
          <Circle {...s} cx="12" cy="8" r="4" />
          <Path {...s} d="M5 20c0-4 3-6 7-6s7 2 7 6" />
        </Svg>
      );
    case 'users':
      return (
        <Svg {...box}>
          <Circle {...s} cx="9" cy="8" r="3.2" />
          <Path {...s} d="M3 20c0-3.3 2.7-5 6-5s6 1.7 6 5" />
          <Path {...s} d="M16 5.2a3.2 3.2 0 010 5.9M18.5 20c0-3-1.3-4.7-3.2-5.5" />
        </Svg>
      );
    case 'receipt':
      return (
        <Svg {...box}>
          <Path {...s} d="M5 3h14v18l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3V3z" />
          <Path {...s} d="M8.5 8h7M8.5 12h7" />
        </Svg>
      );
    case 'wallet':
      return (
        <Svg {...box}>
          <Path {...s} d="M4 7a2 2 0 012-2h11a1 1 0 011 1v2" />
          <Path {...s} d="M4 7v10a2 2 0 002 2h13a1 1 0 001-1v-3" />
          <Path {...s} d="M22 11v4h-4a2 2 0 010-4h4z" />
        </Svg>
      );
    case 'calendar':
      return (
        <Svg {...box}>
          <Rect {...s} x="3" y="4" width="18" height="17" rx="3" />
          <Path {...s} d="M3 9h18M8 2v4M16 2v4" />
        </Svg>
      );
    case 'bell':
      return (
        <Svg {...box}>
          <Path {...s} d="M6 9a6 6 0 1112 0c0 4.5 2 5.5 2 5.5H4s2-1 2-5.5z" />
          <Path {...s} d="M10 20a2 2 0 004 0" />
        </Svg>
      );
    case 'route':
      return (
        <Svg {...box}>
          <Circle {...s} cx="6" cy="6.5" r="2.3" />
          <Circle {...s} cx="18" cy="17.5" r="2.3" />
          <Path {...s} d="M8.3 6.5H14a3 3 0 010 6H10a3 3 0 000 6h5.7" />
        </Svg>
      );
    case 'truck':
      return (
        <Svg {...box}>
          <Rect {...s} x="2.5" y="6.5" width="11" height="9" rx="1.5" />
          <Path {...s} d="M13.5 9.5H18l3 3v3h-7.5z" />
          <Circle {...s} cx="7" cy="18" r="1.9" />
          <Circle {...s} cx="17.5" cy="18" r="1.9" />
        </Svg>
      );
    case 'trash':
      return (
        <Svg {...box}>
          <Path {...s} d="M4 7h16" />
          <Path {...s} d="M6.5 7l.9 12a1 1 0 001 1h7.2a1 1 0 001-1l.9-12" />
          <Path {...s} d="M9 7V4h6v3" />
          <Path {...s} d="M10 11v6M14 11v6" />
        </Svg>
      );
    case 'bars':
      return (
        <Svg {...box}>
          <Rect {...s} x="4" y="12" width="3.5" height="8" rx="1" />
          <Rect {...s} x="10.25" y="6.5" width="3.5" height="13.5" rx="1" />
          <Rect {...s} x="16.5" y="9.5" width="3.5" height="10.5" rx="1" />
        </Svg>
      );
    case 'grid':
      return (
        <Svg {...box}>
          <Rect {...s} x="3" y="3" width="7.5" height="7.5" rx="2" />
          <Rect {...s} x="13.5" y="3" width="7.5" height="7.5" rx="2" />
          <Rect {...s} x="3" y="13.5" width="7.5" height="7.5" rx="2" />
          <Rect {...s} x="13.5" y="13.5" width="7.5" height="7.5" rx="2" />
        </Svg>
      );
    case 'pin':
      return (
        <Svg {...box}>
          <Path {...s} d="M12 21s7-5.5 7-11a7 7 0 10-14 0c0 5.5 7 11 7 11z" />
          <Circle {...s} cx="12" cy="10" r="2.4" />
        </Svg>
      );
    case 'settings':
      return (
        <Svg {...box}>
          <Circle {...s} cx="12" cy="12" r="3" />
          <Path
            {...s}
            d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"
          />
        </Svg>
      );
    case 'search':
      return (
        <Svg {...box}>
          <Circle {...s} cx="11" cy="11" r="7" />
          <Path {...s} d="M21 21l-4-4" />
        </Svg>
      );
    case 'back':
      return (
        <Svg {...box}>
          <Path {...s} strokeWidth={2} d="M15 5l-7 7 7 7" />
        </Svg>
      );
    case 'plus':
      return (
        <Svg {...box}>
          <Path {...s} strokeWidth={2} d="M12 5v14M5 12h14" />
        </Svg>
      );
    case 'logout':
      return (
        <Svg {...box}>
          <Path {...s} d="M15 4h3a2 2 0 012 2v12a2 2 0 01-2 2h-3M10 8l-4 4 4 4M6 12h10" />
        </Svg>
      );
    case 'check':
      return (
        <Svg {...box}>
          <Path {...s} strokeWidth={2.4} d="M5 13l4 4L19 7" />
        </Svg>
      );
    case 'shield':
      return (
        <Svg {...box}>
          <Path {...s} d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" />
          <Path {...s} d="M9 12l2 2 4-4" />
        </Svg>
      );
    case 'star':
      return (
        <Svg {...box}>
          <Path
            {...s}
            fill={filled === true ? color : 'none'}
            stroke={filled === true ? 'none' : color}
            d="M12 2l2.9 6.2 6.6.8-4.9 4.6 1.3 6.6L12 17.8 6.1 20.8l1.3-6.6L2.5 9l6.6-.8L12 2z"
          />
        </Svg>
      );
    case 'menu':
      return (
        <Svg {...box}>
          <Path {...s} d="M4 7h16M4 12h16M4 17h16" />
        </Svg>
      );
    case 'chevron':
      return (
        <Svg {...box}>
          <Path {...s} strokeWidth={2} d="M9 6l6 6-6 6" />
        </Svg>
      );
    case 'x':
      return (
        <Svg {...box}>
          <Path {...s} strokeWidth={2} d="M6 6l12 12M18 6L6 18" />
        </Svg>
      );
    case 'sun':
      return (
        <Svg {...box}>
          <Circle {...s} cx="12" cy="12" r="4" />
          <Path
            {...s}
            d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6L19 19M19 5l-1.4 1.4M6.4 17.6L5 19"
          />
        </Svg>
      );
    case 'moon':
      return (
        <Svg {...box}>
          <Path {...s} d="M20 14a8 8 0 01-10.5-10.5 8 8 0 1010.5 10.5z" />
        </Svg>
      );
    case 'edit':
      return (
        <Svg {...box}>
          <Path {...s} d="M4 20h4L18 10a2 2 0 00-4-4L4 16v4z" />
          <Path {...s} d="M13 7l4 4" />
        </Svg>
      );
    case 'qr':
      return (
        <Svg {...box}>
          <Rect {...s} x="3" y="3" width="6" height="6" rx="1" />
          <Rect {...s} x="15" y="3" width="6" height="6" rx="1" />
          <Rect {...s} x="3" y="15" width="6" height="6" rx="1" />
          <Path {...s} d="M15 15h2v2M20 15h1M21 18v3M15 19v2M18 21h2" />
        </Svg>
      );
    case 'camera':
      return (
        <Svg {...box}>
          <Path
            {...s}
            d="M4 8h3l1.5-2h7L17 8h3a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z"
          />
          <Circle {...s} cx="12" cy="13" r="3.2" />
        </Svg>
      );
    case 'phone':
      return (
        <Svg {...box}>
          <Path
            {...s}
            d="M4 5c0 8 7 15 15 15l1.5-3.5-4-2-1.8 1.8a12 12 0 01-4.8-4.8L7.5 9.5l-2-4L4 5z"
          />
        </Svg>
      );
    case 'whatsapp':
      return (
        <Svg {...box}>
          <Path {...s} d="M4 20l1.3-4A8 8 0 1120 12a8 8 0 01-11.7 7L4 20z" />
          <Path
            {...s}
            d="M9 9.5c0 3 2.5 5.5 5.5 5.5.6 0 1-.6.8-1.1l-1-1.4-1.6.6a4 4 0 01-2.4-2.4l.6-1.6-1.4-1C9.6 8.5 9 8.9 9 9.5z"
          />
        </Svg>
      );
    case 'google':
      return (
        <Svg {...box}>
          <Path {...s} d="M12 11v3h4.2A4.3 4.3 0 1112 7.7c1.1 0 2.1.4 2.9 1.1" />
        </Svg>
      );
    case 'lock':
      return (
        <Svg {...box}>
          <Rect {...s} x="5" y="11" width="14" height="9" rx="2" />
          <Path {...s} d="M8 11V8a4 4 0 018 0v3" />
        </Svg>
      );
    case 'warn':
      return (
        <Svg {...box}>
          <Path {...s} d="M12 3.5L21 19.5H3L12 3.5z" />
          <Path {...s} d="M12 9.5v4.5" />
          <Path {...s} strokeWidth={2.4} d="M12 17.2v.1" />
        </Svg>
      );
    case 'info':
      return (
        <Svg {...box}>
          <Circle {...s} cx="12" cy="12" r="9" />
          <Path {...s} d="M12 11v5.5" />
          <Path {...s} strokeWidth={2.4} d="M12 7.6v.1" />
        </Svg>
      );
    case 'expand':
      return (
        <Svg {...box}>
          <Path {...s} d="M9 4H4v5M20 9V4h-5M15 20h5v-5M4 15v5h5" />
        </Svg>
      );
    case 'shrink':
      return (
        <Svg {...box}>
          <Path {...s} d="M4 9h5V4M20 9h-5V4M15 20v-5h5M9 20v-5H4" />
        </Svg>
      );
  }
}
