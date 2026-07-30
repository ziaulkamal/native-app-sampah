/**
 * Menimpa `app.json` dengan nilai dari lingkungan saat build.
 *
 * Alasannya satu: alamat backend dibekukan ke dalam APK (lihat src/api/config.ts),
 * jadi build staging dan build produksi adalah dua artefak berbeda. Tanpa berkas ini,
 * membedakannya berarti menyunting `app.json` sebelum tiap build — dan berkas yang
 * disunting sebelum build cepat atau lambat ikut ter-commit dengan alamat yang salah.
 *
 * Expo CLI memuat `.env` sebelum mengevaluasi berkas ini, jadi `.env` lokal cukup
 * untuk pengembangan; CI/EAS menyuntik variabel yang sama sebagai env biasa.
 */
module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    apiBaseUrl: process.env.API_BASE_URL || config.extra.apiBaseUrl,
    apiClientKey: process.env.API_CLIENT_KEY || config.extra.apiClientKey,
  },
  android: {
    ...config.android,
    // Tiap build CI perlu versionCode sendiri; dua APK bernomor sama tak bisa saling menimpa.
    versionCode: Number(process.env.ANDROID_VERSION_CODE) || config.android.versionCode,
  },
  plugins: allowCleartext() ? withCleartext(config.plugins) : config.plugins,
});

/** Sakelar env dibaca ketat: hanya "1"/"true" yang menyalakan, string kosong tidak. */
const allowCleartext = () => ['1', 'true'].includes(process.env.ANDROID_ALLOW_CLEARTEXT ?? '');

/**
 * Android 9+ memblokir HTTP polos, dan template Expo hanya membukanya untuk varian **debug** —
 * jadi APK release yang menunjuk backend `http://` gagal total tanpa pesan yang menyebut
 * sebabnya. Dibuat sakelar, bukan bawaan: menyalakannya berarti token bearer melintas terbuka,
 * jadi ia hanya pantas untuk uji lapangan sebelum backend punya TLS.
 */
function withCleartext(plugins) {
  return plugins.map((entry) => {
    if (!Array.isArray(entry) || entry[0] !== 'expo-build-properties') return entry;
    const [name, props] = entry;
    return [name, { ...props, android: { ...props.android, usesCleartextTraffic: true } }];
  });
}
