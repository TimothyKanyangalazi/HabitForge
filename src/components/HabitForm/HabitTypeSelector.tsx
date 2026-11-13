// src/components/HabitForm/HabitTypeSelector.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { lightTheme } from '../../theme';
import { HABIT_TYPE_OPTIONS } from '../constants/breakHabit';
import type { HabitType } from '../../types';

export interface HabitTypeSelectorProps {
  value: HabitType;
  onChange: (v: HabitType) => void;
}

/** Per-type accent colors, with a theme primary fallback. */
const ACCENT_COLORS: Record<HabitType, string> = {
  build: '#3B82F6', // primary blue
  break: '#E4572E', // warm red/orange
};

export const HabitTypeSelector: React.FC<HabitTypeSelectorProps> = ({
  value,
  onChange,
}) => {
  const theme = useTheme() ?? lightTheme;
  const colors = theme.colors ?? lightTheme.colors;
  const s = styles(colors);

  return (
    <View style={s.row} accessibilityRole="radiogroup">
      {HABIT_TYPE_OPTIONS.map((opt) => {
        const selected = opt.value === value;
        const accent =
          ACCENT_COLORS[opt.value as HabitType] ?? colors.primary;

        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[
              s.card,
              {
                borderColor: selected ? accent : colors.border ?? '#e5e5e5',
                borderWidth: selected ? 2 : 1,
                backgroundColor: selected
                  ? accent + '11'
                  : colors.card ?? '#fff',
              },
            ]}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={opt.label}
          >
            <View style={[s.iconBubble, { backgroundColor: accent + '22' }]}>
              <Ionicons
                name={opt.icon as any}
                size={20}
                color={accent}
              />
            </View>
            <Text style={[s.title, { color: colors.text }]}>
              {opt.label}
            </Text>
            <Text style={[s.subtitle, { color: colors.text ?? '#333' }]}>
              {opt.description}
            </Text>
            {'example' in opt && (opt as any).example ? (
              <Text style={[s.example, { color: colors.textMuted ?? '#777' }]}>
                {(opt as any).example}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = (colors: any) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: 12,
    },
    card: {
      flex: 1,
      padding: 16,
      borderRadius: 16,
      alignItems: 'flex-start',
      gap: 6,
      minHeight: 150,
    },
    iconBubble: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 6,
    },
    title: {
      fontSize: 16,
      fontWeight: '700',
    },
    subtitle: {
      fontSize: 13,
    },
    example: {
      fontSize: 12,
      marginTop: 2,
    },
  });

export default HabitTypeSelector;