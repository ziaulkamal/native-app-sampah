import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { deleteMyAvatar, uploadMyAvatar } from '@/api/account';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { pickFromGallery } from '@/lib/pickImage';
import { prepareImage } from '@/lib/upload';
import { useApp } from '@/store/AppContext';

interface Props {
  name: string;
  size?: number;
}

/**
 * Foto profil sendiri, bisa diganti langsung dari layar Profil.
 *
 * Sesi dibaca ulang setelah unggahan berhasil, bukan ditebak dari berkas lokal:
 * URL-nya ditentukan server, dan pratinjau dari uri galeri akan tetap tampak
 * berhasil meski penyimpanannya gagal di tengah jalan.
 *
 * Beda dari web: tak ada penolakan "berkas kebesaran" di muka. `prepareImage()`
 * sudah mengecilkan gambar sebelum dikirim, jadi yang tersisa untuk ditolak hanya
 * bisa ditentukan server.
 */
export function AvatarPicker({ name, size = 92 }: Props) {
  const { session, refreshSession, notifyFail, askConfirm } = useApp();
  const [busy, setBusy] = useState(false);
  const hasPhoto = (session?.avatarUrl ?? null) !== null;

  // Berhasil tak perlu diberitakan: fotonya langsung berganti di tempat. Gagal lewat
  // dialog — alasannya (ukuran, jenis berkas) tak muat di lebar avatar (§23).
  const pick = async () => {
    setBusy(true);
    try {
      const picked = await pickFromGallery();
      if (picked === null) return;
      await uploadMyAvatar(await prepareImage(picked, 'foto-profil.jpg'));
      await refreshSession();
    } catch (cause) {
      notifyFail('Gagal mengunggah foto', cause);
    } finally {
      setBusy(false);
    }
  };

  // Menghapus foto berarti kehilangan berkas aslinya di server — tak ada "kembalikan",
  // jadi ditanya dulu. Berhasilnya tak perlu toast: avatarnya langsung berganti
  // kembali ke huruf awal nama, dan itu buktinya sendiri (§23).
  const remove = async () => {
    const agreed = await askConfirm({
      title: 'Hapus foto profil?',
      message:
        'Foto akan dilepas dari akun Anda dan berkasnya dihapus dari server. Tampilan kembali ke huruf awal nama.',
      confirmLabel: 'Hapus foto',
    });
    if (!agreed) return;

    setBusy(true);
    try {
      await deleteMyAvatar();
      await refreshSession();
    } catch (cause) {
      notifyFail('Gagal menghapus foto', cause);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="items-center gap-2">
      <View>
        <Avatar name={name} src={session?.avatarUrl ?? undefined} size={size} icon="user" />
        <Pressable
          onPress={() => void pick()}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={hasPhoto ? 'Ganti foto profil' : 'Tambah foto profil'}
          className={`absolute -bottom-1 -right-1 h-8 w-8 items-center justify-center rounded-full bg-olive shadow-card ${
            busy ? 'opacity-60' : ''
          }`}
        >
          <Icon name="camera" size={16} color="#fff" />
        </Pressable>
      </View>

      {busy ? (
        <Text className="text-[11px] text-dim">Menyimpan…</Text>
      ) : (
        // Tombol hapus hanya muncul saat ada yang bisa dihapus: tombol mati yang
        // selalu terpasang cuma menambah bunyi di layar profil yang sudah padat.
        hasPhoto && (
          <Pressable onPress={() => void remove()} accessibilityRole="button">
            <Text className="text-[11px] font-semibold text-danger">Hapus foto</Text>
          </Pressable>
        )
      )}
    </View>
  );
}
