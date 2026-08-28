import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { Excuse } from '../../types';

interface ExcuseCardProps {
  excuse: Excuse & { count?: number };
  onPress?: () => void;
  showCount?: boolean;
}

export const ExcuseCard: React.FC<ExcuseCardProps> = ({
  excuse,
  onPress,
  showCount = false,
}) => {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { backgroundColor: theme.colors.card }]}
    >
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.danger + '15' }]}>
          <Ionicons name="alert-circle" size={24} color={theme.colors.danger} />
        </View>
        <View style={styles.content}>
          <Text style={[styles.text, { color: theme.colors.text }]}>
            {excuse.text}
          </Text>
          {excuse.category && (
            <Text style={[styles.category, { color: theme.colors.textSecondary }]}>
              {excuse.category}
            </Text>
          )}
        </View>
        {showCount && excuse.count !== undefined && (
          <View style={[styles.countBadge, { backgroundColor: theme.colors.danger }]}>
            <Text style={styles.countText}>{excuse.count}x</Text>
          </View>
        )}
      </View>

      {excuse.reality_check && (
        <View style={styles.detailSection}>
          <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
            Reality Check:
          </Text>
          <Text style={[styles.detailText, { color: theme.colors.text }]}>
            {excuse.reality_check}
          </Text>
        </View>
      )}

      {excuse.action_next_time && (
        <View style={styles.detailSection}>
          <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
            Next Time:
          </Text>
          <Text style={[styles.detailText, { color: theme.colors.text }]}>
            {excuse.action_next_time}
          </Text>
        </View>
      )}

      {excuse.created_at && (
        <Text style={[styles.date, { color: theme.colors.textSecondary }]}>
          {new Date(excuse.created_at).toLocaleDateString()}
        </Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    marginVertical: 6,
    marginHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  category: {
    fontSize: 12,
  },
  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 8,
  },
  countText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  detailSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    lineHeight: 20,
  },
  date: {
    fontSize: 12,
    marginTop: 8,
  },
});