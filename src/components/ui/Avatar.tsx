import { Image, Text, View } from 'react-native';
import { fileHeaders } from '@/api/client';
import { Icon, type IconName } from './Icon';

interface AvatarProps {
  /** Nama untuk fallback inisial & label aksesibilitas. */
  name: string;
  /** URL foto profil di backend. */
  src?: string;
  /** Ukuran sisi (dp). */
  size?: number;
  /** Ikon fallback bila tanpa foto & inisial tidak diinginkan. */
  icon?: IconName;
  className?: string;
}

/**
 * Avatar profil: foto bila ada, jika tidak inisial nama atau ikon.
 *
 * Beda penting dari web: `headers` ikut dikirim. Backend mengalirkan foto profil di
 * balik bearer token alih-alih URL bertanda tangan, jadi `<Image>` tanpa header akan
 * menampilkan kotak kosong — dan kegagalannya sunyi, tak ada pesan apa pun.
 */
export function Avatar({ name, src, size = 46, icon, className = '' }: AvatarProps) {
  const box = { width: size, height: size, borderRadius: Math.round(size * 0.3) };

  if (src !== undefined && src !== '') {
    return (
      <Image
        source={{ uri: src, headers: fileHeaders() }}
        style={box}
        resizeMode="cover"
        accessibilityLabel={name}
        className={className}
      />
    );
  }

  return (
    <View
      style={box}
      accessibilityLabel={name}
      className={`items-center justify-center bg-olive ${className}`}
    >
      {icon !== undefined ? (
        <Icon name={icon} size={Math.round(size / 2)} color="#FFFFFF" />
      ) : (
        <Text
          style={{ fontSize: Math.round(size * 0.37) }}
          className="font-sans font-extrabold text-white"
        >
          {name.charAt(0).toUpperCase()}
        </Text>
      )}
    </View>
  );
}
