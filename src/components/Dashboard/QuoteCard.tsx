import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';

interface QuoteCardProps {
  quote: string;
  author: string;
}

export const QuoteCard: React.FC<QuoteCardProps> = ({
  quote,
  author,
}) => {
  const theme = useTheme();

  if (!quote) {
    return null;
  }

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.quoteIconContainer}>
          <Ionicons name="quote" size={30} color="rgba(255,255,255,0.5)" />
        </View>
        
        <Text style={styles.quoteText}>
          "{quote}"
        </Text>
        
        <View style={styles.divider} />
        
        <View style={styles.authorContainer}>
          <View style={styles.authorIcon}>
            <Ionicons name="person" size={14} color="rgba(255,255,255,0.7)" />
          </View>
          <Text style={styles.author}>
            {author || 'Unknown'}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  card: {
    borderRadius: 20,
    padding: 24,
    elevation: 5,
    shadowColor: '#667eea',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  quoteIconContainer: {
    marginBottom: 12,
  },
  quoteText: {
    color: '#fff',
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginVertical: 16,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  authorIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  author: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '600',
  },
});