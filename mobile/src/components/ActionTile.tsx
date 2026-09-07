import React from 'react';
import { Text, StyleSheet, Pressable, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppColors, spacing, radius } from '../theme';

interface Props {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
  /** solid coloured tile (guard actions) vs light tile with tinted icon */
  filled?: boolean;
  /** grid item width, default '48%' */
  width?: string;
}

const ActionTile: React.FC<Props> = ({
  icon,
  label,
  color,
  onPress,
  filled,
  width = '48%',
}) => {
  const c = useAppColors();
  const styles = React.useMemo(() => makeStyles(c), [c]);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        { width: width as any },
        filled
          ? { backgroundColor: color }
          : { backgroundColor: c.card, borderColor: c.border, borderWidth: StyleSheet.hairlineWidth },
        pressed && { opacity: 0.85 },
      ]}
    >
      <View
        style={[
          styles.badge,
          { backgroundColor: filled ? 'rgba(255,255,255,0.18)' : `${color}22` },
        ]}
      >
        <MaterialCommunityIcons name={icon} size={20} color={filled ? '#fff' : color} />
      </View>
      <Text
        style={[styles.label, { color: filled ? '#fff' : c.text }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const makeStyles = (c: ReturnType<typeof useAppColors>) =>
  StyleSheet.create({
    tile: {
      minHeight: 84,
      borderRadius: radius.lg,
      paddingVertical: spacing(3),
      paddingHorizontal: spacing(3),
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing(3),
    },
    badge: {
      width: 38,
      height: 38,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing(2),
    },
    label: { fontSize: 12.5, fontWeight: '800', textAlign: 'center' },
  });

export default ActionTile;
