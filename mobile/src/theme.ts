import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import {
  DefaultTheme as NavDefaultTheme,
  DarkTheme as NavDarkTheme,
} from '@react-navigation/native';
import type { RootState } from './store';

export interface Palette {
  primary: string;
  guard: string;
  resident: string;
  admin: string;
  bg: string;
  card: string;
  cardAlt: string;
  text: string;
  muted: string;
  border: string;
  danger: string;
  warning: string;
  success: string;
  info: string;
  /** text/icon colour that sits on a coloured header */
  onHeader: string;
}

// A distinctive "twilight" palette: violet primary with jewel-tone role accents
// on a cool porcelain ground.
export const lightColors: Palette = {
  primary: '#6D28D9', // violet 700
  guard: '#0E7490', // cyan 700
  resident: '#0D9488', // teal 600
  admin: '#B45309', // amber 700
  bg: '#F6F5FB',
  card: '#FFFFFF',
  cardAlt: '#F0EDFB',
  text: '#1B1830',
  muted: '#6B6880',
  border: '#E6E2F2',
  danger: '#DC2626',
  warning: '#D97706',
  success: '#0D9488',
  info: '#0E7490',
  onHeader: '#FFFFFF',
};

export const darkColors: Palette = {
  primary: '#A78BFA', // violet 400
  guard: '#22D3EE', // cyan 400
  resident: '#2DD4BF', // teal 400
  admin: '#FBBF24', // amber 400
  bg: '#100C1C',
  card: '#1B1630',
  cardAlt: '#241D3E',
  text: '#ECE9F6',
  muted: '#A29DB8',
  border: '#332A4D',
  danger: '#F87171',
  warning: '#FBBF24',
  success: '#2DD4BF',
  info: '#22D3EE',
  onHeader: '#FFFFFF',
};

/** Back-compat default (light). Prefer `useAppColors()` in components. */
export const colors = lightColors;

/** Live palette for the current theme, from the redux `gui.theme` flag. */
export const useAppColors = (): Palette => {
  const theme = useSelector((s: RootState) => s.gui.theme);
  return theme === 'dark' ? darkColors : lightColors;
};

/** 4px spacing scale: spacing(2) === 8 */
export const spacing = (n: number) => n * 4;

export const radius = { sm: 8, md: 12, lg: 16, pill: 999 };

export const roleColor = (role?: string, c: Palette = lightColors) => {
  switch (role) {
    case 'guard':
    case 'security_supervisor':
      return c.guard;
    case 'resident':
    case 'staff':
      return c.resident;
    case 'society_admin':
    case 'super_admin':
      return c.admin;
    default:
      return c.primary;
  }
};

export const statusColor = (status?: string, c: Palette = lightColors) => {
  switch (status) {
    case 'approved':
      return c.success;
    case 'denied':
    case 'blocked':
      return c.danger;
    case 'entered':
      return c.info;
    case 'exited':
      return c.muted;
    case 'pending':
    case 'waiting':
      return c.warning;
    default:
      return c.muted;
  }
};

export const prettyStatus = (status?: string) => {
  if (!status) return 'Unknown';
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
};

const mkPaper = (dark: boolean, c: Palette) => {
  const base = dark ? MD3DarkTheme : MD3LightTheme;
  return {
    ...base,
    roundness: 4,
    colors: {
      ...base.colors,
      primary: c.primary,
      background: c.bg,
      surface: c.card,
      surfaceVariant: c.cardAlt,
      elevation: {
        ...base.colors.elevation,
        level1: c.card,
        level2: c.card,
        level3: c.card,
      },
      outline: c.border,
      onSurface: c.text,
      onSurfaceVariant: c.muted,
    },
  };
};

const mkNav = (dark: boolean, c: Palette) => {
  const base = dark ? NavDarkTheme : NavDefaultTheme;
  return {
    ...base,
    dark,
    colors: {
      ...base.colors,
      primary: c.primary,
      background: c.bg,
      card: c.card,
      text: c.text,
      border: c.border,
      notification: c.danger,
    },
  };
};

export const paperLightTheme = mkPaper(false, lightColors);
export const paperDarkTheme = mkPaper(true, darkColors);
export const navLightTheme = mkNav(false, lightColors);
export const navDarkTheme = mkNav(true, darkColors);

/** Hook: everything App.tsx needs to theme Paper + Navigation. */
export const useThemeBundle = () => {
  const isDark = useSelector((s: RootState) => s.gui.theme === 'dark');
  return useMemo(
    () => ({
      isDark,
      paper: isDark ? paperDarkTheme : paperLightTheme,
      nav: isDark ? navDarkTheme : navLightTheme,
    }),
    [isDark]
  );
};
