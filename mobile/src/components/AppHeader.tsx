import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tooltip } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch } from 'react-redux';
import { useAppColors, spacing, gradientFor } from '../theme';
import { AppDispatch } from '../store';
import { logout } from '../store/slices/authSlice';
import { appConfirm } from './AppDialog';

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
  appConfirm({
    title: 'Sign out?',
    message: 'You will need to sign in again to use SocietyPass.',
    confirmLabel: 'Sign out',
    tone: 'danger',
    icon: 'logout',
  }).then((ok) => ok && onYes());
};

const AppHeader: React.FC<Props> = ({
  title,
  subtitle,
  color,
  icon,
  onBack,
  right,
  hideLogout,
}) => {
  const c = useAppColors();
  const dispatch = useDispatch<AppDispatch>();
  const bg = color ?? c.primary;

  return (
    <LinearGradient
      colors={gradientFor(bg)}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header}
    >
      {/* subtle decorative circle */}
      <View pointerEvents="none" style={styles.blob} />

      {onBack ? (
        <Tooltip title="Back">
          <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={12}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
        </Tooltip>
      ) : null}
      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right ?? (icon ? <MaterialCommunityIcons name={icon} size={26} color="#fff" /> : null)}
      {!hideLogout ? (
        <Tooltip title="Sign out">
          <TouchableOpacity
            onPress={() => confirmSignOut(() => dispatch(logout()))}
            style={styles.logoutBtn}
            hitSlop={12}
            accessibilityLabel="Sign out"
          >
            <MaterialCommunityIcons name="logout" size={22} color="#fff" />
          </TouchableOpacity>
        </Tooltip>
      ) : null}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing(4),
    paddingTop: spacing(5),
    paddingBottom: spacing(5),
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
  },
  blob: {
    position: 'absolute',
    right: -40,
    top: -60,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  backBtn: { marginRight: spacing(3) },
  textWrap: { flex: 1 },
  title: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: 0.2 },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 2 },
  logoutBtn: {
    marginLeft: spacing(3),
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: 'rgba(255,255,255,0.4)',
    paddingLeft: spacing(3),
  },
});

export default AppHeader;
