import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NotificationList } from './NotificationList';

interface NotificationSheetProps {
  open: boolean;
  loading: boolean;
  onClose: () => void;
}

/**
 * Bottom sheet lonceng — porting `NotificationSheet.tsx` web, yang di sana sudah
 * berupa sheet. Bahasa visualnya sengaja sama dengan `ui/Modal`; tidak memakai
 * komponen itu langsung karena isinya `FlatList` yang butuh tinggi tetap, bukan
 * `ScrollView` yang tumbuh mengikuti isinya.
 */
export function NotificationSheet({ open, loading, onClose }: NotificationSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 justify-end">
        <Pressable
          accessibilityLabel="Tutup"
          onPress={onClose}
          className="absolute inset-0 bg-black/45"
        />
        <View
          accessibilityLabel="Notifikasi"
          style={{ height: '80%', paddingBottom: insets.bottom }}
          className="overflow-hidden rounded-t-[22px] bg-surface shadow-pop"
        >
          {/* Pegangan sheet: penanda arah tutup, sekaligus jarak aman dari tepi layar. */}
          <View className="flex-none items-center pb-1 pt-2.5">
            <View className="h-1 w-10 rounded-full bg-line" />
          </View>
          <NotificationList loading={loading} onClose={onClose} />
        </View>
      </View>
    </Modal>
  );
}
