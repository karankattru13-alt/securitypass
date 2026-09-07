import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppColors, spacing, radius } from '../theme';

interface Props {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: number | string;
  tint?: string;
}

const StatTile: React.FC<Props> = ({ icon, label, value, tint }) => {
  const c = useAppColors();
  const styles = React.useMemo(() => makeStyles(c), [c]);
  const color = tint ?? c.primary;
  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: `${color}22` }]}>
        <MaterialCommunityIcons name={icon} size={16} color={color} />
      </View>
      <Text style={styles.value}>{value ?? 0}</Text>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
};

const makeStyles = (c: ReturnType<typeof useAppColors>) =>
  StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: c.card,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      paddingVertical: spacing(3),
      paddingHorizontal: spacing(2),
      alignItems: 'center',
      elevation: 2,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
    },
    iconWrap: {
      width: 30,
      height: 30,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing(2),
    },
    value: { fontSize: 20, fontWeight: '800', color: c.text },
    label: { fontSize: 11, color: c.muted, marginTop: 2, fontWeight: '600' },
  });

export default StatTile;
