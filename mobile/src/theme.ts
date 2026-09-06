import { MD3LightTheme } from 'react-native-paper';

export const colors = {
  primary: '#2563EB',
  guard: '#2196F3',
  resident: '#16A34A',
  admin: '#F97316',
  bg: '#F4F6F8',
  card: '#FFFFFF',
  text: '#111827',
  muted: '#6B7280',
  border: '#E5E7EB',
  danger: '#DC2626',
  warning: '#F59E0B',
  success: '#16A34A',
  info: '#0EA5E9',
};

/** 4px spacing scale: spacing(2) === 8 */
export const spacing = (n: number) => n * 4;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
};

export const roleColor = (role?: string) => {
  switch (role) {
    case 'guard':
    case 'security_supervisor':
      return colors.guard;
    case 'resident':
    case 'staff':
      return colors.resident;
    case 'society_admin':
    case 'super_admin':
      return colors.admin;
    default:
      return colors.primary;
  }
};

export const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    background: colors.bg,
    surface: colors.card,
  },
};

/** Status -> display color, used across visitor lists. */
export const statusColor = (status?: string) => {
  switch (status) {
    case 'approved':
      return colors.success;
    case 'denied':
    case 'blocked':
      return colors.danger;
    case 'entered':
      return colors.info;
    case 'exited':
      return colors.muted;
    case 'pending':
    case 'waiting':
      return colors.warning;
    default:
      return colors.muted;
  }
};

export const prettyStatus = (status?: string) => {
  if (!status) return 'Unknown';
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
};
