import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, SegmentedButtons, HelperText, Chip, Text } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import Screen from '../../components/Screen';
import AppHeader from '../../components/AppHeader';
import { colors, spacing } from '../../theme';
import { AppDispatch } from '../../store';
import { createVisitor } from '../../store/slices/visitorSlice';
import api from '../../services/api';

const TYPES = [
  { value: 'guest', label: 'Guest', icon: 'account' },
  { value: 'delivery', label: 'Delivery', icon: 'package-variant-closed' },
  { value: 'staff', label: 'Staff', icon: 'toolbox-outline' },
  { value: 'cab', label: 'Cab', icon: 'car' },
];

const NewVisitorScreen: React.FC<any> = ({ navigation, route }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [type, setType] = useState<string>(route.params?.type ?? 'guest');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [flat, setFlat] = useState('');
  const [purpose, setPurpose] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [flatMatches, setFlatMatches] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    if (flat.trim().length < 1) {
      setFlatMatches([]);
      return;
    }
    api
      .searchFlat(1, flat.trim())
      .then((r) => active && setFlatMatches(r.data.slice(0, 5)))
      .catch(() => active && setFlatMatches([]));
    return () => {
      active = false;
    };
  }, [flat]);

  const submit = async () => {
    if (!name.trim() || !flat.trim()) {
      setError('Visitor name and flat are required.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const res = await dispatch(
        createVisitor({
          name: name.trim(),
          phone: phone.trim(),
          flat: flat.trim(),
          purpose: purpose.trim() || TYPES.find((t) => t.value === type)?.label,
          type,
          vehicle_number: vehicle.trim() || undefined,
        })
      ).unwrap();
      navigation.replace('VisitorPhoto', { visitorId: res.id });
    } catch (e: any) {
      setError(typeof e === 'string' ? e : 'Could not register visitor.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen padded={false}>
      <AppHeader
        title="New Visitor"
        subtitle="Register at the gate"
        color={colors.guard}
        onBack={() => navigation.goBack()}
      />
      <View style={styles.body}>
        <Text style={styles.label}>Visitor type</Text>
        <SegmentedButtons
          value={type}
          onValueChange={setType}
          buttons={TYPES.map((t) => ({ value: t.value, label: t.label, icon: t.icon }))}
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
          label="Flat to visit *"
          value={flat}
          onChangeText={setFlat}
          autoCapitalize="characters"
          left={<TextInput.Icon icon="home" />}
          style={styles.input}
        />
        {flatMatches.length > 0 && (
          <View style={styles.chips}>
            {flatMatches.map((f) => (
              <Chip
                key={f.id}
                compact
                onPress={() => {
                  setFlat(f.number);
                  setFlatMatches([]);
                }}
                style={styles.chip}
              >
                {f.number} · {f.resident_name}
              </Chip>
            ))}
          </View>
        )}
        <TextInput
          label="Purpose"
          value={purpose}
          onChangeText={setPurpose}
          left={<TextInput.Icon icon="text" />}
          style={styles.input}
        />
        {(type === 'cab' || type === 'delivery') && (
          <TextInput
            label="Vehicle number"
            value={vehicle}
            onChangeText={setVehicle}
            autoCapitalize="characters"
            left={<TextInput.Icon icon="car" />}
            style={styles.input}
          />
        )}

        {error ? (
          <HelperText type="error" visible>
            {error}
          </HelperText>
        ) : null}

        <Button
          mode="contained"
          onPress={submit}
          loading={saving}
          disabled={saving}
          buttonColor={colors.guard}
          style={styles.button}
        >
          Continue to Photo
        </Button>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  body: { padding: spacing(4) },
  label: { fontSize: 13, color: colors.muted, marginBottom: spacing(2) },
  segment: { marginBottom: spacing(4) },
  input: { marginBottom: spacing(3), backgroundColor: colors.card },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing(3) },
  chip: { marginRight: spacing(2), marginBottom: spacing(2) },
  button: { marginTop: spacing(2), paddingVertical: spacing(1) },
});

export default NewVisitorScreen;
