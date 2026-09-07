import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button, HelperText } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import Screen from '../../components/Screen';
import AppHeader from '../../components/AppHeader';
import LabeledInput from '../../components/LabeledInput';
import { useAppColors, spacing, radius } from '../../theme';
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
        <View style={styles.badge}>
          <MaterialCommunityIcons name="message-lock-outline" size={30} color={c.primary} />
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
            disabled={sent}
          />

          {sent && (
            <LabeledInput
              label="OTP CODE"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              placeholder="6-digit code"
              icon="numeric"
              maxLength={6}
              autoFocus
              hint="Demo code: 123456"
            />
          )}

          {error ? (
            <HelperText type="error" visible style={styles.error}>
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
              contentStyle={styles.btnContent}
              labelStyle={styles.btnLabel}
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
                contentStyle={styles.btnContent}
                labelStyle={styles.btnLabel}
              >
                Verify & Continue
              </Button>
              <Button mode="text" onPress={sendCode} disabled={loading} style={styles.resend}>
                Resend code
              </Button>
            </>
          )}
        </View>
      </View>
    </Screen>
  );
};

const makeStyles = (c: Pal) =>
  StyleSheet.create({
    body: { padding: spacing(4) },
    badge: {
      alignSelf: 'center',
      width: 60,
      height: 60,
      borderRadius: radius.lg,
      backgroundColor: `${c.primary}1A`,
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: spacing(6),
    },
    card: {
      backgroundColor: c.card,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      padding: spacing(5),
    },
    error: { paddingHorizontal: 0 },
    button: { marginTop: spacing(2), borderRadius: radius.pill },
    btnContent: { height: 50 },
    btnLabel: { fontSize: 15, fontWeight: '800' },
    resend: { marginTop: spacing(1) },
  });

export default OTPScreen;
