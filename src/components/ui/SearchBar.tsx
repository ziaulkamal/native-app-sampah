import { Pressable, TextInput, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { colors } from '@/tokens/tokens';
import { Icon } from './Icon';

interface SearchBarProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
}

/**
 * Kotak cari. Web menulisnya sebaris demi sebaris di tiap layar; di sini jadi satu
 * komponen karena tombol hapus dan warna placeholder harus diisi eksplisit di RN.
 */
export function SearchBar({ value, onChangeText, placeholder }: SearchBarProps) {
  const { mode } = useTheme();

  return (
    <View className="h-11 flex-row items-center gap-2.5 rounded-xl border border-line bg-surface px-3.5">
      <Icon name="search" size={18} color={colors[mode]['text-dim']} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        // `ph` itu warna LATAR placeholder di web, bukan warna teksnya — dipakai di
        // sini teksnya nyaris tak terbaca. Warna teks redup yang benar `text-dim`.
        placeholderTextColor={colors[mode]['text-dim']}
        returnKeyType="search"
        className="flex-1 text-[13.5px] text-ink"
      />
      {value !== '' && (
        <Pressable
          onPress={() => onChangeText('')}
          accessibilityLabel="Hapus pencarian"
          hitSlop={8}
        >
          <Icon name="x" size={16} color={colors[mode]['text-dim']} />
        </Pressable>
      )}
    </View>
  );
}
