import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { lightTheme } from '../../theme';
interface BarChartProps {
  data: Array<{
    label: string;
    value: number;
    color?: string;
  }>;
  maxValue?: number;
  height?: number;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  maxValue,
  height = 150,
}) => {
    const themeContext = useTheme();
  const theme = themeContext?.theme || lightTheme;
  const colors = theme.colors || lightTheme.colors;
  const chartWidth = Dimensions.get('window').width - 80;
  const max = maxValue || Math.max(...data.map(d => d.value), 1);

  return (
    <View style={[styles.container, { height }]}>
      {data.map((item, index) => {
        const barHeight = (item.value / max) * (height - 40);
        
        return (
          <View key={index} style={styles.barContainer}>
            <View style={styles.barWrapper}>
              <View
                style={[
                  styles.bar,
                  {
                    height: Math.max(barHeight, 2),
                    backgroundColor: item.color || theme.colors.primary,
                    borderRadius: 4,
                  },
                ]}
              />
            </View>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
              {item.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
  },
  barWrapper: {
    height: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: 20,
    minHeight: 2,
  },
  label: {
    fontSize: 10,
    marginTop: 4,
  },
});