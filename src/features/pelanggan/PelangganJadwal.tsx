import { Text, View } from 'react-native';
import { ScreenScaffold } from '@/components/layout/ScreenScaffold';
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
      <View>
        <Text className="text-[9.5px] font-semibold uppercase tracking-wider text-olive">
          {zone?.name ?? 'Belum berzona'}
        </Text>
        <Text className="text-[20px] font-extrabold text-ink">Jadwal Angkut</Text>
      </View>

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
              date={day.label}
              today={day.isToday}
              time={days.includes(WEEKDAYS[index].id) ? (zone?.schedule.timeWindow ?? '') : null}
              last={index === week.length - 1}
            />
          ))}
        </View>
      )}

      <Text className="px-1 text-[11.5px] leading-snug text-dim">
        Jadwal mengikuti zona {zone?.name ?? 'layanan'}. Perubahan hari angkut diumumkan dinas lewat
        notifikasi.
      </Text>
    </ScreenScaffold>
  );
}

/**
 * Satu hari di kalender pekan. `time === null` berarti tak ada angkut hari itu — sengaja
 * tetap digambar, karena hari kosong itulah jawaban dari "besok diangkut atau tidak".
 */
function DayRow({
  name,
  date,
  today,
  time,
  last,
}: {
  name: string;
  date: string;
  today: boolean;
  time: string | null;
  last: boolean;
}) {
  const { mode } = useTheme();
  const angkut = time !== null;

  return (
    <View
      className={`flex-row items-center gap-3 px-4 py-3 ${last ? '' : 'border-b border-line'} ${
        today ? 'bg-pill' : ''
      }`}
    >
      <View
        className={`h-9 w-9 items-center justify-center rounded-[12px] ${
          angkut ? 'bg-olive/15' : 'bg-pill'
        }`}
      >
        <Icon
          name="truck"
          size={18}
          color={angkut ? colors[mode].olive : colors[mode]['text-dim']}
        />
      </View>
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text
            className={`text-[13px] ${angkut ? 'font-bold text-ink' : 'font-semibold text-dim'}`}
          >
            {name}
          </Text>
          {today && (
            <Text className="text-[10.5px] font-semibold uppercase text-olive">hari ini</Text>
          )}
        </View>
        <Text className="mt-0.5 text-[11px] text-dim">{date}</Text>
      </View>
      <Text className={`text-[12px] ${angkut ? 'font-semibold text-ink' : 'text-dim'}`}>
        {angkut ? (time === '' ? 'Ada angkut' : time) : 'Tidak ada angkut'}
      </Text>
    </View>
  );
}
