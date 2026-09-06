import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { statusColor, prettyStatus, radius } from '../theme';

const StatusPill: React.FC<{ status?: string }> = ({ status }) => {
  const c = statusColor(status);
  return (
    <View style={[styles.pill, { backgroundColor: `${c}22`, borderColor: c }]}>
      <Text style={[styles.text, { color: c }]}>{prettyStatus(status)}</Text>
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
