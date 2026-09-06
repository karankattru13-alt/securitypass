import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, SegmentedButtons, HelperText, Text } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import Screen from '../../components/Screen';
import AppHeader from '../../components/AppHeader';
import { useAppColors, spacing } from '../../theme';
import { AppDispatch, RootState } from '../../store';
import { createVisitor } from '../../store/slices/visitorSlice';

type Pal = ReturnType<typeof useAppColors>;

const TYPES = [
  { value: 'guest', label: 'Guest' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'cab', label: 'Cab' },
];

const VisitorRequestScreen: React.FC<any> = ({ navigation }) => {
  const c = useAppColors();
  const styles = React.useMemo(() => makeStyles(c), [c]);
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((s: RootState) => s.auth);
  const [type, setType] = useState('guest');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [purpose, setPurpose] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim()) {
      setError('Please enter the visitor name.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await dispatch(
        createVisitor({
          name: name.trim(),
          phone: phone.trim(),
          purpose: purpose.trim() || 'Expected guest',
          type,
          flat: user?.flat,
        })
      ).unwrap();
      navigation.goBack();
    } catch (e: any) {
      setError(typeof e === 'string' ? e : 'Could not add visitor.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen padded={false}>
      <AppHeader
        title="Expect a Guest"
        subtitle="Pre-clear entry for your flat"
        color={c.resident}
        onBack={() => navigation.goBack()}
      />
      <View style={styles.body}>
        {!user?.flat && (
          <HelperText type="error" visible style={styles.blocker}>
            Add your house / flat number in Profile before pre-clearing visitors.
          </HelperText>
        )}
        <Text style={styles.hint}>
          The guard will see this visitor as already approved for {user?.flat ?? 'your flat'}.
        </Text>
        <SegmentedButtons
          value={type}
          onValueChange={setType}
          buttons={TYPES}
          style={styles.segment}
        />
        <TextInput
          label="Visitor name *"
          value={name}
          onChangeText={setName}
          left={<TextInput.Icon icon="account" />}
          style={styles.input}
        />
        <TextInput
          label="Phone"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          maxLength={10}
          left={<TextInput.Icon icon="phone" />}
          style={styles.input}
        />
        <TextInput
          label="Purpose / note"
          value={purpose}
          onChangeText={setPurpose}
          left={<TextInput.Icon icon="text" />}
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
          loading={saving}
          disabled={saving || !user?.flat}
          buttonColor={c.resident}
          style={styles.button}
        >
          Add Expected Visitor
        </Button>
      </View>
    </Screen>
  );
};

const makeStyles = (c: Pal) =>
  StyleSheet.create({
  body: { padding: spacing(4) },
  blocker: { marginBottom: spacing(2) },
  hint: { color: c.muted, fontSize: 13, marginBottom: spacing(4) },
  segment: { marginBottom: spacing(4) },
  input: { marginBottom: spacing(3), backgroundColor: c.card },
  button: { marginTop: spacing(2), paddingVertical: spacing(1) },
});

export default VisitorRequestScreen;
