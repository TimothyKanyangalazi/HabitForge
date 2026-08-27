import React from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';

interface SelectionCardProps {
  title: string;
  icon?: string;
  color?: string;
  selected: boolean;
  onPress: () => void;
}

export const SelectionCard: React.FC<SelectionCardProps> = ({
  title,
  icon,
  color,
  selected,
  onPress,
}) => {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: selected ? theme.colors.primary + '20' : '#f5f5f5',
          borderColor: selected ? theme.colors.primary : 'transparent',
        },
      ]}
    >
      {icon && (
        <View style={[styles.iconContainer, { backgroundColor: color || theme.colors.primary }]}>
          <Ionicons name={icon as any} size={24} color="#fff" />
        </View>
      )}
      <Text style={[styles.title, selected && { color: theme.colors.primary }]}>
        {title}
      </Text>
      {selected && (
        <Ionicons
          name="checkmark-circle"
          size={24}
          color={theme.colors.primary}
          style={styles.checkmark}
        />
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginVertical: 6,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  checkmark: {
    marginLeft: 8,
  },
});