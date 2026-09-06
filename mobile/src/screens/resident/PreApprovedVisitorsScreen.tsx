import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, Button, TextInput, ActivityIndicator, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../../components/Screen';
import AppHeader from '../../components/AppHeader';
import EmptyState from '../../components/EmptyState';
import { useAppColors, spacing } from '../../theme';
import { smartDate } from '../../utils/format';
import { RootState } from '../../store';
import api from '../../services/api';

type Pal = ReturnType<typeof useAppColors>;

const WEEK = 7 * 24 * 3600 * 1000;

const PreApprovedVisitorsScreen: React.FC<any> = ({ navigation }) => {
  const c = useAppColors();
  const styles = React.useMemo(() => makeStyles(c), [c]);
  const { user } = useSelector((s: RootState) => s.auth);
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [purpose, setPurpose] = useState('');
  const [days, setDays] = useState('7');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await api.getPreApprovedVisitors();
      setList(r.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const add = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const validDays = Math.max(1, parseInt(days, 10) || 7);
      await api.createPreApprovedVisitor({
        name: name.trim(),
        phone: phone.trim(),
        purpose: purpose.trim() || 'Regular visitor',
        flat: user?.flat,
        valid_from: new Date().toISOString(),
        valid_to: new Date(Date.now() + validDays * 24 * 3600 * 1000).toISOString(),
      });
      setName('');
      setPhone('');
      setPurpose('');
      setDays('7');
      setShowForm(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen padded={false}>
      <AppHeader
        title="Pre-Approved"
        subtitle="Recurring visitors & help"
        color={c.resident}
        onBack={() => navigation.goBack()}
      />
      <View style={styles.body}>
        <Button
          mode={showForm ? 'outlined' : 'contained'}
          icon={showForm ? 'close' : 'plus'}
          buttonColor={showForm ? undefined : c.resident}
          onPress={() => setShowForm((v) => !v)}
          style={styles.toggle}
        >
          {showForm ? 'Cancel' : 'Add Pre-Approved Visitor'}
        </Button>

        {showForm && (
          <Card style={styles.formCard}>
            <Card.Content>
              <TextInput
                label="Name *"
                value={name}
                onChangeText={setName}
                style={styles.input}
              />
              <TextInput
                label="Phone"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={10}
                style={styles.input}
              />
              <TextInput
                label="Purpose"
                value={purpose}
                onChangeText={setPurpose}
                style={styles.input}
              />
              <TextInput
                label="Valid for (days)"
                value={days}
                onChangeText={setDays}
                keyboardType="number-pad"
                style={styles.input}
              />
              <Button
                mode="contained"
                buttonColor={c.resident}
                loading={saving}
                disabled={saving}
                onPress={add}
              >
                Save
              </Button>
            </Card.Content>
          </Card>
        )}

        {loading ? (
          <ActivityIndicator color={c.resident} style={{ marginTop: spacing(8) }} />
        ) : list.length === 0 ? (
          <EmptyState icon="account-check-outline" title="No pre-approved visitors" />
        ) : (
          list.map((p) => (
            <Card key={p.id} style={styles.card}>
              <Card.Content style={styles.row}>
                <MaterialCommunityIcons
                  name="account-check"
                  size={28}
                  color={c.resident}
                />
                <View style={styles.info}>
                  <Text style={styles.name}>{p.name}</Text>
                  <Text style={styles.meta}>
                    {p.purpose}
                    {p.phone ? ` • ${p.phone}` : ''}
                  </Text>
                  <Text style={styles.valid}>Valid until {smartDate(p.valid_to)}</Text>
                </View>
              </Card.Content>
              <Divider />
            </Card>
          ))
        )}
      </View>
    </Screen>
  );
};

const makeStyles = (c: Pal) =>
  StyleSheet.create({
  body: { padding: spacing(4) },
  toggle: { marginBottom: spacing(4) },
  formCard: { backgroundColor: c.card, marginBottom: spacing(4) },
  input: { marginBottom: spacing(3), backgroundColor: c.card },
  card: { backgroundColor: c.card, marginBottom: spacing(3) },
  row: { flexDirection: 'row', alignItems: 'center' },
  info: { flex: 1, marginLeft: spacing(3) },
  name: { fontSize: 15, fontWeight: '700', color: c.text },
  meta: { fontSize: 13, color: c.muted, marginTop: 2 },
  valid: { fontSize: 11, color: c.muted, marginTop: 4 },
});

export default PreApprovedVisitorsScreen;
