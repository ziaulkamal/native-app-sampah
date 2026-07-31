import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { updateMyAccount } from '@/api/account';
import { ApiError, toApiError } from '@/api/errors';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/FormField';
import { useApp } from '@/store/AppContext';

interface Shape {
  name: string;
  email: string;
  phone: string;
}

/**
 * Ubah identitas akun sendiri: nama sebutan, email, nomor HP.
 *
 * `username` **tidak** ada di sini, dan itu disengaja: ia identitas untuk masuk, bukan
 * sebutan. Servernya pun menolaknya bersama `role_id` — kewenangan tidak boleh bisa
 * dinaikkan sendiri lewat form profil.
 *
 * Email dan HP dikirim `null` saat dikosongkan, bukan string kosong: keduanya unik di
 * tabel `users`, dan dua akun ber-email `''` akan bertabrakan pada akun kedua.
 */
export function AkunIdentitasForm() {
  const { session, refreshSession, notify, notifyFail } = useApp();
  const [form, setForm] = useState<Shape>(shapeOf(session));
  const [saving, setSaving] = useState(false);
  // Tetap disimpan meski kegagalan sudah punya dialog: pesan per-isian ditempelkan pada
  // isian yang bersangkutan, dan itu tak bisa dipindahkan ke dialog tanpa kehilangan
  // keterangan mana yang salah (§23.4).
  const [failed, setFailed] = useState<ApiError | null>(null);

  // Sesi bisa berubah dari luar (unggah avatar ikut memuat ulang `/me`); isian
  // mengikutinya selama belum ada suntingan yang belum tersimpan.
  useEffect(() => setForm(shapeOf(session)), [session]);

  const dirty =
    session !== null &&
    (form.name.trim() !== session.name ||
      form.email.trim() !== (session.email ?? '') ||
      form.phone.trim() !== (session.phone ?? ''));

  const save = async () => {
    setSaving(true);
    setFailed(null);
    try {
      await updateMyAccount({
        name: form.name.trim(),
        email: blankToNull(form.email),
        phone: blankToNull(form.phone),
      });
      // Dibaca ulang dari `/me`, bukan ditebak dari isian: nama di header dan
      // pemeriksaan kewenangan sama-sama bersumber dari sesi.
      await refreshSession();
      notify('Perubahan identitas tersimpan.');
    } catch (cause) {
      const error = toApiError(cause);
      setFailed(error);
      // Penolakan per-isian sudah tertempel di isiannya; dialog di atasnya hanya
      // mengulang hal yang sama sambil menutupi isian yang harus dibetulkan.
      if (error.errors === undefined) notifyFail('Gagal menyimpan identitas', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="gap-3.5">
      <TextField
        label="Nama sebutan"
        value={form.name}
        onChangeText={(name) => setForm({ ...form, name })}
        hint={failed?.fieldError('name') ?? 'Nama yang tampil di aplikasi, bukan nama untuk masuk.'}
      />
      {/* Dua kolom milik web dilipat jadi satu: 360dp tak cukup untuk dua isian
          berdampingan tanpa memotong labelnya. */}
      <TextField
        label="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        textContentType="emailAddress"
        value={form.email}
        onChangeText={(email) => setForm({ ...form, email })}
        hint={failed?.fieldError('email') ?? 'Bisa dipakai masuk. Kosongkan bila tidak dipakai.'}
      />
      <TextField
        label="Nomor HP"
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        value={form.phone}
        onChangeText={(phone) => setForm({ ...form, phone })}
        hint={failed?.fieldError('phone') ?? 'Bisa dipakai masuk & menerima OTP.'}
      />

      {session?.username !== null && session?.username !== undefined && (
        <Text className="text-[11.5px] leading-snug text-dim">
          Username <Text className="font-bold text-ink">{session.username}</Text> dan kewenangan
          akun tidak bisa diubah dari sini — keduanya wewenang Super Admin.
        </Text>
      )}

      <Button
        label={saving ? 'Menyimpan…' : 'Simpan perubahan'}
        full
        onPress={() => void save()}
        disabled={!dirty || saving}
      />
    </View>
  );
}

const shapeOf = (
  session: { name: string; email: string | null; phone: string | null } | null,
): Shape => ({
  name: session?.name ?? '',
  email: session?.email ?? '',
  phone: session?.phone ?? '',
});

const blankToNull = (value: string): string | null => (value.trim() === '' ? null : value.trim());
