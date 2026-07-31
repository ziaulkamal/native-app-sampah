import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { useApp } from '@/store/AppContext';
import { useTheme } from '@/theme/ThemeProvider';
import { colors, typography } from '@/tokens/tokens';
import { NotificationSheet } from './NotificationSheet';

/**
 * Lonceng notifikasi + lencana belum-dibaca. Angkanya diturunkan dari daftar yang
 * sudah ada di store, bukan dari state tersendiri — satu sumber, jadi lencana tak
 * pernah menyimpang dari isi panelnya.
 *
 * Prop `variant` web dilepas: di ponsel hanya ada satu cara panel ini muncul, dan
 * dropdown-nya memang tak ikut diporting (lihat docs/MAPPING.md §4).
 */
export function NotificationBell({ onHero = false }: { onHero?: boolean }) {
  const { notifications, refreshNotifications } = useApp();
  const { mode } = useTheme();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const unread = notifications.filter((n) => n.read_at === null).length;

  const show = (): void => {
    setOpen(true);
    // Membuka panel = saat pengguna paling ingin isinya mutakhir; denyut berkala
    // hanya menjaga angka lencananya di antara dua pembukaan.
    setLoading(true);
    void refreshNotifications().finally(() => setLoading(false));
  };

  return (
    <View className={onHero ? 'flex-none' : 'mr-3 flex-none'}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={unread === 0 ? 'Notifikasi' : `Notifikasi, ${unread} belum dibaca`}
        onPress={show}
        hitSlop={8}
        className={`h-10 w-10 items-center justify-center rounded-full ${
          onHero ? 'border border-white/25' : 'bg-pill'
        }`}
      >
        <Icon name="bell" size={20} color={onHero ? '#FFFFFF' : colors[mode].text} />
        {/* Di kepala yang penuh warna, angka merah kecil hilang: di sana penanda
            belum-dibaca cukup satu titik lime, jumlahnya toh ada di dalam panelnya. */}
        {unread > 0 &&
          (onHero ? (
            <View className="absolute right-1 top-1.5 h-[9px] w-[9px] rounded-full bg-lime" />
          ) : (
            <View className="absolute -right-0.5 -top-0.5 min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger px-1">
              <Text
                maxFontSizeMultiplier={typography.maxScale}
                className="font-sans text-[10px] font-bold text-white"
              >
                {unread > 99 ? '99+' : unread}
              </Text>
            </View>
          ))}
      </Pressable>
      <NotificationSheet open={open} loading={loading} onClose={() => setOpen(false)} />
    </View>
  );
}
