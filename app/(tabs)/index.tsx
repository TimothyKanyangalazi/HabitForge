import { View, Text, StyleSheet, Animated } from 'react-native';
import { useFadeIn } from '../../src/hooks/useFadeIn';
import { useScaleAnimation } from '../../src/hooks/useScaleAnimation';
import { AnimatedCard } from '../../src/components/common/AnimatedCard';

export default function HomeScreen() {
  const fadeAnim = useFadeIn(500);
  const scaleAnim = useScaleAnimation(0.5, 1);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.titleContainer, { opacity: fadeAnim }]}>
        <Text style={styles.title}>HabitForge</Text>
        <Text style={styles.subtitle}>Phase 1 Complete</Text>
      </Animated.View>

      <Animated.View style={[styles.box, { transform: [{ scale: scaleAnim }] }]}>
        <Text style={styles.boxText}>Animations Working!</Text>
      </Animated.View>

      <AnimatedCard>
        <Text style={styles.cardTitle}>Welcome</Text>
        <Text style={styles.cardText}>
          This card has a fade-in and slide-up animation.
        </Text>
      </AnimatedCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  box: {
    width: 200,
    height: 100,
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  boxText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  cardText: {
    fontSize: 14,
    color: '#666',
  },
});