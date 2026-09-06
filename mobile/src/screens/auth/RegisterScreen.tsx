import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TextInput, Button, HelperText } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import Screen from '../../components/Screen';
import AppHeader from '../../components/AppHeader';
import { useAppColors, spacing } from '../../theme';
import { AppDispatch, RootState } from '../../store';
import { requestOTP, verifyOTP, clearError } from '../../store/slices/authSlice';

type Pal = ReturnType<typeof useAppColors>;

const RegisterScreen: React.FC<any> = ({ navigation, route }) => {
  const c = useAppColors();
  const styles = React.useMemo(() => makeStyles(c), [c]);
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((s: RootState) => s.auth);
  const role: 'resident' | 'guard' = route.params?.role === 'guard' ? 'guard' : 'resident';
  const isGuard = role === 'guard';

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);

  const canSend = firstName.trim() && lastName.trim() && phone.trim().length === 10;

  const sendCode = async () => {
    dispatch(clearError());
    const res = await dispatch(requestOTP(phone.trim()));
    if (requestOTP.fulfilled.match(res)) setSent(true);
  };

  const verify = () => {
    dispatch(clearError());
    dispatch(
      verifyOTP({
        phone: phone.trim(),
        code: code.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role,
      })
    );
  };

  return (
    <Screen padded={false}>
      <AppHeader
        title={isGuard ? 'Create guard account' : 'Create account'}
        subtitle={isGuard ? 'Security staff sign-up' : 'Resident sign-up'}
        color={isGuard ? c.guard : c.primary}
        onBack={() => navigation.goBack()}
        hideLogout
      />
      <View style={styles.body}>
        <TextInput
          label="First name"
          value={firstName}
          onChangeText={setFirstName}
          disabled={sent}
          style={styles.input}
        />
        <TextInput
          label="Last name"
          value={lastName}
          onChangeText={setLastName}
          disabled={sent}
          style={styles.input}
        />
        <TextInput
          label="Phone number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          maxLength={10}
          disabled={sent}
          style={styles.input}
        />

        {sent && (
          <>
            <TextInput
              label="OTP code"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
              style={styles.input}
            />
            <Text style={styles.hint}>Demo code: 123456</Text>
          </>
        )}

        {error ? (
          <HelperText type="error" visible>
            {error}
          </HelperText>
        ) : null}

        {!sent ? (
          <Button
            mode="contained"
            onPress={sendCode}
            loading={loading}
            disabled={loading || !canSend}
            buttonColor={isGuard ? c.guard : c.primary}
            style={styles.button}
          >
            Send OTP
          </Button>
        ) : (
          <Button
            mode="contained"
            onPress={verify}
            loading={loading}
            disabled={loading || code.length < 6}
            buttonColor={isGuard ? c.guard : c.primary}
            style={styles.button}
          >
            {isGuard ? 'Verify & Create Guard Account' : 'Verify & Create Account'}
          </Button>
        )}
      </View>
    </Screen>
  );
};

const makeStyles = (c: Pal) =>
  StyleSheet.create({
  body: { padding: spacing(4) },
  input: { marginBottom: spacing(3), backgroundColor: c.card },
  hint: { color: c.muted, fontSize: 12, marginBottom: spacing(2) },
  button: { marginTop: spacing(2), paddingVertical: spacing(1) },
});

export default RegisterScreen;
