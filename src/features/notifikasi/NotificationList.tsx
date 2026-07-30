import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { FlatList, Pressable, Text, View } from 'react-native';
import type { NotificationDto } from '@/api/types';
import { Icon } from '@/components/ui/Icon';
import { relativeTime } from '@/lib/dates';
import { useApp } from '@/store/AppContext';
import { useTheme } from '@/theme/ThemeProvider';
import { colors } from '@/tokens/tokens';
import { targetForNotification } from './notificationTarget';

/** Baris yang tampil sebelum diminta lebih, dan tambahannya tiap kali diminta. */
const FIRST_PAGE = 8;
const NEXT_PAGE = 5;

interface NotificationListProps {
  /** Daftar sedang dimuat ulang; hanya terlihat saat belum ada isi sama sekali. */
  loading: boolean;
  onClose: () => void;
}

/**
 * Isi lonceng — porting `NotificationList.tsx` web.
 *
 * Bedanya `FlatList`, bukan `.map()` di dalam div: server memulangkan sampai 50 baris
 * dan menggambar semuanya sekaligus membuat sheet tersendat saat dibuka. Pemotongan
 * 8+5 milik web tetap dipertahankan — lonceng bukan arsip.
 */
export function NotificationList({ loading, onClose }: NotificationListProps) {
  const {
    notifications,
    role,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications,
    dismissNotification,
  } = useApp();
  const navigation = useNavigation();
  const [shown, setShown] = useState(FIRST_PAGE);

  const unread = notifications.filter((n) => n.read_at === null).length;
  const sisa = notifications.length - shown;

  /**
   * Tekan = "saya tangani ini": ditandai terbaca lalu dibawa ke layar tindak lanjutnya.
   * Penandaan sengaja tidak ditunggu — layar tujuan justru butuh muatan datanya.
   */
  const open = (item: NotificationDto): void => {
    onClose();
    if (item.read_at === null) void markNotificationRead(item.id);
    const target = targetForNotification(item.type, role);
    if (target === null) return;
    // Satu-satunya tempat rute disebut sebagai string bebas: tujuannya datang dari
    // `type` milik server, yang tak bisa diperiksa tipe saat kompilasi.
    (navigation.navigate as (tab: string, params: object) => void)(target.tab, {
      screen: target.screen,
    });
  };

  return (
    <View className="flex-1">
      <View className="flex-row items-center gap-3 border-b border-line px-4 py-3">
        <Text className="flex-1 font-sans text-[13px] font-extrabold text-ink">Notifikasi</Text>
        {unread > 0 && (
          <Pressable
            accessibilityRole="button"
            onPress={() => void markAllNotificationsRead()}
            hitSlop={6}
          >
            <Text className="font-sans text-[11.5px] font-semibold text-olive">
              Tandai semua dibaca
            </Text>
          </Pressable>
        )}
        {notifications.length > 0 && (
          <Pressable
            accessibilityRole="button"
            onPress={() => void clearNotifications()}
            hitSlop={6}
          >
            <Text className="font-sans text-[11.5px] font-semibold text-dim">Kosongkan</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        data={notifications.slice(0, shown)}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Kosong loading={loading} />}
        renderItem={({ item }) => (
          <Baris
            item={item}
            onOpen={() => open(item)}
            onDismiss={() => void dismissNotification(item.id)}
          />
        )}
        ListFooterComponent={
          sisa > 0 ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setShown((n) => n + NEXT_PAGE)}
              className="w-full px-4 py-3"
            >
              <Text className="font-sans text-[11.5px] font-semibold text-olive">
                Muat {Math.min(NEXT_PAGE, sisa)} lagi · {sisa} tersisa
              </Text>
            </Pressable>
          ) : null
        }
      />
    </View>
  );
}

function Baris({
  item,
  onOpen,
  onDismiss,
}: {
  item: NotificationDto;
  onOpen: () => void;
  onDismiss: () => void;
}) {
  const { mode } = useTheme();
  const unread = item.read_at === null;
  return (
    <View className="flex-row items-start border-b border-line">
      <Pressable
        accessibilityRole="button"
        onPress={onOpen}
        className="min-w-0 flex-1 flex-row gap-2.5 py-3 pl-4"
      >
        {/* Titik penanda tetap memakan tempat meski sudah dibaca, supaya barisnya tak bergeser. */}
        <View
          className={`mt-[5px] h-2 w-2 flex-none rounded-full ${unread ? 'bg-olive' : 'bg-transparent'}`}
        />
        <View className="min-w-0 flex-1">
          <Text
            className={`font-sans text-[12.5px] leading-snug ${unread ? 'font-bold text-ink' : 'font-semibold text-dim'}`}
          >
            {item.title}
          </Text>
          {item.body !== null && item.body !== '' && (
            <Text className="mt-0.5 font-sans text-[11.5px] leading-snug text-dim">
              {item.body}
            </Text>
          )}
          <Text className="mt-1 font-sans text-[10.5px] text-dim">
            {relativeTime(item.created_at)}
          </Text>
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Buang notifikasi: ${item.title}`}
        onPress={onDismiss}
        className="h-11 w-11 flex-none items-center justify-center"
      >
        <Icon name="x" size={14} color={colors[mode]['text-dim']} />
      </Pressable>
    </View>
  );
}

function Kosong({ loading }: { loading: boolean }) {
  const { mode } = useTheme();
  return (
    <View className="items-center gap-2 px-4 py-8">
      <Icon name="bell" size={24} color={colors[mode]['text-dim']} />
      <Text className="text-center font-sans text-[12px] leading-snug text-dim">
        {loading ? 'Memuat notifikasi…' : 'Belum ada notifikasi.'}
      </Text>
    </View>
  );
}
