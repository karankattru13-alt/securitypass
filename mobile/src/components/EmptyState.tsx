import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing } from '../theme';

interface Props {
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  message?: string;
}

const EmptyState: React.FC<Props> = ({ icon = 'inbox-outline', title, message }) => (
  <View style={styles.wrap}>
    <MaterialCommunityIcons name={icon} size={48} color={colors.muted} />
    <Text style={styles.title}>{title}</Text>
    {message ? <Text style={styles.message}>{message}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: spacing(10) },
  title: {
    marginTop: spacing(3),
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  message: {
    marginTop: spacing(1),
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    paddingHorizontal: spacing(6),
  },
});

export default EmptyState;
