import { Text, View } from 'react-native';
import { ScreenScaffold } from '@/components/layout/ScreenScaffold';
import { ScreenTitle } from '@/components/layout/ScreenTitle';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { weekDates } from '@/lib/dates';
import { WEEKDAYS } from '@/lib/labels';
import { useApp } from '@/store/AppContext';
import { useTheme } from '@/theme/ThemeProvider';
import { colors } from '@/tokens/tokens';
import { LocationSwitcher } from './LocationSwitcher';
import { useActiveLocation } from './useActiveLocation';

/**
 * Jadwal angkut sepekan untuk titik layanan yang sedang dipilih.
 *
 * Yang ditampilkan pekan berjalan Senin–Minggu, bukan tujuh hari ke depan: hari angkut
 * zona ditetapkan per nama hari, dan kalender pekan penuh membuat hari yang sudah lewat
 * tetap terbaca — berguna untuk menilai apakah angkutan kemarin memang terlewat.
 */
export function PelangganJadwal() {
  const { zones, dataState } = useApp();
  const { active: customer, locations, select } = useActiveLocation();

  if (customer === undefined) {
    return (
      <ScreenScaffold>
        <View className="mt-6">
          <EmptyState
            icon="calendar"
            title={dataState === 'loading' ? 'Memuat jadwal…' : 'Belum ada titik layanan'}
            message={
              dataState === 'loading'
                ? 'Sedang mengambil titik layanan dan zona Anda.'
                : 'Jadwal angkut mengikuti zona titik layanan. Ajukan titik layanan dulu dari beranda.'
            }
          />
        </View>
      </ScreenScaffold>
    );
  }

  const zone = zones.find((z) => z.id === customer.zoneId);
  const days = zone?.schedule.days ?? [];
  const week = weekDates();

  return (
    <ScreenScaffold>
      <ScreenTitle eyebrow={zone?.name ?? 'Belum berzona'} title="Jadwal Angkut" />

      {/* Jadwal menempel pada zona, dan zona menempel pada titik — pelanggan bertitik
          banyak bisa punya dua jadwal berbeda, jadi pemilihnya ikut ke sini. */}
      {locations.length > 1 && (
        <LocationSwitcher locations={locations} activeId={customer.id} onSelect={select} />
      )}

      {days.length === 0 ? (
        <View className="rounded-xl2 bg-surface p-4 shadow-card">
          <Text className="text-[12.5px] text-dim">
            Zona layanan Anda belum punya jadwal angkut.
          </Text>
        </View>
      ) : (
        <View className="overflow-hidden rounded-xl2 bg-surface shadow-card">
          {week.map((day, index) => (
            <DayRow
              key={day.iso}
              // Urutan `weekDates()` (Senin dulu) sengaja disamakan dengan `WEEKDAYS`,
              // sehingga indeks yang sama menunjuk hari yang sama.
              name={WEEKDAYS[index].long}
              short={WEEKDAYS[index].short}
              // `label` berbentuk `27 Jul`; kolom tanggal hanya perlu angkanya.
              date={day.label.split(' ')[0]}
              today={day.isToday}
              time={days.includes(WEEKDAYS[index].id) ? (zone?.schedule.timeWindow ?? '') : null}
              last={index === week.length - 1}
            />
          ))}
        </View>
      )}

      <Note zone={zone?.name ?? 'layanan'} />
    </ScreenScaffold>
  );
}

/** Catatan kaki berlatar: aturan jadwal, bukan keterangan yang tercecer di bawah kartu. */
function Note({ zone }: { zone: string }) {
  const { mode } = useTheme();

  return (
    <View className="flex-row items-start gap-2.5 rounded-xl bg-surface2 px-3.5 py-3">
      <Icon name="info" size={15} color={colors[mode].olive} />
      <Text className="flex-1 text-[11.5px] leading-relaxed text-dim">
        Jadwal mengikuti zona {zone}. Perubahan hari angkut diumumkan dinas lewat notifikasi.
      </Text>
    </View>
  );
}

/**
 * Satu hari di kalender pekan. `time === null` berarti tak ada angkut hari itu — sengaja
 * tetap digambar, karena hari kosong itulah jawaban dari "besok diangkut atau tidak".
 */
function DayRow({
  name,
  short,
  date,
  today,
  time,
  last,
}: {
  name: string;
  short: string;
  date: string;
  today: boolean;
  time: string | null;
  last: boolean;
}) {
  const { mode } = useTheme();
  const angkut = time !== null;

  return (
    <View
      className={`flex-row items-center gap-3 px-4 py-[11px] ${
        last ? '' : 'border-b border-line'
      } ${today ? 'bg-surface2' : ''}`}
      // Garis olive di tepi kiri: penanda hari ini yang tetap terlihat walau latar
      // surface-2 nyaris sewarna kartu.
      style={today ? { borderLeftWidth: 3, borderLeftColor: colors[mode].olive } : undefined}
    >
      {/* Kolom tanggal menggantikan tujuh ikon truk yang identik — pola yang sama
          dengan ubin angkut di beranda, jadi pekan terbaca sekali pandang. */}
      <View className={`w-9 items-center ${today ? 'rounded-[10px] bg-olive py-1' : ''}`}>
        <Text
          className={`text-[10.5px] font-bold uppercase ${
            today ? 'text-white/80' : angkut ? 'text-olive' : 'text-dim'
          }`}
        >
          {short}
        </Text>
        <Text
          className={`text-[15px] font-extrabold ${
            today ? 'text-white' : angkut ? 'text-ink' : 'text-dim'
          }`}
        >
          {date}
        </Text>
      </View>
      <View className="flex-1 flex-row items-center gap-2">
        <Text className={`text-[13px] ${angkut ? 'font-bold text-ink' : 'font-semibold text-dim'}`}>
          {name}
        </Text>
        {today ? (
          <View className="rounded-full bg-olive px-2 py-0.5">
            <Text className="text-[10.5px] font-bold uppercase text-white">hari ini</Text>
          </View>
        ) : (
          angkut && <Icon name="truck" size={14} color={colors[mode].olive} />
        )}
      </View>
      <Text className={angkut ? 'text-[12.5px] font-bold text-ink' : 'text-[11.5px] text-dim'}>
        {angkut ? (time === '' ? 'Ada angkut' : time) : 'Tidak ada angkut'}
      </Text>
    </View>
  );
}
