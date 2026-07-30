import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/store/AppContext';
import type { ToastSpec } from '@/store/feedback';
import { Icon } from './Icon';

/** Berapa lama satu toast bertahan sebelum menghilang sendiri. */
const LIFETIME_MS = 3500;

/**
 * Umpan balik singkat untuk aksi yang efeknya sudah terlihat di layar.
 *
 * Dipasang sekali di akar. `position: fixed` web diganti overlay absolut; jaraknya
 * dari bawah dihitung dari `useSafeAreaInsets()` + tinggi tab bar, bukan angka tetap
 * seperti `bottom-24` — tinggi bilah navigasi Android berbeda antar perangkat.
 */
export function ToastHost() {
  const { toasts } = useApp();
  const insets = useSafeAreaInsets();
  if (toasts.length === 0) return null;

  return (
    <View
      pointerEvents="box-none"
      style={{ bottom: insets.bottom + 72 }}
      className="absolute left-4 right-4 z-50 items-center gap-2"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </View>
  );
}

function ToastItem({ toast }: { toast: ToastSpec }) {
  const { dismissToast } = useApp();
  const good = toast.tone === 'success';

  useEffect(() => {
    const timer = setTimeout(() => dismissToast(toast.id), LIFETIME_MS);
    return () => clearTimeout(timer);
  }, [toast.id, dismissToast]);

  return (
    <Pressable
      accessibilityRole="alert"
      accessibilityLabel={toast.message}
      onPress={() => dismissToast(toast.id)}
      className={`w-full max-w-[420px] flex-row items-center gap-2.5 rounded-2xl py-3 pl-3.5 pr-4 shadow-pop ${
        good ? 'bg-success' : 'bg-danger'
      }`}
    >
      <Icon name={good ? 'check' : 'warn'} size={18} color="#FFFFFF" />
      <Text className="flex-1 font-sans text-[13px] font-semibold leading-5 text-white">
        {toast.message}
      </Text>
    </Pressable>
  );
}
