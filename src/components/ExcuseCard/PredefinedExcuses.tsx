import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, FlatList, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { useExcuseStore } from '../../stores/excuseStore';
import { Excuse } from '../../types';
import { lightTheme } from '../../theme';

interface PredefinedExcusesProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (excuse: Excuse) => void;
}

export const PredefinedExcuses: React.FC<PredefinedExcusesProps> = ({
  visible,
  onClose,
  onSelect,
}) => {
   const themeContext = useTheme();
  const theme = themeContext?.theme || lightTheme;
  const colors = theme.colors || lightTheme.colors;
  const { predefinedExcuses } = useExcuseStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Group excuses by category (for now, all are predefined)
  const categories = ['All', 'Common', 'Time', 'Energy', 'Motivation'];

  const filteredExcuses = predefinedExcuses.filter(excuse => {
    const matchesSearch = excuse.text.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || 
      (selectedCategory === 'Common' && ['Too tired', 'No time', 'Busy'].includes(excuse.text)) ||
      (selectedCategory === 'Time' && ['No time', 'Forgot'].includes(excuse.text)) ||
      (selectedCategory === 'Energy' && ['Too tired', 'Too difficult'].includes(excuse.text)) ||
      (selectedCategory === 'Motivation' && ['No motivation', "Didn't feel like it", 'Procrastination'].includes(excuse.text));
    
    return matchesSearch && matchesCategory;
  });

  const renderExcuseItem = ({ item }: { item: Excuse }) => (
    <Pressable
      onPress={() => {
        onSelect(item);
        onClose();
      }}
      style={[styles.excuseItem, { backgroundColor: theme.colors.card }]}
    >
      <View style={[styles.excuseIcon, { backgroundColor: theme.colors.danger + '15' }]}>
        <Ionicons name="alert-circle-outline" size={20} color={theme.colors.danger} />
      </View>
      <Text style={[styles.excuseText, { color: theme.colors.text }]}>
        {item.text}
      </Text>
      <Ionicons name="add-circle-outline" size={24} color={theme.colors.primary} />
    </Pressable>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      transparent
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: theme.colors.text }]}>
                Common Excuses
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                Select an excuse or create your own
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </Pressable>
          </View>

          {/* Search Bar */}
          <View style={[styles.searchContainer, { backgroundColor: theme.colors.card }]}>
            <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.text }]}
              placeholder="Search excuses..."
              placeholderTextColor={theme.colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
              </Pressable>
            )}
          </View>

          {/* Category Filter */}
          <View style={styles.categoryContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {categories.map(category => (
                <Pressable
                  key={category}
                  onPress={() => setSelectedCategory(category)}
                  style={[
                    styles.categoryButton,
                    {
                      backgroundColor: selectedCategory === category
                        ? theme.colors.primary
                        : theme.colors.card,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      {
                        color: selectedCategory === category
                          ? '#fff'
                          : theme.colors.text,
                      },
                    ]}
                  >
                    {category}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Excuse List */}
          <FlatList
            data={filteredExcuses}
            renderItem={renderExcuseItem}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={48} color={theme.colors.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                  No excuses found
                </Text>
              </View>
            }
          />

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <Pressable
              onPress={onClose}
              style={[styles.quickButton, { backgroundColor: theme.colors.primary }]}
            >
              <Ionicons name="create-outline" size={20} color="#fff" />
              <Text style={styles.quickButtonText}>Custom Excuse</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  closeButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
  },
  categoryContainer: {
    marginBottom: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 20,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  excuseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  excuseIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  excuseText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
  },
  quickActions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  quickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 25,
    gap: 8,
  },
  quickButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});