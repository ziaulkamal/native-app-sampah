import { useState } from 'react';
import { Text, View } from 'react-native';
import { changeMyPassword } from '@/api/auth';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/FormField';
import { Modal } from '@/components/ui/Modal';
import { useApp } from '@/store/AppContext';

const MIN_LENGTH = 8;

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * Ganti kata sandi sendiri — dipakai semua role, karena semua role memilikinya.
 *
 * Kata sandi lama wajib diisi: itulah yang membuktikan pemegang layar adalah pemilik
 * akun, bukan orang yang kebetulan menemukan perangkat tak terkunci.
 *
 * Sesi ini tetap hidup setelah berhasil (server hanya mencabut sesi lain), jadi tidak
 * ada logout paksa yang perlu ditangani di sini.
 */
export function GantiPasswordModal({ open, onClose }: Props) {
  const { notifyFail } = useApp();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    // Dikosongkan saat menutup, bukan dibiarkan: kata sandi tidak boleh menganggur
    // di memori komponen sampai layar ini dibuka lagi oleh siapa pun berikutnya.
    setCurrent('');
    setNext('');
    setConfirm('');
    setDone(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  // Kecocokan konfirmasi diperiksa di sini supaya salah ketik ketahuan sebelum
  // kata sandi lama ikut terkirim ke server.
  const mismatch = confirm !== '' && next !== confirm;
  const maySave =
    current !== '' && next.length >= MIN_LENGTH && !mismatch && confirm !== '' && !saving;

  // Berhasil tetap dilaporkan panel `done` di dalam modal ini, bukan toast: yang penting
  // bukan "tersimpan" melainkan bahwa perangkat lain ikut dikeluarkan (§23.5).
  const submit = async () => {
    setSaving(true);
    try {
      await changeMyPassword(current, next);
      setDone(true);
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (cause) {
      notifyFail('Kata sandi gagal diganti', cause);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Ganti kata sandi"
      footer={
        done ? (
          <Button label="Selesai" onPress={close} />
        ) : (
          <>
            <Button label="Batal" variant="ghost" onPress={close} />
            <Button
              label={saving ? 'Menyimpan…' : 'Simpan'}
              onPress={() => void submit()}
              disabled={!maySave}
            />
          </>
        )
      }
    >
      {done ? (
        <Text className="text-[13px] leading-relaxed text-ink">
          Kata sandi berhasil diganti. Perangkat lain yang masih masuk dengan kata sandi lama sudah
          dikeluarkan.
        </Text>
      ) : (
        <View className="gap-3.5">
          <TextField
            label="Kata sandi saat ini"
            secureTextEntry
            textContentType="password"
            value={current}
            onChangeText={setCurrent}
          />
          <TextField
            label="Kata sandi baru"
            secureTextEntry
            textContentType="newPassword"
            value={next}
            onChangeText={setNext}
            hint={`Minimal ${MIN_LENGTH} karakter.`}
          />
          <TextField
            label="Ulangi kata sandi baru"
            secureTextEntry
            textContentType="newPassword"
            value={confirm}
            onChangeText={setConfirm}
            hint={mismatch ? 'Belum sama dengan kata sandi baru.' : undefined}
          />
        </View>
      )}
    </Modal>
  );
}
