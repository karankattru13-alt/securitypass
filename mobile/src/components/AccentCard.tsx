import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Card } from 'react-native-paper';
import { useAppColors, radius, spacing } from '../theme';

interface Props {
  children: React.ReactNode;
  /** Colour of the rounded rail down the left edge. */
  accent?: string;
  onPress?: () => void;
  style?: ViewStyle;
  dim?: boolean;
}

/**
 * The standard list card used across the app: generous rounding, a hairline
 * border, a soft tinted wash and a rounded accent rail that is clipped to the
 * card's corners (no square stub poking out).
 */
const AccentCard: React.FC<Props> = ({ children, accent, onPress, style, dim }) => {
  const c = useAppColors();
  const rail = accent ?? c.primary;
  return (
    <Card
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: c.card,
          borderColor: c.border,
          opacity: dim ? 0.6 : 1,
        },
        style,
      ]}
    >
      <View style={[styles.rail, { backgroundColor: rail }]} />
      <View style={[styles.wash, { backgroundColor: `${rail}0F` }]} />
      <Card.Content style={styles.content}>{children}</Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing(3),
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  rail: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
  },
  wash: { ...StyleSheet.absoluteFillObject },
  content: { paddingLeft: spacing(4) + 5, paddingVertical: spacing(4) },
});

export default AccentCard;
