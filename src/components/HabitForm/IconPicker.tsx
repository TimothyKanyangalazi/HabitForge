
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { lightTheme } from '../../theme/lightTheme';
import type { HabitType } from '../../types/db';
import { BREAK_ICONS, BUILD_ICONS } from '../../constants/breakHabits';

export interface IconPickerProps {
  habitType: HabitType;
  value: string | null;
  onChange: (icon: string) => void;
}

const BREAK_ACCENT = '#E4572E';
const BUILD_ACCENT = '#3B82F6';

export const IconPicker: React.FC<IconPickerProps> = ({
  habitType,
  value,
  onChange,
}) => {
  const theme = useTheme() ?? lightTheme;
  const colors = theme.colors ?? lightTheme.colors;
  const s = styles(colors);

  const icons = habitType === 'break' ? BREAK_ICONS : BUILD_ICONS;
  const accent = habitType === 'break' ? BREAK_ACCENT : BUILD_ACCENT;

  return (
    <View style={s.grid}>
      {icons.map((ic) => {
        const selected = value === ic.name;
        return (
          <Pressable
            key={ic.name}
            onPress={() => onChange(ic.name)}
            style={[
              s.cell,
              selected && { borderColor: accent, borderWidth: 2, backgroundColor: accent + '14' },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={ic.label}
          >
            {/* Replace Text with your Icon component if you use one. */}
            <Text style={[s.cellText, selected && { color: accent }]} numberOfLines={1}>
              {ic.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = (colors: any) =>
  StyleSheet.create({
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    cell: {
      width: '22%',
      aspectRatio: 1,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border ?? '#e5e5e5',
      backgroundColor: colors.card ?? '#fff',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 4,
    },
    cellText: {
      fontSize: 10,
      color: colors.text ?? '#111',
      textAlign: 'center',
    },
  });