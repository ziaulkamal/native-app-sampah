import { useState } from 'react';
import { Text, View } from 'react-native';
import { ScreenScaffold } from '@/components/layout/ScreenScaffold';
import { SubScreenHeader } from '@/components/layout/SubScreenHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SelectField, TextareaField } from '@/components/ui/FormField';
import { Icon } from '@/components/ui/Icon';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { COMPLAINT_STATUS } from '@/lib/labels';
import { usePagination } from '@/lib/pagination';
import { useApp } from '@/store/AppContext';

const TYPES = ['Sampah tidak terangkut', 'Jadwal tidak sesuai', 'Tarif tidak sesuai', 'Lainnya'];
const TYPE_OPTS = TYPES.map((t) => ({ value: t, label: t }));

/** Aduan pelanggan: daftar aduan sendiri + buat aduan baru. */
export function PelangganAduan() {
  const { complaints, addComplaint } = useApp();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(TYPES[0]);
  const [desc, setDesc] = useState('');

  // `/my/complaints` sudah dibatasi server ke pelanggan yang masuk.
  const mine = complaints;
  const { items: shown, bind } = usePagination(mine);

  const openForm = () => {
    setType(TYPES[0]);
    setDesc('');
    setOpen(true);
  };
  const submit = () => {
    if (!desc.trim()) return;
    void addComplaint(type, desc);
    setOpen(false);
  };

  return (
    <ScreenScaffold>
      <SubScreenHeader title="Aduan Saya" />

      <Button
        label="Buat Aduan"
        full
        icon={<Icon name="plus" size={20} color="#fff" />}
        onPress={openForm}
      />

      <View className="gap-3">
        {shown.map((a) => {
          const st = COMPLAINT_STATUS[a.status];
          return (
            <View key={a.id} className="rounded-xl2 bg-surface p-4 shadow-card">
              <View className="flex-row items-center justify-between gap-2">
                <Text className="flex-1 text-[14px] font-bold text-ink" numberOfLines={1}>
                  {a.type}
                </Text>
                <Badge label={st.label} tone={st.tone} />
              </View>
              <Text className="mt-1.5 text-[12.5px] leading-relaxed text-ink/80">
                {a.description}
              </Text>
              <Text className="mt-2 text-[11px] text-dim">{a.createdAt}</Text>
            </View>
          );
        })}
        {mine.length === 0 && (
          <EmptyState
            icon="bell"
            title="Belum ada aduan"
            message="Aduan yang Anda buat akan tampil di sini."
          />
        )}
        <Pagination {...bind} unit="aduan" className="rounded-xl2 bg-surface shadow-card" />
      </View>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Buat Aduan"
        footer={
          <>
            <Button label="Batal" variant="ghost" size="sm" onPress={() => setOpen(false)} />
            <Button label="Kirim Aduan" size="sm" onPress={submit} />
          </>
        }
      >
        <View className="gap-4">
          <SelectField label="Jenis aduan" options={TYPE_OPTS} value={type} onChange={setType} />
          <TextareaField
            label="Deskripsi"
            value={desc}
            onChangeText={setDesc}
            placeholder="Ceritakan detail keluhan Anda…"
            rows={4}
          />
        </View>
      </Modal>
    </ScreenScaffold>
  );
}
