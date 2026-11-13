import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { lightTheme } from '../../theme';
import { PrimaryButton } from '../common/PrimaryButton';
import { Habit, HabitInput, HabitType } from '../../types';
import HabitTypeSelector from '../HabitForm/HabitTypeSelector';
import BreakHabitFields from '../HabitForm/BreakHabitFields';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface HabitFormProps {
  initialValues?: Partial<Habit>;
  onSubmit: (values: HabitInput) => Promise<void>;
  onCancel: () => void;
}

interface BreakFields {
  reason: string;
  replacement_activity: string;
  cost_per_day: number;
  time_per_day_minutes: number;
  track_urges: boolean;
  preset: string | null;
}

type FormValues = HabitInput & {
  selected_days?: string;
  reminder_time?: string;
  track_urges?: boolean;
};


const FREQUENCIES = [
  { label: 'Daily', value: 'daily', icon: 'calendar' as const },
  { label: 'Weekly', value: 'weekly', icon: 'calendar-outline' as const },
  { label: 'Custom', value: 'custom', icon: 'settings-outline' as const },
];

const DAYS = [
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
  { label: 'Sun', value: 0 },
];

const ICONS = [
  'fitness',
  'book',
  'water',
  'leaf',
  'journal',
  'code-slash',
  'musical-notes',
  'walk',
  'bed',
  'restaurant',
  'briefcase',
  'school',
  'flame-outline',
  'shield-outline',
] as const;

const DEFAULT_COLOR = '#3B82F6';

const EMPTY_BREAK_FIELDS: BreakFields = {
  reason: '',
  replacement_activity: '',
  cost_per_day: 0,
  time_per_day_minutes: 0,
  track_urges: true,
  preset: null,
};



