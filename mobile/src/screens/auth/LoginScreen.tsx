import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, HelperText } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import Screen from '../../components/Screen';
import LabeledInput from '../../components/LabeledInput';
import { useAppColors, spacing } from '../../theme';
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

        <LabeledInput
          label="Phone number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="10-digit mobile number"
          left={<TextInput.Icon icon="phone" />}
          maxLength={10}
        />
        <LabeledInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPass}
          placeholder="Your password"
          left={<TextInput.Icon icon="lock" />}
          right={
            <TextInput.Icon
              icon={showPass ? 'eye-off' : 'eye'}
              onPress={() => setShowPass((v) => !v)}
            />
          }
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
          <Button
            mode="text"
            compact
            textColor={c.admin}
            onPress={() => navigation.navigate('Register', { role: 'admin' })}
          >
            Owner / Admin sign-up
          </Button>
        </View>

        <Text style={styles.newHint}>
          New here? An owner signs up first and adds their society or building,
          then guards and residents sign up.
        </Text>
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
    newHint: {
      color: c.muted,
      fontSize: 12,
      textAlign: 'center',
      marginTop: spacing(6),
      paddingHorizontal: spacing(4),
    },
  });

export default LoginScreen;
