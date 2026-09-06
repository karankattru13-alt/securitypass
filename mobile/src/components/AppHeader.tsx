import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing } from '../theme';

interface Props {
  title: string;
  subtitle?: string;
  color?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  onBack?: () => void;
  right?: React.ReactNode;
}

const AppHeader: React.FC<Props> = ({
  title,
  subtitle,
  color = colors.primary,
  icon,
  onBack,
  right,
}) => (
  <View style={[styles.header, { backgroundColor: color }]}>
    {onBack ? (
      <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={12}>
        <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
      </TouchableOpacity>
    ) : null}
    <View style={styles.textWrap}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
    {right ?? (icon ? <MaterialCommunityIcons name={icon} size={28} color="#fff" /> : null)}
  </View>
);

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(4),
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: { marginRight: spacing(3) },
  textWrap: { flex: 1 },
  title: { fontSize: 20, fontWeight: '700', color: '#fff' },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
});

export default AppHeader;
