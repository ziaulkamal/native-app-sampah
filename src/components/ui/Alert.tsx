import { Text, View } from 'react-native';
import { useApp } from '@/store/AppContext';
import type { AlertTone } from '@/store/feedback';
import { semantic } from '@/tokens/tokens';
import { Button } from './Button';
import { Icon, type IconName } from './Icon';
import { Modal } from './Modal';

/**
 * Dialog umpan balik aksi — porting `components/ui/Alert.tsx` web.
 *
 * Dua hal web yang tak ikut: `useEscape` (tak ada papan ketik; penutup setaranya
 * tombol Back, yang sudah ditangani `Modal`) dan pemindahan fokus manual — TalkBack
 * sudah mengumumkan isi sheet begitu terbuka.
 */
export function AlertHost() {
  return (
    <>
      <FeedbackDialog />
      <ConfirmDialog />
    </>
  );
}

interface ToneStyle {
  icon: IconName;
  /** Warna ikon; teks pesan tetap `ink` supaya mudah dibaca. */
  color: string;
  ring: string;
}

const TONES: Record<AlertTone, ToneStyle> = {
  success: { icon: 'check', color: semantic.success, ring: 'bg-success/10' },
  // Segitiga disediakan untuk yang benar-benar rusak; penolakan yang masih bisa
  // diperbaiki pengguna memakai lingkaran — bentuknya sudah membedakan sebelum warnanya.
  fail: { icon: 'info', color: semantic.warning, ring: 'bg-warning/10' },
  error: { icon: 'warn', color: semantic.danger, ring: 'bg-danger/10' },
};

function FeedbackDialog() {
  const { alertSpec, closeAlert } = useApp();
  const tone = TONES[alertSpec?.tone ?? 'success'];

  return (
    <Modal
      open={alertSpec !== null}
      onClose={closeAlert}
      title={alertSpec?.title ?? ''}
      footer={
        <Button
          size="sm"
          variant={alertSpec?.tone === 'success' ? 'primary' : 'secondary'}
          label="Tutup"
          onPress={closeAlert}
        />
      }
    >
      <DialogBody tone={tone} message={alertSpec?.message ?? ''} code={alertSpec?.code} />
    </Modal>
  );
}

/**
 * Konfirmasi aksi merusak. Batal adalah jawaban bawaannya: menutup lewat overlay,
 * tombol X, atau tombol Back sama artinya dengan tidak jadi — hanya tombol merah
 * yang berarti "ya".
 */
function ConfirmDialog() {
  const { pendingConfirm, answerConfirm } = useApp();
  const cancel = () => answerConfirm(false);

  return (
    <Modal
      open={pendingConfirm !== null}
      onClose={cancel}
      title={pendingConfirm?.title ?? ''}
      footer={
        <>
          <Button
            size="sm"
            variant="secondary"
            label={pendingConfirm?.cancelLabel ?? 'Batal'}
            onPress={cancel}
          />
          <Button
            size="sm"
            variant={pendingConfirm?.tone ?? 'danger'}
            label={pendingConfirm?.confirmLabel ?? 'Lanjutkan'}
            onPress={() => answerConfirm(true)}
          />
        </>
      }
    >
      <DialogBody
        tone={pendingConfirm?.tone === 'primary' ? TONES.fail : TONES.error}
        message={pendingConfirm?.message ?? ''}
      />
    </Modal>
  );
}

function DialogBody({ tone, message, code }: { tone: ToneStyle; message: string; code?: string }) {
  return (
    <View accessibilityViewIsModal className="flex-row gap-4">
      <View className={`h-11 w-11 flex-none items-center justify-center rounded-full ${tone.ring}`}>
        <Icon name={tone.icon} size={22} color={tone.color} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="font-sans text-[13.5px] leading-6 text-ink">{message}</Text>
        {code !== undefined && <Text className="mt-2 font-mono text-[11px] text-dim">{code}</Text>}
      </View>
    </View>
  );
}
