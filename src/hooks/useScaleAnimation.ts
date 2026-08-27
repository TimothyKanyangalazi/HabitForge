import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

export const useScaleAnimation = (initialScale = 0.8, finalScale = 1) => {
  const scale = useRef(new Animated.Value(initialScale)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: finalScale,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);

  return scale;
};