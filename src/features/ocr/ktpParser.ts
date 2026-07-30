/**
 * Pembacaan hasil OCR KTP menjadi isian formulir.
 *
 * Fungsi murni tanpa satu pun impor native — supaya bisa diuji dengan teks contoh,
 * tanpa kamera dan tanpa perangkat. Itu penting: satu-satunya cara memastikan
 * pembacaan tidak memburuk saat aturannya disetel adalah dengan mengujinya berulang
 * memakai teks KTP yang sama.
 *
 * Tidak ada yang dikirim ke server dari sini. Seluruh pengenalan berjalan di ponsel
 * (ML Kit on-device), dan hasilnya hanya mengisi kolom yang tetap bisa dikoreksi
 * pengguna sebelum ia menekan Daftar.
 */

export interface KtpFields {
  /** 16 digit; `null` bila tak ada deret yang meyakinkan. */
  identityNumber: string | null;
  fullName: string | null;
  gender: 'L' | 'P' | null;
}

/** Hasil pemindaian beserta bahan mentahnya, untuk ditampilkan saat pengguna mengoreksi. */
export interface KtpScan extends KtpFields {
  /** Baris teks apa adanya dari ML Kit — dipakai layar untuk menunjukkan apa yang terbaca. */
  lines: string[];
}

/** Label kolom yang lazim di KTP; dipakai untuk memotong nilai dari barisnya. */
const NAME_LABEL = /^\s*nama\s*[:.]?\s*/i;
const GENDER_LABEL = /jenis\s*kelamin/i;

/**
 * Angka yang mungkin NIK. Sengaja longgar di pemisahnya: OCR kerap menyisipkan spasi
 * setiap empat digit karena KTP mencetaknya berjarak, dan pola yang menuntut 16 digit
 * rapat akan gagal justru pada foto yang jelas.
 */
const NIK_CANDIDATE = /(?:\d[\s.\-]?){15}\d/g;

/**
 * Huruf yang sering tertukar pada deret angka. Hanya diterapkan pada calon NIK —
 * menerapkannya ke seluruh teks akan merusak nama yang memang berhuruf O atau I.
 */
const DIGIT_LOOKALIKE: Record<string, string> = { O: '0', o: '0', I: '1', l: '1', S: '5', B: '8' };

/** Baca seluruh blok teks OCR menjadi isian formulir. */
export function parseKtp(rawText: string): KtpScan {
  const lines = rawText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '');

  return {
    lines,
    identityNumber: findNik(lines),
    fullName: findName(lines),
    gender: findGender(lines),
  };
}

/**
 * NIK: 16 digit. Dicari di seluruh teks alih-alih pada baris berlabel "NIK" saja,
 * karena labelnya kerap gagal terbaca sementara angkanya — yang dicetak paling besar
 * di kartu — hampir selalu terbaca.
 */
function findNik(lines: string[]): string | null {
  for (const line of lines) {
    const repaired = line.replace(/[OoIlSB]/g, (ch) => DIGIT_LOOKALIKE[ch] ?? ch);
    for (const match of repaired.match(NIK_CANDIDATE) ?? []) {
      const digits = match.replace(/\D/g, '');
      if (digits.length === 16 && isPlausibleNik(digits)) return digits;
    }
  }
  return null;
}

/**
 * Saringan bentuk, bukan validasi identitas: dua digit pertama adalah kode provinsi
 * (11–94) dan digit 7–12 adalah tanggal lahir, dengan tanggal ditambah 40 untuk
 * perempuan. Tanpa saringan ini, nomor KK yang juga 16 digit dan tercetak di kartu
 * keluarga akan lolos sebagai NIK.
 */
function isPlausibleNik(digits: string): boolean {
  const province = Number(digits.slice(0, 2));
  if (province < 11 || province > 94) return false;

  const day = Number(digits.slice(6, 8));
  const month = Number(digits.slice(8, 10));
  const born = day > 40 ? day - 40 : day;

  return born >= 1 && born <= 31 && month >= 1 && month <= 12;
}

/**
 * Nama diambil dari baris berlabel "Nama". Bila labelnya dan nilainya terpisah baris —
 * yang lazim saat kolom kiri dan kanan terbaca sebagai dua blok — nilainya diambil
 * dari baris berikutnya.
 */
function findName(lines: string[]): string | null {
  for (let i = 0; i < lines.length; i += 1) {
    if (!NAME_LABEL.test(lines[i])) continue;
    const inline = lines[i].replace(NAME_LABEL, '').trim();
    const value = inline !== '' ? inline : (lines[i + 1] ?? '');
    const cleaned = cleanName(value);
    if (cleaned !== null) return cleaned;
  }
  return null;
}

/**
 * Nama pada KTP tercetak kapital dan hanya berisi huruf, spasi, titik, dan apostrof.
 * Baris yang mengandung angka hampir pasti bukan nama — biasanya NIK yang ikut
 * tertangkap di blok yang sama.
 */
function cleanName(value: string): string | null {
  const cleaned = value
    .replace(/[^A-Za-z.'\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.length >= 2 && cleaned.length <= 60 ? cleaned.toUpperCase() : null;
}

/** Jenis kelamin: dibaca dari kata LAKI/PEREMPUAN, bukan dari digit NIK. */
function findGender(lines: string[]): 'L' | 'P' | null {
  for (let i = 0; i < lines.length; i += 1) {
    const scope = GENDER_LABEL.test(lines[i]) ? `${lines[i]} ${lines[i + 1] ?? ''}` : lines[i];
    if (/perempuan/i.test(scope)) return 'P';
    if (/laki/i.test(scope)) return 'L';
  }
  return null;
}

/**
 * Jenis kelamin dari NIK sebagai cadangan: tanggal lahir ditambah 40 berarti perempuan.
 * Dipisah dari `findGender` supaya pemanggil sadar ia sedang menyimpulkan, bukan
 * membaca — dan bisa memilih untuk tidak mengisi kolomnya diam-diam.
 */
export function genderFromNik(nik: string): 'L' | 'P' | null {
  if (nik.length !== 16) return null;
  return Number(nik.slice(6, 8)) > 40 ? 'P' : 'L';
}
