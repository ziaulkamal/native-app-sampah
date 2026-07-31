import { useState } from 'react';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { Image, Text, View } from 'react-native';
import { documentSource } from '@/api/customers';
import type { RootStackParams } from '@/navigation/types';
import { useApp } from '@/store/AppContext';

/** Baris & kolom tanda air; cukup rapat untuk ikut terbawa di potongan tangkapan layar. */
const ROWS = [0, 1, 2, 3, 4, 5];
const COLS = [0, 1];

/**
 * Penampil berkas identitas di dalam aplikasi.
 *
 * Web menariknya sebagai blob lalu merender `blob:` URL supaya alamatnya tak bisa
 * disalin. Di RN masalah itu tak ada — tak ada address bar dan tak ada tab baru — jadi
 * berkasnya dirender `<Image>` langsung dari endpoint bertoken lewat `documentSource()`.
 *
 * Batasnya jujur saja: tangkapan layar dan foto layar tidak bisa dicegah teknologi apa
 * pun. Tanda air di sini bukan penghalang, melainkan penanda — bila gambar KTP beredar,
 * nama akun yang membukanya ikut terbawa, dan tiap pembukaan sudah tercatat di log
 * aktivitas server sebagai `document.viewed`.
 */
export function DocumentViewer() {
  const { params } = useRoute<RouteProp<RootStackParams, 'Dokumen'>>();
  const { session } = useApp();
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);

  const who = session?.name ?? 'Pengguna';
  const stamp = `${who} · ${new Date().toLocaleString('id-ID')}`;

  return (
    <View className="flex-1 bg-bg">
      <View className="flex-1 items-center justify-center overflow-hidden bg-black/85">
        {failed ? (
          <Text
            accessibilityRole="alert"
            className="p-6 text-center text-[12.5px] font-semibold text-white/90"
          >
            Berkas gagal dimuat. Periksa sambungan lalu buka kembali dari daftar berkas.
          </Text>
        ) : (
          <>
            <Image
              source={documentSource(params.documentId)}
              resizeMode="contain"
              accessibilityLabel={params.title}
              onLoad={() => setReady(true)}
              onError={() => setFailed(true)}
              className="h-full w-full"
            />
            {!ready && <Text className="absolute text-[12.5px] text-white/70">Memuat berkas…</Text>}
          </>
        )}

        {/* Tanda air. `pointerEvents="none"` supaya cubit-perbesar gambar tetap lolos. */}
        {ready && !failed && (
          <View
            pointerEvents="none"
            accessibilityElementsHidden
            className="absolute inset-0 justify-around overflow-hidden"
            style={{ transform: [{ rotate: '-24deg' }, { scale: 1.6 }] }}
          >
            {ROWS.map((row) => (
              <View key={row} className="flex-row justify-around">
                {COLS.map((col) => (
                  <Text
                    key={col}
                    numberOfLines={1}
                    className="text-[11px] font-semibold tracking-wide text-white/25"
                  >
                    {stamp}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        )}
      </View>

      <View className="border-t border-line px-5 py-3">
        <Text className="text-[11px] leading-snug text-dim">
          Berkas identitas. Pembukaan ini tercatat atas nama{' '}
          <Text className="font-bold text-ink">{who}</Text>. Dilarang menyalin, memotret, atau
          meneruskan isinya ke luar aplikasi.
        </Text>
      </View>
    </View>
  );
}
