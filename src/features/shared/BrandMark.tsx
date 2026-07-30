import { useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { useApp } from '@/store/AppContext';

interface BrandMarkProps {
  /** Kelas kotaknya — ukuran, sudut, dan warna berbeda tiap tempat pemakaian. */
  className: string;
  /** Sisi lambang di dalamnya (dp). Web memakai kelas; ikon RN diukur dengan angka. */
  iconSize: number;
  /** Warna ikon bawaan; logo yang diunggah tak terpengaruh. */
  color: string;
}

/**
 * Lambang aplikasi: logo yang diunggah bila ada, ikon bawaan bila belum.
 *
 * Aturan "kapan jatuh ke ikon bawaan" ditulis sekali di sini — termasuk kasus yang
 * mudah terlewat: URL logonya ada, tapi gambarnya gagal termuat. Tanpa itu layar masuk
 * menyisakan kotak kosong persis di tempat yang paling terlihat.
 */
export function BrandMark({ className, iconSize, color }: BrandMarkProps) {
  const { branding } = useApp();
  const [failed, setFailed] = useState(false);

  // Logo berganti → beri kesempatan sekali lagi; kegagalan yang lama bukan miliknya.
  useEffect(() => setFailed(false), [branding.logoUrl]);

  return (
    <View className={`${className} items-center justify-center overflow-hidden`}>
      {branding.logoUrl !== null && !failed ? (
        <Image
          source={{ uri: branding.logoUrl }}
          accessibilityLabel={branding.appName}
          resizeMode="contain"
          onError={() => setFailed(true)}
          style={{ width: iconSize, height: iconSize }}
        />
      ) : (
        <Icon name="trash" size={iconSize} color={color} />
      )}
    </View>
  );
}
