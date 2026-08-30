import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  Pressable, 
  Dimensions,
  Easing,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../src/theme/ThemeContext';
import { lightTheme } from '../../src/theme';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const themeContext = useTheme();
  const theme = themeContext?.theme || lightTheme;
  const colors = theme.colors || lightTheme.colors;

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const featureAnim1 = useRef(new Animated.Value(0)).current;
  const featureAnim2 = useRef(new Animated.Value(0)).current;
  const featureAnim3 = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Main entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
    ]).start();

    // Staggered feature animations
    Animated.stagger(200, [
      Animated.spring(featureAnim1, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(featureAnim2, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(featureAnim3, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Button animation
    Animated.spring(buttonAnim, {
      toValue: 1,
      friction: 6,
      tension: 40,
      delay: 600,
      useNativeDriver: true,
    }).start();

    // Start pulse animation
    startPulseAnimation();
  }, []);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleGetStarted = () => {
    // Button press animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.push('/onboarding');
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Background decorative circles */}
      <View style={[styles.bgCircle1, { backgroundColor: colors.primary + '10' }]} />
      <View style={[styles.bgCircle2, { backgroundColor: colors.primary + '05' }]} />
      
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Logo with rotation and pulse */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [
                { rotate },
                { scale: pulseAnim },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoGradient}
          >
            <Image 
              source={require('../../assets/HF3.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
          </LinearGradient>
          
          {/* Glow effect */}
          <View style={[styles.logoGlow, { backgroundColor: colors.primary + '30' }]} />
        </Animated.View>

        {/* Title */}
        <Animated.View
          style={{
            transform: [{ scale: scaleAnim }],
            alignItems: 'center',
          }}
        >
          <Text style={[styles.title, { color: colors.text }]}>
            HabitForge
          </Text>
          
          <View style={[styles.subtitleContainer, { backgroundColor: colors.primary + '10' }]}>
            <Ionicons name="sparkles" size={14} color={colors.primary} />
            <Text style={[styles.subtitle, { color: colors.primary }]}>
              Forge Your Discipline
            </Text>
            <Ionicons name="sparkles" size={14} color={colors.primary} />
          </View>
        </Animated.View>

        {/* Description */}
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Track habits, build routines, and understand your excuses to become the best version of yourself.
        </Text>

        {/* Features with staggered animation */}
        <View style={styles.featureList}>
          <Animated.View
            style={[
              styles.featureItem,
              {
                opacity: featureAnim1,
                transform: [
                  {
                    translateX: featureAnim1.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-50, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={[styles.featureIcon, { backgroundColor: colors.success + '15' }]}>
              <Ionicons name="checkmark-circle" size={22} color={colors.success} />
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>
                Track Daily Habits
              </Text>
              <Text style={[styles.featureSubtitle, { color: colors.textSecondary }]}>
                Build streaks and stay consistent
              </Text>
            </View>
          </Animated.View>

          <Animated.View
            style={[
              styles.featureItem,
              {
                opacity: featureAnim2,
                transform: [
                  {
                    translateX: featureAnim2.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-50, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={[styles.featureIcon, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="list" size={22} color={colors.primary} />
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>
                Build Powerful Routines
              </Text>
              <Text style={[styles.featureSubtitle, { color: colors.textSecondary }]}>
                Create structured daily flows
              </Text>
            </View>
          </Animated.View>

          <Animated.View
            style={[
              styles.featureItem,
              {
                opacity: featureAnim3,
                transform: [
                  {
                    translateX: featureAnim3.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-50, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={[styles.featureIcon, { backgroundColor: colors.warning + '15' }]}>
              <Ionicons name="stats-chart" size={22} color={colors.warning} />
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>
                Analyze Your Progress
              </Text>
              <Text style={[styles.featureSubtitle, { color: colors.textSecondary }]}>
                Gain insights and improve
              </Text>
            </View>
          </Animated.View>
        </View>

        {/* Button with animation */}
        <Animated.View
          style={[
            styles.buttonContainer,
            {
              opacity: buttonAnim,
              transform: [
                {
                  translateY: buttonAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
                {
                  scale: buttonAnim,
                },
              ],
            },
          ]}
        >
          <Pressable
            onPress={handleGetStarted}
            style={({ pressed }) => [
              styles.button,
              { 
                opacity: pressed ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
          >
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={22} color="#fff" />
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* Bottom hint */}
        <Text style={[styles.hintText, { color: colors.textSecondary }]}>
          Takes less than 1 minute to set up
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  bgCircle1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  bgCircle2: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: 250,
    height: 250,
    borderRadius: 125,
  },
  content: {
    alignItems: 'center',
    zIndex: 1,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 32,
  },
  logoGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    overflow: 'hidden',
  },
  logoImage: {
    width: 60,
    height: 60,
  },
  logoGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 60,
    zIndex: -1,
  },
  title: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: 12,
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 10,
  },
  featureList: {
    width: '100%',
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  featureSubtitle: {
    fontSize: 12,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 12,
  },
  button: {
    width: '100%',
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  hintText: {
    fontSize: 11,
    opacity: 0.7,
  },
});