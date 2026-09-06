import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppColors, statusColor, prettyStatus, radius } from '../theme';

const StatusPill: React.FC<{ status?: string }> = ({ status }) => {
  const c = useAppColors();
  const color = statusColor(status, c);
  return (
    <View style={[styles.pill, { backgroundColor: `${color}22`, borderColor: color }]}>
      <Text style={[styles.text, { color }]}>{prettyStatus(status)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  text: { fontSize: 12, fontWeight: '700' },
});

export default StatusPill;
