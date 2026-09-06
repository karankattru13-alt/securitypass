import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TextInput, Button, HelperText } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import Screen from '../../components/Screen';
import AppHeader from '../../components/AppHeader';
import { useAppColors, spacing } from '../../theme';
import { AppDispatch, RootState } from '../../store';
import { requestOTP, verifyOTP, clearError } from '../../store/slices/authSlice';

type Pal = ReturnType<typeof useAppColors>;

const OTPScreen: React.FC<any> = ({ navigation, route }) => {
  const c = useAppColors();
  const styles = React.useMemo(() => makeStyles(c), [c]);
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((s: RootState) => s.auth);
  const [phone, setPhone] = useState(route.params?.phone ?? '');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);

  const sendCode = async () => {
    dispatch(clearError());
    const res = await dispatch(requestOTP(phone.trim()));
    if (requestOTP.fulfilled.match(res)) setSent(true);
  };

  const verify = () => {
    dispatch(clearError());
    dispatch(verifyOTP({ phone: phone.trim(), code: code.trim() }));
  };

  return (
    <Screen padded={false}>
      <AppHeader
        title="Sign in with OTP"
        subtitle={sent ? 'Enter the 6-digit code' : 'We will send a one-time code'}
        onBack={() => navigation.goBack()}
        hideLogout
      />
      <View style={styles.body}>
        <MaterialCommunityIcons
          name="message-lock"
          size={48}
          color={c.primary}
          style={styles.icon}
        />

        <TextInput
          label="Phone number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          maxLength={10}
          disabled={sent}
          left={<TextInput.Icon icon="phone" />}
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
              left={<TextInput.Icon icon="numeric" />}
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
            disabled={loading || phone.length < 10}
            style={styles.button}
          >
            Send OTP
          </Button>
        ) : (
          <>
            <Button
              mode="contained"
              onPress={verify}
              loading={loading}
              disabled={loading || code.length < 6}
              style={styles.button}
            >
              Verify & Continue
            </Button>
            <Button mode="text" onPress={sendCode} disabled={loading}>
              Resend code
            </Button>
          </>
        )}
      </View>
    </Screen>
  );
};

const makeStyles = (c: Pal) =>
  StyleSheet.create({
  body: { padding: spacing(4) },
  icon: { alignSelf: 'center', marginVertical: spacing(6) },
  input: { marginBottom: spacing(3), backgroundColor: c.card },
  hint: { color: c.muted, fontSize: 12, marginBottom: spacing(2) },
  button: { marginTop: spacing(2), paddingVertical: spacing(1) },
});

export default OTPScreen;
