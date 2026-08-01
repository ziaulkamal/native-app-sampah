import { Text, View } from 'react-native';
import { ScreenScaffold } from '@/components/layout/ScreenScaffold';
import { ScreenTitle } from '@/components/layout/ScreenTitle';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { weekDates } from '@/lib/dates';
import { WEEKDAYS } from '@/lib/labels';
import { useApp } from '@/store/AppContext';
import { useTheme } from '@/theme/ThemeProvider';
import { colors, semantic } from '@/tokens/tokens';
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
      <ScreenTitle
        eyebrow={zone?.name ?? 'Belum berzona'}
        title="Jadwal Angkut"
        action={<TruckMark />}
      />

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
        <View className="overflow-hidden rounded-xl3 bg-surface shadow-card">
          {week.map((day, index) => (
            <DayRow
              key={day.iso}
              // Urutan `weekDates()` (Senin dulu) sengaja disamakan dengan `WEEKDAYS`,
              // sehingga indeks yang sama menunjuk hari yang sama.
              name={WEEKDAYS[index].long}
              short={WEEKDAYS[index].short}
              // `label` berbentuk `27 Jul` — utuh, karena baris ini yang memikul tanggalnya.
              date={day.label}
              today={day.isToday}
              time={days.includes(WEEKDAYS[index].id) ? (zone?.schedule.timeWindow ?? '') : null}
              last={index === week.length - 1}
            />
          ))}
        </View>
      )}

      {/* Tanpa latar, menempel di bawah kartunya: ini keterangan tentang kartu di atasnya,
          bukan aturan yang berdiri sendiri seperti kotak jam di bawah. */}
      <Text className="-mt-1 px-0.5 text-[11.5px] leading-relaxed text-dim">
        Jadwal mengikuti zona {zone?.name ?? 'layanan'}. Perubahan hari angkut diumumkan dinas lewat
        notifikasi.
      </Text>

      <TimeNote window={zone?.schedule.timeWindow} />
    </ScreenScaffold>
  );
}

/** Lambang truk di kanan judul — penanda layar, bukan tombol. */
function TruckMark() {
  const { mode } = useTheme();
  // Di gelap olive (#A6B84B) dan lime (#C9E24A) hampir sewarna, jadi lingkarannya
  // dibalik: latar redup, truknya yang olive.
  const dark = mode === 'dark';

  return (
    <View
      className={`h-[42px] w-[42px] flex-none items-center justify-center rounded-full ${
        dark ? 'bg-pill' : 'bg-olive'
      }`}
    >
      <Icon name="truck" size={20} color={dark ? colors.dark.olive : colors.light.lime} />
    </View>
  );
}

/**
 * Kotak jam: satu hal yang harus dilakukan pelanggan, bukan keterangan tentang jadwal.
 *
 * Karena itu ia berlatar dan berikon sendiri, terpisah dari catatan zona di atasnya —
 * dua paragraf abu-abu berturut-turut membuat yang kedua tak pernah dibaca.
 */
function TimeNote({ window }: { window?: string }) {
  return (
    <View className="flex-row items-center gap-3 rounded-xl2 bg-pill p-4">
      <View className="h-[38px] w-[38px] flex-none items-center justify-center rounded-full bg-info/10">
        <Icon name="info" size={18} color={semantic.info} />
      </View>
      <Text className="flex-1 text-[12px] leading-relaxed text-ink">
        {window === undefined || window === '' ? (
          'Keluarkan sampah sebelum truk lewat di hari angkut agar tidak terlewat.'
        ) : (
          <>
            Keluarkan sampah sebelum jam angkut (<Text className="font-bold">{window}</Text>) agar
            tidak terlewat.
          </>
        )}
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
      className={`flex-row items-center gap-3 px-4 py-3.5 ${last ? '' : 'border-b border-line'} ${
        today ? 'bg-pill' : ''
      }`}
    >
      {/* Ubin truk, bukan kolom tanggal: hari angkut dan hari kosong dibedakan lewat
          nyala/padamnya ubin — terbaca sekali pandang sebelum satu kata pun dibaca. */}
      <View
        className={`h-[38px] w-[38px] flex-none items-center justify-center rounded-xl ${
          angkut ? 'bg-olive/[.14]' : 'bg-pill'
        }`}
      >
        <Icon name="truck" size={18} color={colors[mode][angkut ? 'olive' : 'text-dim']} />
      </View>

      <View className="min-w-0 flex-1">
        <View className="flex-row items-baseline gap-2">
          <Text
            className={`text-[13.5px] ${angkut ? 'font-bold text-ink' : 'font-semibold text-dim'}`}
          >
            {name}
          </Text>
          {today && (
            <Text className="font-sans text-[9.5px] font-bold uppercase tracking-widest text-olive">
              hari ini
            </Text>
          )}
        </View>
        {/* Nama hari sendiri tak menyebut tanggalnya — "Rabu" di pekan mana. */}
        <Text className="mt-1.5 text-[11px] text-dim">
          {short} · {date}
        </Text>
      </View>

      <Text className={`flex-none text-[12px] ${angkut ? 'font-semibold text-ink' : 'text-dim'}`}>
        {angkut ? (time === '' ? 'Ada angkut' : time) : 'Tidak ada angkut'}
      </Text>
    </View>
  );
}
