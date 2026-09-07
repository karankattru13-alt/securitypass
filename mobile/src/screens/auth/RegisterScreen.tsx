import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TextInput, Button, HelperText, SegmentedButtons } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import Screen from '../../components/Screen';
import AppHeader from '../../components/AppHeader';
import SocietyPicker from '../../components/SocietyPicker';
import { useAppColors, spacing } from '../../theme';
import { AppDispatch, RootState } from '../../store';
import { requestOTP, verifyOTP, clearError } from '../../store/slices/authSlice';

type Pal = ReturnType<typeof useAppColors>;

const RegisterScreen: React.FC<any> = ({ navigation, route }) => {
  const c = useAppColors();
  const styles = React.useMemo(() => makeStyles(c), [c]);
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((s: RootState) => s.auth);

  const rp = route.params?.role;
  const role: 'resident' | 'guard' | 'society_admin' =
    rp === 'guard' ? 'guard' : rp === 'admin' || rp === 'society_admin' ? 'society_admin' : 'resident';
  const isGuard = role === 'guard';
  const isAdmin = role === 'society_admin';
  const accent = isGuard ? c.guard : isAdmin ? c.admin : c.primary;
  const roleWord = isGuard ? 'guard' : isAdmin ? 'owner / admin' : 'resident';

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);

  // Guard / resident: pick an existing society.
  const [societyId, setSocietyId] = useState<number | null>(null);
  const [societyCount, setSocietyCount] = useState<number | null>(null);

  // Admin: create a new society / building on sign-up.
  const [sName, setSName] = useState('');
  const [sType, setSType] = useState<'society' | 'building'>('society');
  const [sCity, setSCity] = useState('');
  const [sAddress, setSAddress] = useState('');
  const [sPincode, setSPincode] = useState('');

  const nameOk = firstName.trim() && lastName.trim() && phone.trim().length === 10;
  const societyOk = isAdmin
    ? !!sName.trim()
    : societyCount === 0 || societyId != null;
  const canSend = nameOk && societyOk;

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
        society_id: !isAdmin ? societyId : undefined,
        society: isAdmin
          ? {
              name: sName.trim(),
              type: sType,
              city: sCity.trim(),
              address: sAddress.trim(),
              pincode: sPincode.trim(),
            }
          : undefined,
      })
    );
  };

  return (
    <Screen padded={false}>
      <AppHeader
        title={`Create ${roleWord} account`}
        subtitle={
          isAdmin
            ? 'Society / building owner sign-up'
            : isGuard
            ? 'Security staff sign-up'
            : 'Resident sign-up'
        }
        color={accent}
        onBack={() => navigation.goBack()}
        hideLogout
      />
      <View style={styles.body}>
        <TextInput
          mode="outlined"
          label="First name"
          value={firstName}
          onChangeText={setFirstName}
          disabled={sent}
          style={styles.input}
        />
        <TextInput
          mode="outlined"
          label="Last name"
          value={lastName}
          onChangeText={setLastName}
          disabled={sent}
          style={styles.input}
        />
        <TextInput
          mode="outlined"
          label="Phone number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          maxLength={10}
          disabled={sent}
          style={styles.input}
        />

        {!isAdmin ? (
          <SocietyPicker
            value={societyId}
            onChange={setSocietyId}
            onCount={setSocietyCount}
            disabled={sent}
            emptyHint="No societies exist yet. Ask your society owner to set one up, or continue and pick it later in Profile."
          />
        ) : (
          <>
            <Text style={styles.sectionLabel}>Your society / building</Text>
            <TextInput
              mode="outlined"
              label="Name *"
              value={sName}
              onChangeText={setSName}
              disabled={sent}
              autoCapitalize="words"
              style={styles.input}
            />
            <SegmentedButtons
              value={sType}
              onValueChange={(v) => setSType(v as any)}
              buttons={[
                { value: 'society', label: 'Society' },
                { value: 'building', label: 'Building' },
              ]}
              style={styles.segment}
            />
            <TextInput
              mode="outlined"
              label="City"
              value={sCity}
              onChangeText={setSCity}
              disabled={sent}
              autoCapitalize="words"
              style={styles.input}
            />
            <TextInput
              mode="outlined"
              label="Address"
              value={sAddress}
              onChangeText={setSAddress}
              disabled={sent}
              style={styles.input}
            />
            <TextInput
              mode="outlined"
              label="Pincode"
              value={sPincode}
              onChangeText={setSPincode}
              keyboardType="number-pad"
              disabled={sent}
              style={styles.input}
            />
          </>
        )}

        {sent && (
          <>
            <TextInput
              mode="outlined"
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
            buttonColor={accent}
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
            buttonColor={accent}
            style={styles.button}
          >
            {isAdmin
              ? 'Verify & Create Account + Society'
              : isGuard
              ? 'Verify & Create Guard Account'
              : 'Verify & Create Account'}
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
    segment: { marginBottom: spacing(3) },
    sectionLabel: {
      fontSize: 13,
      fontWeight: '800',
      color: c.text,
      marginBottom: spacing(2),
      marginTop: spacing(1),
    },
    hint: { color: c.muted, fontSize: 12, marginBottom: spacing(2) },
    button: { marginTop: spacing(2), paddingVertical: spacing(1) },
  });

export default RegisterScreen;
