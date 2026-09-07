import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { useAppColors, spacing, radius } from '../theme';

interface Props {
  title: string;
  count?: number;
  color?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: any;
}

const SectionTitle: React.FC<Props> = ({
  title,
  count,
  color,
  actionLabel,
  onAction,
  style,
}) => {
  const c = useAppColors();
  const styles = React.useMemo(() => makeStyles(c), [c]);
  return (
    <View style={[styles.row, style]}>
      <View style={styles.left}>
        <View style={[styles.bar, { backgroundColor: color ?? c.primary }]} />
        <Text style={styles.text}>
          {title}
          {count != null ? <Text style={styles.count}>  {count}</Text> : null}
        </Text>
      </View>
      {actionLabel && onAction ? (
        <Button compact textColor={color ?? c.primary} onPress={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
};

const makeStyles = (c: ReturnType<typeof useAppColors>) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing(5),
      marginBottom: spacing(3),
      minHeight: 28,
    },
    left: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    bar: { width: 4, height: 18, borderRadius: radius.pill, marginRight: spacing(2) },
    text: { fontSize: 15, fontWeight: '800', color: c.text, letterSpacing: 0.2 },
    count: { color: c.muted, fontWeight: '800' },
  });

export default SectionTitle;
