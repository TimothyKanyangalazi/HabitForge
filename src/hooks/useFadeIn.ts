import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

export const useFadeIn = (duration = 300, delay = 0) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  return opacity;
};