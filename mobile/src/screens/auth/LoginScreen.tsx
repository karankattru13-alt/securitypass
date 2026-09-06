import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, HelperText, Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import Screen from '../../components/Screen';
import { useAppColors, spacing } from '../../theme';
import { AppDispatch, RootState } from '../../store';
import { login, clearError } from '../../store/slices/authSlice';

type Pal = ReturnType<typeof useAppColors>;

const DEMO = [
  { label: 'Guard', phone: '9000000001' },
  { label: 'Resident', phone: '9000000002' },
  { label: 'Admin', phone: '9000000003' },
];

const LoginScreen: React.FC<any> = ({ navigation }) => {
  const c = useAppColors();
  const styles = React.useMemo(() => makeStyles(c), [c]);
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((s: RootState) => s.auth);
  const [phone, setPhone] = useState('9000000002');
  const [password, setPassword] = useState('password');
  const [showPass, setShowPass] = useState(false);

  const submit = () => {
    dispatch(clearError());
    dispatch(login({ phone: phone.trim(), password }));
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.brand}>
          <MaterialCommunityIcons name="shield-home" size={56} color={c.primary} />
          <Text style={styles.title}>SocietyPass</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>
        </View>

        <TextInput
          label="Phone number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          left={<TextInput.Icon icon="phone" />}
          style={styles.input}
          maxLength={10}
        />
        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPass}
          left={<TextInput.Icon icon="lock" />}
          right={
            <TextInput.Icon
              icon={showPass ? 'eye-off' : 'eye'}
              onPress={() => setShowPass((v) => !v)}
            />
          }
          style={styles.input}
        />

        {error ? (
          <HelperText type="error" visible>
            {error}
          </HelperText>
        ) : null}

        <Button
          mode="contained"
          onPress={submit}
          loading={loading}
          disabled={loading || phone.length < 10}
          style={styles.button}
        >
          Sign In
        </Button>

        <Button
          mode="text"
          onPress={() => navigation.navigate('OTP', { phone })}
          style={styles.linkBtn}
        >
          Sign in with OTP
        </Button>
        <View style={styles.signupRow}>
          <Button
            mode="text"
            compact
            onPress={() => navigation.navigate('Register', { role: 'resident' })}
          >
            Resident sign-up
          </Button>
          <Button
            mode="text"
            compact
            textColor={c.guard}
            onPress={() => navigation.navigate('Register', { role: 'guard' })}
          >
            Guard sign-up
          </Button>
        </View>

        <Card style={styles.demoCard}>
          <Card.Content>
            <Text style={styles.demoTitle}>Demo accounts · password "password"</Text>
            {DEMO.map((d) => (
              <Text
                key={d.phone}
                style={styles.demoRow}
                onPress={() => {
                  setPhone(d.phone);
                  setPassword('password');
                }}
              >
                {d.label}: {d.phone}
              </Text>
            ))}
            <Text style={styles.demoHint}>OTP code in demo mode is always 123456.</Text>
          </Card.Content>
        </Card>
      </KeyboardAvoidingView>
    </Screen>
  );
};

const makeStyles = (c: Pal) =>
  StyleSheet.create({
  brand: { alignItems: 'center', marginTop: spacing(8), marginBottom: spacing(6) },
  title: { fontSize: 26, fontWeight: '800', color: c.text, marginTop: spacing(2) },
  subtitle: { fontSize: 14, color: c.muted, marginTop: 2 },
  input: { marginBottom: spacing(3), backgroundColor: c.card },
  button: { marginTop: spacing(2), paddingVertical: spacing(1) },
  linkBtn: { marginTop: spacing(2) },
  signupRow: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' },
  demoCard: { marginTop: spacing(6), backgroundColor: c.cardAlt },
  demoTitle: { fontWeight: '700', color: c.text, marginBottom: spacing(2) },
  demoRow: { color: c.primary, paddingVertical: 3, fontWeight: '600' },
  demoHint: { color: c.muted, marginTop: spacing(2), fontSize: 12 },
});

export default LoginScreen;
