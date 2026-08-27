import { Animated, Easing } from 'react-native';

// Fade in animation
export const fadeIn = (value: Animated.Value, duration = 300) => {
  Animated.timing(value, {
    toValue: 1,
    duration,
    easing: Easing.ease,
    useNativeDriver: true,
  }).start();
};

// Fade out animation
export const fadeOut = (value: Animated.Value, duration = 300) => {
  Animated.timing(value, {
    toValue: 0,
    duration,
    easing: Easing.ease,
    useNativeDriver: true,
  }).start();
};

// Scale animation
export const scaleIn = (value: Animated.Value, duration = 300) => {
  Animated.spring(value, {
    toValue: 1,
    friction: 5,
    tension: 40,
    useNativeDriver: true,
  }).start();
};

// Slide up animation
export const slideUp = (value: Animated.Value, duration = 300) => {
  Animated.timing(value, {
    toValue: 0,
    duration,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: true,
  }).start();
};

// Create animated value
export const createAnimatedValue = (initialValue = 0) => {
  return new Animated.Value(initialValue);
};