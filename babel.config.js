/**
 * Urutan preset/plugin di sini tidak bebas:
 * - `jsxImportSource: 'nativewind'` membuat `className` diterjemahkan NativeWind.
 * - Plugin Reanimated (yang di v4 dibawa `react-native-worklets`) WAJIB terakhir.
 */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
    plugins: ['react-native-worklets/plugin'],
  };
};
