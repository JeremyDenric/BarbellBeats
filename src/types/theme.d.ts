/**
 * Theme type definitions for TypeScript autocompletion
 * Extends React Navigation theme types
 */

import '@react-navigation/native';

declare module '@react-navigation/native' {
  export type ExtendedTheme = {
    dark: boolean;
    colors: {
      primary: string;
      background: string;
      card: string;
      text: string;
      border: string;
      notification: string;
    };
  };

  export function useTheme(): ExtendedTheme;
}
