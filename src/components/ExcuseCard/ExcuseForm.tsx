import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { PrimaryButton } from '../common/PrimaryButton';
import { PredefinedExcuses } from './PredefinedExcuses';
import { useExcuseStore } from '../../stores/excuseStore';
import { Excuse } from '../../types';
import { lightTheme } from '../../theme';

interface ExcuseFormProps {
  habitId?: number;
  habitName?: string;
  onSubmit: (values: {
    text: string;
    reality_check?: string;
    action_next_time?: string;
  }) => Promise<void>;
  onCancel: () => void;
}

export const ExcuseForm: React.FC<ExcuseFormProps> = ({
  habitId,
  habitName,
  onSubmit,
  onCancel,
}) => {
   const themeContext = useTheme();
  const theme = themeContext?.theme || lightTheme;
  const colors = theme.colors || lightTheme.colors;
  const { predefinedExcuses, fetchPredefined } = useExcuseStore();
  const [text, setText] = useState('');
  const [realityCheck, setRealityCheck] = useState('');
  const [actionNextTime, setActionNextTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPredefined, setShowPredefined] = useState(false);
  const [selectedExcuse, setSelectedExcuse] = useState<Excuse | null>(null);

  React.useEffect(() => {
    fetchPredefined();
  }, []);

  const handleSelectPredefined = (excuse: Excuse) => {
    setSelectedExcuse(excuse);
    setText(excuse.text);
  };

  const handleSubmit = async () => {
    if (!text.trim()) {
      alert('Please enter or select an excuse');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        text: text.trim(),
        reality_check: realityCheck.trim() || undefined,
        action_next_time: actionNextTime.trim() || undefined,
      });
    } catch (error) {
      console.error('Form submission error:', error);
      alert('Failed to save excuse. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {habitName && (
        <View style={[styles.habitBanner, { backgroundColor: theme.colors.primary + '15' }]}>
          <Ionicons name="alert-circle" size={24} color={theme.colors.primary} />
          <Text style={[styles.habitBannerText, { color: theme.colors.primary }]}>
            Logging excuse for: {habitName}
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.colors.text }]}>
          What stopped you?
        </Text>
        
        {/* Predefined Excuses Button */}
        <Pressable
          onPress={() => setShowPredefined(true)}
          style={[styles.predefinedButton, { backgroundColor: theme.colors.card }]}
        >
          <Ionicons name="list" size={20} color={theme.colors.primary} />
          <Text style={[styles.predefinedButtonText, { color: theme.colors.primary }]}>
            Choose from common excuses
          </Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} />
        </Pressable>

        {/* Selected excuse display */}
        {selectedExcuse && (
          <View style={[styles.selectedExcuse, { backgroundColor: theme.colors.primary + '15' }]}>
            <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
            <Text style={[styles.selectedExcuseText, { color: theme.colors.primary }]}>
              {selectedExcuse.text}
            </Text>
            <Pressable onPress={() => {
              setSelectedExcuse(null);
              setText('');
            }}>
              <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
            </Pressable>
          </View>
        )}

        {/* Custom excuse input */}
        <TextInput
          style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
          value={text}
          onChangeText={(value) => {
            setText(value);
            setSelectedExcuse(null);
          }}
          placeholder="Or type your own excuse..."
          placeholderTextColor={theme.colors.textSecondary}
          multiline
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.colors.text }]}>
          Reality Check (Optional)
        </Text>
        <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>
          What actually happened? Be honest with yourself.
        </Text>
        <TextInput
          style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
          value={realityCheck}
          onChangeText={setRealityCheck}
          placeholder="e.g., I stayed up too late watching videos"
          placeholderTextColor={theme.colors.textSecondary}
          multiline
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.colors.text }]}>
          Action Next Time (Optional)
        </Text>
        <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>
          What will you do differently next time?
        </Text>
        <TextInput
          style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
          value={actionNextTime}
          onChangeText={setActionNextTime}
          placeholder="e.g., Put phone away before 10 PM"
          placeholderTextColor={theme.colors.textSecondary}
          multiline
        />
      </View>

      <View style={styles.buttonContainer}>
        <PrimaryButton
          title={isSubmitting ? 'Saving...' : 'Save Excuse'}
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={styles.saveButton}
        />
        <PrimaryButton
          title="Cancel"
          onPress={onCancel}
          style={[styles.cancelButton, { backgroundColor: '#666' }]}
        />
      </View>

      {/* Predefined Excuses Modal */}
      <PredefinedExcuses
        visible={showPredefined}
        onClose={() => setShowPredefined(false)}
        onSelect={handleSelectPredefined}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  habitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    gap: 8,
  },
  habitBannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  hint: {
    fontSize: 13,
    marginBottom: 8,
  },
  predefinedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  predefinedButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  selectedExcuse: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  selectedExcuseText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    minHeight: 50,
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
  saveButton: {
    width: '100%',
    marginBottom: 8,
  },
  cancelButton: {
    width: '100%',
  },
});