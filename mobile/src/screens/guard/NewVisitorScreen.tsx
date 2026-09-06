import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  TextInput,
  Button,
  SegmentedButtons,
  HelperText,
  Card,
  ActivityIndicator,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import Screen from '../../components/Screen';
import AppHeader from '../../components/AppHeader';
import { useAppColors, spacing, radius } from '../../theme';
import { AppDispatch } from '../../store';
import { createVisitor } from '../../store/slices/visitorSlice';
import api from '../../services/api';

type Pal = ReturnType<typeof useAppColors>;

const TYPES = [
  { value: 'guest', label: 'Guest', icon: 'account' },
  { value: 'delivery', label: 'Delivery', icon: 'package-variant-closed' },
  { value: 'staff', label: 'Staff', icon: 'toolbox-outline' },
  { value: 'cab', label: 'Cab', icon: 'car' },
];

interface Resident {
  id: number;
  name: string;
  phone: string;
  flat: string;
}

const NewVisitorScreen: React.FC<any> = ({ navigation, route }) => {
  const c = useAppColors();
  const styles = React.useMemo(() => makeStyles(c), [c]);
  const dispatch = useDispatch<AppDispatch>();
  const [type, setType] = useState<string>(route.params?.type ?? 'guest');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [purpose, setPurpose] = useState('');
  const [vehicle, setVehicle] = useState('');

  const [residents, setResidents] = useState<Resident[]>([]);
  const [loadingResidents, setLoadingResidents] = useState(true);
  const [residentQuery, setResidentQuery] = useState('');
  const [selected, setSelected] = useState<Resident | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .getResidents()
      .then((r) => setResidents(r.data))
      .catch(() => setResidents([]))
      .finally(() => setLoadingResidents(false));
  }, []);

  const matches = useMemo(() => {
    const q = residentQuery.trim().toLowerCase();
    if (!q) return residents.slice(0, 6);
    return residents
      .filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          (r.flat || '').toLowerCase().includes(q) ||
          (r.phone || '').includes(q)
      )
      .slice(0, 6);
  }, [residents, residentQuery]);

  const submit = async () => {
    if (!selected) {
      setError('Select the resident this visitor is here to meet.');
      return;
    }
    if (!name.trim()) {
      setError('Enter the visitor name.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const res = await dispatch(
        createVisitor({
          name: name.trim(),
          phone: phone.trim(),
          resident_id: selected.id,
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
        subtitle="Send an entry request to the resident"
        color={c.guard}
        onBack={() => navigation.goBack()}
      />
      <View style={styles.body}>
        <Text style={styles.label}>Visiting which resident? *</Text>
        {selected ? (
          <Card style={styles.selectedCard}>
            <Card.Content style={styles.selectedRow}>
              <MaterialCommunityIcons name="account-check" size={26} color={c.guard} />
              <View style={styles.selectedInfo}>
                <Text style={styles.selectedName}>{selected.name}</Text>
                <Text style={styles.selectedMeta}>
                  {selected.flat || 'Flat not set'} · {selected.phone}
                </Text>
              </View>
              <Button compact onPress={() => setSelected(null)}>
                Change
              </Button>
            </Card.Content>
          </Card>
        ) : (
          <>
            <TextInput
              placeholder="Search resident by name, flat or phone"
              value={residentQuery}
              onChangeText={setResidentQuery}
              left={<TextInput.Icon icon="account-search" />}
              style={styles.input}
            />
            {loadingResidents ? (
              <ActivityIndicator color={c.guard} style={{ marginVertical: spacing(4) }} />
            ) : (
              <Card style={styles.listCard}>
                {matches.length === 0 ? (
                  <Text style={styles.noMatch}>No residents match.</Text>
                ) : (
                  matches.map((r, i) => (
                    <TouchableOpacity
                      key={r.id}
                      style={[styles.residentRow, i > 0 && styles.rowBorder]}
                      onPress={() => {
                        setSelected(r);
                        setResidentQuery('');
                        setError(null);
                      }}
                    >
                      <MaterialCommunityIcons name="account" size={22} color={c.muted} />
                      <View style={styles.residentInfo}>
                        <Text style={styles.residentName}>{r.name}</Text>
                        <Text style={styles.residentMeta}>
                          {r.flat || 'Flat not set'} · {r.phone}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </Card>
            )}
          </>
        )}

        <Text style={[styles.label, { marginTop: spacing(4) }]}>Visitor type</Text>
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
          label="Visitor phone"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          maxLength={10}
          left={<TextInput.Icon icon="phone" />}
          style={styles.input}
        />
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
          buttonColor={c.guard}
          style={styles.button}
        >
          Send Request & Add Photo
        </Button>
      </View>
    </Screen>
  );
};

const makeStyles = (c: Pal) =>
  StyleSheet.create({
  body: { padding: spacing(4) },
  label: { fontSize: 13, color: c.muted, marginBottom: spacing(2) },
  segment: { marginBottom: spacing(4) },
  input: { marginBottom: spacing(3), backgroundColor: c.card },
  button: { marginTop: spacing(2), paddingVertical: spacing(1) },
  selectedCard: { backgroundColor: c.cardAlt, marginBottom: spacing(2) },
  selectedRow: { flexDirection: 'row', alignItems: 'center' },
  selectedInfo: { flex: 1, marginLeft: spacing(3) },
  selectedName: { fontSize: 15, fontWeight: '700', color: c.text },
  selectedMeta: { fontSize: 12, color: c.muted, marginTop: 2 },
  listCard: { backgroundColor: c.card, marginBottom: spacing(2) },
  noMatch: { padding: spacing(4), color: c.muted },
  residentRow: { flexDirection: 'row', alignItems: 'center', padding: spacing(3) },
  rowBorder: { borderTopWidth: 1, borderTopColor: c.border },
  residentInfo: { marginLeft: spacing(3), flex: 1 },
  residentName: { fontSize: 14, fontWeight: '600', color: c.text },
  residentMeta: { fontSize: 12, color: c.muted, marginTop: 2 },
});

export default NewVisitorScreen;
