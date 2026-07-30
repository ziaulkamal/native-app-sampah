/// <reference types="nativewind/types" />

// TypeScript 6 menolak impor efek-samping tanpa deklarasi (TS2882). `global.css` diproses
// Metro lewat NativeWind, jadi modulnya memang tak punya nilai — cukup dinyatakan ada.
declare module '*.css';
