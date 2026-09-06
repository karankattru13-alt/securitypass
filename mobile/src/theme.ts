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

export const lightColors: Palette = {
  primary: '#2563EB',
  guard: '#2196F3',
  resident: '#16A34A',
  admin: '#F97316',
  bg: '#F4F6F8',
  card: '#FFFFFF',
  cardAlt: '#EEF2FF',
  text: '#111827',
  muted: '#6B7280',
  border: '#E5E7EB',
  danger: '#DC2626',
  warning: '#F59E0B',
  success: '#16A34A',
  info: '#0EA5E9',
  onHeader: '#FFFFFF',
};

export const darkColors: Palette = {
  primary: '#3B82F6',
  guard: '#3B82F6',
  resident: '#22C55E',
  admin: '#FB923C',
  bg: '#0B0F14',
  card: '#161B22',
  cardAlt: '#1E2633',
  text: '#E6EDF3',
  muted: '#9AA4AF',
  border: '#30363D',
  danger: '#F87171',
  warning: '#FBBF24',
  success: '#4ADE80',
  info: '#38BDF8',
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
