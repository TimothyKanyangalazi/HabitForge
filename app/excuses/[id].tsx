import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useExcuseStore } from '../../src/stores/excuseStore';
import { useTheme } from '../../src/theme/ThemeContext';
import { Excuse } from '../../src/types';

export default function ExcuseDetailScreen() {
  const { id } = useLocalSearchParams();
  const theme = useTheme();
  const { getExcuseById, deleteExcuse } = useExcuseStore();
  const [excuse, setExcuse] = useState<Excuse | null>(null);

  useEffect(() => {
    const found = getExcuseById(Number(id));
    setExcuse(found || null);
  }, [id]);

  if (!excuse) {
    return (
      <View style={styles.center}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.danger + '15' }]}>
          <Ionicons name="alert-circle" size={48} color={theme.colors.danger} />
        </View>
        <Text style={[styles.excuseText, { color: theme.colors.text }]}>
          {excuse.text}
        </Text>
        <Text style={[styles.category, { color: theme.colors.textSecondary }]}>
          {excuse.category}
        </Text>
      </View>

      {excuse.reality_check && (
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Reality Check
          </Text>
          <Text style={[styles.sectionText, { color: theme.colors.text }]}>
            {excuse.reality_check}
          </Text>
        </View>
      )}

      {excuse.action_next_time && (
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Action Next Time
          </Text>
          <Text style={[styles.sectionText, { color: theme.colors.text }]}>
            {excuse.action_next_time}
          </Text>
        </View>
      )}

      <View style={styles.actionsContainer}>
        <Pressable
          onPress={() => {
            Alert.alert(
              'Delete Excuse',
              'Are you sure you want to delete this excuse?',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Delete', 
                  style: 'destructive',
                  onPress: () => {
                    deleteExcuse(excuse.id);
                    router.back();
                  }
                }
              ]
            );
          }}
          style={[styles.deleteButton, { backgroundColor: theme.colors.danger }]}
        >
          <Ionicons name="trash" size={20} color="#fff" />
          <Text style={styles.deleteButtonText}>Delete Excuse</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    paddingTop: 40,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  excuseText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  category: {
    fontSize: 14,
  },
  section: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 15,
    lineHeight: 22,
  },
  actionsContainer: {
    padding: 16,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});