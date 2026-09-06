import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppColors, spacing } from '../theme';

interface Props {
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  message?: string;
}

const EmptyState: React.FC<Props> = ({ icon = 'inbox-outline', title, message }) => {
  const c = useAppColors();
  return (
    <View style={styles.wrap}>
      <MaterialCommunityIcons name={icon} size={48} color={c.muted} />
      <Text style={[styles.title, { color: c.text }]}>{title}</Text>
      {message ? <Text style={[styles.message, { color: c.muted }]}>{message}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: spacing(10) },
  title: { marginTop: spacing(3), fontSize: 16, fontWeight: '600' },
  message: {
    marginTop: spacing(1),
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: spacing(6),
  },
});

export default EmptyState;
