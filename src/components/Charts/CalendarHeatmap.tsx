import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { lightTheme } from '../../theme';

interface HeatmapData {
  date: string;
  completionRate: number;
}

interface CalendarHeatmapProps {
  data: HeatmapData[];
  days?: number;
}

export const CalendarHeatmap: React.FC<CalendarHeatmapProps> = ({
  data,
  days = 30,
}) => {
   const themeContext = useTheme();
  const theme = themeContext?.theme || lightTheme;
  const colors = theme.colors || lightTheme.colors;

  const getColor = (rate: number) => {
    if (rate === 0) return theme.colors.card;
    if (rate < 25) return theme.colors.primary + '30';
    if (rate < 50) return theme.colors.primary + '60';
    if (rate < 75) return theme.colors.primary + '90';
    return theme.colors.primary;
  };

  const generateDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayData = data.find(d => d.date === dateStr);
      
      dates.push({
        date: dateStr,
        day: date.getDate(),
        completionRate: dayData?.completionRate || 0,
      });
    }
    
    return dates;
  };

  const dates = generateDates();

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.grid}>
          {dates.map((date, index) => (
            <View key={index} style={styles.dayContainer}>
              <View
                style={[
                  styles.dayBox,
                  { backgroundColor: getColor(date.completionRate) },
                ]}
              >
                <Text style={[
                  styles.dayText,
                  { color: date.completionRate > 50 ? '#fff' : theme.colors.textSecondary },
                ]}>
                  {date.day}
                </Text>
              </View>
              {date.completionRate > 0 && (
                <Text style={[styles.rateText, { color: theme.colors.textSecondary }]}>
                  {date.completionRate.toFixed(0)}%
                </Text>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
  },
  grid: {
    flexDirection: 'row',
    gap: 4,
  },
  dayContainer: {
    alignItems: 'center',
  },
  dayBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
  },
  rateText: {
    fontSize: 9,
    marginTop: 2,
  },
});