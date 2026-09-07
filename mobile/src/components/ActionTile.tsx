import React from 'react';
import { Text, StyleSheet, Pressable, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppColors, spacing, radius, gradientFor } from '../theme';

interface Props {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
  /** solid gradient tile (guard actions) vs light tile with tinted icon */
  filled?: boolean;
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
        !filled && {
          backgroundColor: c.card,
          borderColor: c.border,
          borderWidth: StyleSheet.hairlineWidth,
        },
        filled && styles.filledShadow,
        pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
      ]}
    >
      {filled ? (
        <LinearGradient
          colors={gradientFor(color)}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <View
        style={[
          styles.badge,
          { backgroundColor: filled ? 'rgba(255,255,255,0.22)' : `${color}22` },
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
      minHeight: 88,
      borderRadius: radius.lg,
      paddingVertical: spacing(3),
      paddingHorizontal: spacing(3),
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing(3),
      overflow: 'hidden',
    },
    filledShadow: {
      elevation: 3,
      shadowColor: '#000',
      shadowOpacity: 0.16,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
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
