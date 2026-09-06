import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { colors, spacing } from '../theme';
import { AppDispatch } from '../store';
import { logout } from '../store/slices/authSlice';

interface Props {
  title: string;
  subtitle?: string;
  color?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  onBack?: () => void;
  right?: React.ReactNode;
  /** Hide the always-on sign-out button (used on pre-auth screens). */
  hideLogout?: boolean;
}

export const confirmSignOut = (onYes: () => void) => {
  const msg = 'Sign out of SocietyPass?';
  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-alert
    if (window.confirm(msg)) onYes();
  } else {
    Alert.alert('Sign out', msg, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: onYes },
    ]);
  }
};

const AppHeader: React.FC<Props> = ({
  title,
  subtitle,
  color = colors.primary,
  icon,
  onBack,
  right,
  hideLogout,
}) => {
  const dispatch = useDispatch<AppDispatch>();

  return (
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
      {!hideLogout ? (
        <TouchableOpacity
          onPress={() => confirmSignOut(() => dispatch(logout()))}
          style={styles.logoutBtn}
          hitSlop={12}
          accessibilityLabel="Sign out"
        >
          <MaterialCommunityIcons name="logout" size={22} color="#fff" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

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
  logoutBtn: {
    marginLeft: spacing(3),
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: 'rgba(255,255,255,0.4)',
    paddingLeft: spacing(3),
  },
});

export default AppHeader;
