import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Button, HelperText } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import Screen from '../../components/Screen';
import LabeledInput from '../../components/LabeledInput';
import { useAppColors, spacing, radius } from '../../theme';
import { AppDispatch, RootState } from '../../store';
import { login, clearError } from '../../store/slices/authSlice';

type Pal = ReturnType<typeof useAppColors>;

const LoginScreen: React.FC<any> = ({ navigation }) => {
  const c = useAppColors();
  const styles = React.useMemo(() => makeStyles(c), [c]);
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((s: RootState) => s.auth);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const submit = () => {
    dispatch(clearError());
    dispatch(login({ phone: phone.trim(), password }));
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.brand}>
          <View style={styles.badge}>
            <MaterialCommunityIcons name="shield-home" size={34} color={c.primary} />
          </View>
          <Text style={styles.title}>SocietyPass</Text>
          <Text style={styles.subtitle}>Gate & visitor management</Text>
        </View>

        <View style={styles.card}>
          <LabeledInput
            label="PHONE NUMBER"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="10-digit mobile number"
            icon="phone-outline"
            maxLength={10}
          />
          <LabeledInput
            label="PASSWORD"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Your password"
            icon="lock-outline"
          />

          {error ? (
            <HelperText type="error" visible style={styles.error}>
              {error}
            </HelperText>
          ) : null}

          <Button
            mode="contained"
            onPress={submit}
            loading={loading}
            disabled={loading || phone.length < 10 || !password}
            style={styles.signInBtn}
            contentStyle={styles.signInContent}
            labelStyle={styles.signInLabel}
          >
            Sign In
          </Button>

          <Button
            mode="text"
            icon="cellphone-key"
            onPress={() => navigation.navigate('OTP', { phone })}
            style={styles.otpBtn}
          >
            Sign in with a one-time code
          </Button>
        </View>

        <Text style={styles.newHere}>New to SocietyPass?</Text>
        <View style={styles.signupRow}>
          <Button
            mode="outlined"
            compact
            icon="home-account"
            style={styles.signupBtn}
            onPress={() => navigation.navigate('Register', { role: 'resident' })}
          >
            Resident
          </Button>
          <Button
            mode="outlined"
            compact
            icon="shield-account"
            textColor={c.guard}
            style={[styles.signupBtn, { borderColor: c.guard }]}
            onPress={() => navigation.navigate('Register', { role: 'guard' })}
          >
            Guard
          </Button>
          <Button
            mode="outlined"
            compact
            icon="office-building"
            textColor={c.admin}
            style={[styles.signupBtn, { borderColor: c.admin }]}
            onPress={() => navigation.navigate('Register', { role: 'admin' })}
          >
            Owner
          </Button>
        </View>
        <Text style={styles.footHint}>
          An owner signs up first and adds their society or building, then guards
          and residents join.
        </Text>
      </KeyboardAvoidingView>
    </Screen>
  );
};

const makeStyles = (c: Pal) =>
  StyleSheet.create({
    brand: { alignItems: 'center', marginTop: spacing(8), marginBottom: spacing(6) },
    badge: {
      width: 66,
      height: 66,
      borderRadius: radius.lg,
      backgroundColor: `${c.primary}1A`,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing(3),
    },
    title: { fontSize: 26, fontWeight: '800', color: c.text, letterSpacing: 0.3 },
    subtitle: { fontSize: 13.5, color: c.muted, marginTop: spacing(1) },
    card: {
      backgroundColor: c.card,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      padding: spacing(5),
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
      elevation: 2,
    },
    error: { paddingHorizontal: 0, marginBottom: spacing(1) },
    signInBtn: { marginTop: spacing(2), borderRadius: radius.pill },
    signInContent: { height: 50 },
    signInLabel: { fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },
    otpBtn: { marginTop: spacing(2) },
    newHere: {
      textAlign: 'center',
      color: c.muted,
      fontSize: 12.5,
      fontWeight: '700',
      marginTop: spacing(7),
      marginBottom: spacing(3),
      letterSpacing: 0.4,
    },
    signupRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: spacing(2),
    },
    signupBtn: { borderRadius: radius.pill, borderColor: c.primary },
    footHint: {
      color: c.muted,
      fontSize: 11.5,
      textAlign: 'center',
      marginTop: spacing(4),
      paddingHorizontal: spacing(4),
      lineHeight: 17,
    },
  });

export default LoginScreen;
