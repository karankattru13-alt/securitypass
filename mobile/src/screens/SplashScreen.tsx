import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppColors, spacing } from '../theme';

const SplashScreen: React.FC = () => {
  const c = useAppColors();
  return (
    <View style={[styles.container, { backgroundColor: c.primary }]}>
      <MaterialCommunityIcons name="shield-home" size={72} color="#fff" />
      <Text style={styles.title}>SocietyPass</Text>
      <Text style={styles.tag}>Gated community visitor management</Text>
      <ActivityIndicator color="#fff" style={{ marginTop: spacing(8) }} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 32, fontWeight: '800', color: '#fff', marginTop: spacing(4) },
  tag: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: spacing(2) },
});

export default SplashScreen;