function parseSelectedDays(value: unknown): number[] {
  if (Array.isArray(value)) return value as number[];
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function validateReminderTime(t: string): string | null {
  if (!t) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (!m) return 'Use format HH:MM (e.g. 08:30)';
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (h < 0 || h > 23) return 'Hour must be 00–23';
  if (min < 0 || min > 59) return 'Minutes must be 00–59';
  return null;
}

function sanitizeReminderTime(input: string): string {
  // Keep only digits and at most one colon
  const cleaned = input.replace(/[^0-9:]/g, '');
  const firstColon = cleaned.indexOf(':');
  if (firstColon === -1) return cleaned.slice(0, 2);
  const head = cleaned.slice(0, firstColon).slice(0, 2);
  const tail = cleaned.slice(firstColon + 1).replace(/:/g, '').slice(0, 2);
  return `${head}:${tail}`;
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export const HabitForm: React.FC<HabitFormProps> = ({
  initialValues,
  onSubmit,
  onCancel,
}) => {
  // ── Theme (handles both { theme } and { colors } shapes) ──
  const themeCtx = useTheme();
  const theme: any = (themeCtx as any)?.theme ?? themeCtx ?? lightTheme;
  const raw: Record<string, string> = theme?.colors ?? lightTheme.colors;
  const C = {
    text: raw.text ?? '#111827',
    textMuted: raw.textMuted ?? raw.textSecondary ?? '#6B7280',
    border: raw.border ?? '#E5E7EB',
    card: raw.card ?? '#FFFFFF',
    primary: raw.primary ?? '#3B82F6',
    error: raw.error ?? '#EF4444',
  };

  // ── Deep-link: ?type=break / ?type=build ──
  const params = useLocalSearchParams<{ type?: string }>();
  const paramType: HabitType | null =
    params.type === 'break' || params.type === 'build' ? params.type : null;

  // ── State ──
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState('daily');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [reminderTime, setReminderTime] = useState('');
  const [targetCount, setTargetCount] = useState('1');
  const [icon, setIcon] = useState<string>('fitness');
  const [habitType, setHabitType] = useState<HabitType>('build');
  const [breakFields, setBreakFields] =
    useState<BreakFields>(EMPTY_BREAK_FIELDS);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [daysError, setDaysError] = useState<string | null>(null);
  const [reminderError, setReminderError] = useState<string | null>(null);

  // ── Sync from `initialValues` when the source actually changes ──
  const syncKeyRef = useRef<string>('__uninitialized__');
  useEffect(() => {
    const syncKey = initialValues
      ? `id:${initialValues.id ?? 'draft'}`
      : 'no-values';
    if (syncKey === syncKeyRef.current) return;
    syncKeyRef.current = syncKey;
    if (!initialValues) return;

    setName(initialValues.name ?? '');
    setDescription(initialValues.description ?? '');
    setFrequency((initialValues.frequency_type as string) ?? 'daily');
    setSelectedDays(parseSelectedDays(initialValues.selected_days));
    setReminderTime(initialValues.reminder_time ?? '');
    setTargetCount(String(initialValues.target_count ?? 1));
    setIcon(initialValues.icon ?? 'fitness');
    setHabitType(
      paramType ?? ((initialValues.habit_type as HabitType) ?? 'build')
    );
    setBreakFields({
      ...EMPTY_BREAK_FIELDS,
      reason: initialValues.reason ?? '',
      replacement_activity: initialValues.replacement_activity ?? '',
      cost_per_day: initialValues.cost_per_day ?? 0,
      time_per_day_minutes: initialValues.time_per_day_minutes ?? 0,
    });
  }, [initialValues, paramType]);

  // ── Handlers ──
  const toggleDay = useCallback((day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
    setDaysError(null);
  }, []);

  const handleReminderChange = (t: string) => {
    setReminderTime(sanitizeReminderTime(t));
    if (reminderError) setReminderError(null);
  };

  const handleSubmit = async () => {
    setFormError(null);
    setNameError(null);
    setDaysError(null);
    setReminderError(null);

    let invalid = false;

    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError('Habit name is required');
      invalid = true;
    }

    if (frequency !== 'daily' && selectedDays.length === 0) {
      setDaysError('Pick at least one day');
      invalid = true;
    }

    const reminderErr = validateReminderTime(reminderTime);
    if (reminderErr) {
      setReminderError(reminderErr);
      invalid = true;
    }

    if (invalid) return;

    setIsSubmitting(true);
    try {
      // Strip form-only `preset` before touching the payload.
      const { preset: _preset, ...breakPayload } = breakFields;

      const payload: FormValues = {
        name: trimmedName,
        description: description.trim() || undefined,
        icon,
        color: DEFAULT_COLOR,
        frequency: frequency as HabitInput['frequency'],
        target_count: parseInt(targetCount, 10) || 1,
        habit_type: habitType,
        ...(habitType === 'break'
          ? {
              reason: breakPayload.reason.trim() || undefined,
              replacement_activity:
                breakPayload.replacement_activity.trim() || undefined,
              cost_per_day: breakPayload.cost_per_day,
              time_per_day_minutes: breakPayload.time_per_day_minutes,
              track_urges: breakPayload.track_urges,
            }
          : {}),
        selected_days:
          selectedDays.length > 0 ? JSON.stringify(selectedDays) : undefined,
        reminder_time: reminderTime || undefined,
      };

      await onSubmit(payload);
    } catch (err: any) {
      setFormError(
        err?.message ?? 'Could not save habit. Please try again.'
      );
      console.error('Form submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Memoized icon grid ──
  const iconButtons = useMemo(
    () =>
      ICONS.map((iconName) => {
        const selected = icon === iconName;
        return (
          <Pressable
            key={iconName}
            onPress={() => setIcon(iconName)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`Choose icon ${iconName}`}
            style={[
              styles.iconButton,
              {
                backgroundColor: selected ? C.primary : C.card,
                borderColor: selected ? C.primary : C.border,
              },
            ]}
          >
            <Ionicons
              name={iconName as any}
              size={22}
              color={selected ? '#fff' : C.text}
            />
          </Pressable>
        );
      }),
    [icon, C.primary, C.card, C.border, C.text]
  );

  // ── Render ──
  return (
    <ScrollView
      style={styles.container}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* ── Form-level error ── */}
      {formError && (
        <View
          style={[
            styles.formError,
            { backgroundColor: `${C.error}15`, borderColor: C.error },
          ]}
        >
          <Ionicons name="alert-circle-outline" size={18} color={C.error} />
          <Text style={[styles.formErrorText, { color: C.error }]}>
            {formError}
          </Text>
        </View>
      )}

      {/* ── Habit Type ── */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: C.text }]}>Habit Type</Text>
        <HabitTypeSelector value={habitType} onChange={setHabitType} />
      </View>

      {/* ── Name ── */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: C.text }]}>Habit Name</Text>
        <TextInput
          style={[
            styles.input,
            {
              color: C.text,
              borderColor: nameError ? C.error : C.border,
              backgroundColor: C.card,
            },
          ]}
          value={name}
          onChangeText={(t) => {
            setName(t);
            if (nameError) setNameError(null);
          }}
          placeholder={
            habitType === 'break'
              ? 'e.g., Stop smoking'
              : 'e.g., Read 20 pages'
          }
          placeholderTextColor={C.textMuted}
          autoCapitalize="sentences"
        />
        {nameError && (
          <Text style={[styles.errorText, { color: C.error }]}>
            {nameError}
          </Text>
        )}
      </View>

      {/* ── Icon ── */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: C.text }]}>Icon</Text>
        <View style={styles.iconsContainer}>{iconButtons}</View>
      </View>

      {/* ── Description ── */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: C.text }]}>
          Description (Optional)
        </Text>
        <TextInput
          style={[
            styles.input,
            styles.multiline,
            {
              color: C.text,
              borderColor: C.border,
              backgroundColor: C.card,
            },
          ]}
          value={description}
          onChangeText={setDescription}
          placeholder={
            habitType === 'break'
              ? 'Additional notes (optional)'
              : 'Why do you want to build this habit?'
          }
          placeholderTextColor={C.textMuted}
          multiline
          textAlignVertical="top"
        />
      </View>

      {/* ── Break-habit fields ── */}
      {habitType === 'break' && (
        <View style={styles.section}>
          <BreakHabitFields values={breakFields} onChange={setBreakFields} />
        </View>
      )}

      {/* ── Frequency ── */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: C.text }]}>Frequency</Text>
        <View style={styles.frequencyContainer}>
          {FREQUENCIES.map((freq) => {
            const selected = frequency === freq.value;
            return (
              <Pressable
                key={freq.value}
                onPress={() => setFrequency(freq.value)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={[
                  styles.frequencyButton,
                  {
                    backgroundColor: selected ? C.primary : C.card,
                    borderColor: selected ? C.primary : C.border,
                  },
                ]}
              >
                <Ionicons
                  name={freq.icon}
                  size={18}
                  color={selected ? '#fff' : C.text}
                />
                <Text
                  style={[
                    styles.frequencyText,
                    { color: selected ? '#fff' : C.text },
                  ]}
                >
                  {freq.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ── Days (custom / weekly) ── */}
      {frequency !== 'daily' && (
        <View style={styles.section}>
          <Text style={[styles.label, { color: C.text }]}>Select Days</Text>
          <View style={styles.daysContainer}>
            {DAYS.map((day) => {
              const selected = selectedDays.includes(day.value);
              return (
                <Pressable
                  key={day.value}
                  onPress={() => toggleDay(day.value)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={[
                    styles.dayButton,
                    {
                      backgroundColor: selected ? C.primary : C.card,
                      borderColor: selected ? C.primary : C.border,
                    },
                  ]}
                >
                  <Text style={{ color: selected ? '#fff' : C.text }}>
                    {day.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {daysError && (
            <Text style={[styles.errorText, { color: C.error }]}>
              {daysError}
            </Text>
          )}
        </View>
      )}

      {/* ── Reminder + Target (side by side) ── */}
      <View style={[styles.section, styles.scheduleRow]}>
        <View style={styles.scheduleHalf}>
          <Text style={[styles.label, { color: C.text }]}>
            Reminder (optional)
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                color: C.text,
                borderColor: reminderError ? C.error : C.border,
                backgroundColor: C.card,
              },
            ]}
            value={reminderTime}
            onChangeText={handleReminderChange}
            placeholder="08:00"
            placeholderTextColor={C.textMuted}
            keyboardType="numbers-and-punctuation"
            maxLength={5}
          />
          {reminderError && (
            <Text style={[styles.errorText, { color: C.error }]}>
              {reminderError}
            </Text>
          )}
        </View>

        <View style={styles.scheduleHalf}>
          <Text style={[styles.label, { color: C.text }]}>Daily target</Text>
          <TextInput
            style={[
              styles.input,
              {
                color: C.text,
                borderColor: C.border,
                backgroundColor: C.card,
              },
            ]}
            value={targetCount}
            onChangeText={(t) => setTargetCount(t.replace(/[^0-9]/g, ''))}
            onBlur={() => {
              if (!targetCount) setTargetCount('1');
            }}
            keyboardType="number-pad"
            placeholder="1"
            placeholderTextColor={C.textMuted}
          />
        </View>
      </View>

      {/* ── Actions ── */}
      <View style={styles.buttonContainer}>
        <PrimaryButton
          title={isSubmitting ? 'Saving…' : 'Save Habit'}
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={styles.saveButton}
        />
        {isSubmitting && (
          <ActivityIndicator
            style={{ marginTop: 8 }}
            color={C.primary}
          />
        )}
        <PrimaryButton
          title="Cancel"
          onPress={onCancel}
          disabled={isSubmitting}
          style={[styles.cancelButton, { backgroundColor: '#666' }]}
        />
      </View>
    </ScrollView>
  );
};

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  section: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  errorText: { fontSize: 12, marginTop: 4 },
  formError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  formErrorText: { flex: 1, fontSize: 13, fontWeight: '500' },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 44,
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  frequencyContainer: { flexDirection: 'row', gap: 8 },
  frequencyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  frequencyText: { fontSize: 13, fontWeight: '500' },
  daysContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  iconsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleRow: { flexDirection: 'row', gap: 12 },
  scheduleHalf: { flex: 1 },
  buttonContainer: { marginTop: 20, marginBottom: 40 },
  saveButton: { width: '100%', marginBottom: 8 },
  cancelButton: { width: '100%' },
});