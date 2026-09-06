import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

export const timeAgo = (iso?: string | null) => {
  if (!iso) return '';
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return '';
  }
};

export const clockTime = (iso?: string | null) => {
  if (!iso) return '--:--';
  try {
    return format(new Date(iso), 'h:mm a');
  } catch {
    return '--:--';
  }
};

export const smartDate = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isToday(d)) return `Today, ${format(d, 'h:mm a')}`;
  if (isYesterday(d)) return `Yesterday, ${format(d, 'h:mm a')}`;
  return format(d, 'd MMM, h:mm a');
};

export const initials = (first?: string, last?: string) =>
  `${(first || '?').charAt(0)}${(last || '').charAt(0)}`.toUpperCase();
