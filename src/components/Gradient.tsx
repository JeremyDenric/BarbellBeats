/**
 * Gradient
 * Typed wrapper around expo-linear-gradient's LinearGradient.
 *
 * expo-linear-gradient requires `readonly [ColorValue, ColorValue, ...ColorValue[]]`
 * but callers naturally work with plain string arrays. This wrapper accepts
 * `string[]` and handles the single cast internally, keeping call sites clean.
 */

import React from 'react';
import { LinearGradient, LinearGradientProps } from 'expo-linear-gradient';

type GradientProps = Omit<LinearGradientProps, 'colors'> & {
  colors: string[];
};

export function Gradient({ colors, ...props }: GradientProps) {
  return (
    <LinearGradient
      colors={colors as unknown as readonly [string, string, ...string[]]}
      {...props}
    />
  );
}
