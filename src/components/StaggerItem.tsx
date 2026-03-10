/**
 * StaggerItem
 * Wraps any list item in a staggered FadeInUp entering animation.
 * Respects reduceMotion preference — no animation if enabled.
 */

import React from 'react';
import { ViewStyle, StyleProp } from 'react-native';
import Animated from 'react-native-reanimated';
import { useStaggerEntering } from '../hooks/useStaggerAnimation';

interface StaggerItemProps {
  index: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function StaggerItem({ index, children, style }: StaggerItemProps) {
  const entering = useStaggerEntering(index);
  return (
    <Animated.View entering={entering} style={style}>
      {children}
    </Animated.View>
  );
}

export default StaggerItem;
