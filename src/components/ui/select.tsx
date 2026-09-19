import { StyleSheet, Text, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Brand } from '@/constants/theme';

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
}

export function Select({ label, value, onChange, options, placeholder }: SelectProps) {
  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.pickerBox}>
        <Picker selectedValue={value} onValueChange={(v) => onChange(String(v))}>
          {placeholder && <Picker.Item label={placeholder} value="" />}
          {options.map((o) => (
            <Picker.Item key={o.value} label={o.label} value={o.value} />
          ))}
        </Picker>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 4 },
  label: { fontSize: 13, color: Brand.muted, fontWeight: '500' },
  pickerBox: {
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 10,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
});
