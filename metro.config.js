const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

// `input` menunjuk berkas hasil generate scripts/gen-theme.mjs — di situlah CSS
// variable tema tinggal. Tanpa ini kelas seperti `bg-surface` tak punya nilai.
module.exports = withNativeWind(getDefaultConfig(__dirname), { input: './global.css' });
