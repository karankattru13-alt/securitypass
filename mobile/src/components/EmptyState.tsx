import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppColors, spacing, radius } from '../theme';

interface Props {
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  message?: string;
  tint?: string;
}

const EmptyState: React.FC<Props> = ({
  icon = 'inbox-outline',
  title,
  message,
  tint,
}) => {
  const c = useAppColors();
  const styles = React.useMemo(() => makeStyles(c), [c]);
  const color = tint ?? c.muted;
  return (
    <View style={styles.wrap}>
      <View style={[styles.iconWrap, { backgroundColor: `${color}18` }]}>
        <MaterialCommunityIcons name={icon} size={22} color={color} />
      </View>
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>
    </View>
  );
};

const makeStyles = (c: ReturnType<typeof useAppColors>) =>
  StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(3),
      backgroundColor: c.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      borderStyle: 'dashed',
      paddingVertical: spacing(4),
      paddingHorizontal: spacing(4),
      marginBottom: spacing(3),
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: { flex: 1 },
    title: { fontSize: 14, fontWeight: '700', color: c.text },
    message: { fontSize: 12.5, color: c.muted, marginTop: 2, lineHeight: 17 },
  });

export default EmptyState;
