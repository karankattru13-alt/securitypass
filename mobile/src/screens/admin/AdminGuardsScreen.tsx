import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, Divider, Switch, Avatar } from 'react-native-paper';
import Screen from '../../components/Screen';
import AppHeader from '../../components/AppHeader';
import { useAppColors, spacing } from '../../theme';
import { initials } from '../../utils/format';
import api from '../../services/api';

type Pal = ReturnType<typeof useAppColors>;

interface Guard {
  id: number;
  name: string;
  phone: string;
  gate: string;
  shift: string;
  onDuty: boolean;
}

const SEED: Guard[] = [
  { id: 1, name: 'Ravi Kumar', phone: '9000000001', gate: 'Main Gate', shift: 'Morning (6am–2pm)', onDuty: true },
  { id: 2, name: 'Sunil Yadav', phone: '9811111111', gate: 'Main Gate', shift: 'Evening (2pm–10pm)', onDuty: true },
  { id: 3, name: 'Imran Shaikh', phone: '9822222222', gate: 'Service Gate', shift: 'Morning (6am–2pm)', onDuty: false },
  { id: 4, name: 'Deepak Rao', phone: '9833333333', gate: 'Service Gate', shift: 'Night (10pm–6am)', onDuty: false },
];

const AdminGuardsScreen: React.FC<any> = ({ navigation }) => {
  const c = useAppColors();
  const styles = React.useMemo(() => makeStyles(c), [c]);
  const [guards, setGuards] = useState<Guard[]>(SEED);

  const toggle = (id: number) => {
    setGuards((prev) =>
      prev.map((g) => {
        if (g.id !== id) return g;
        const next = !g.onDuty;
        (next ? api.recordGuardCheckIn() : api.recordGuardCheckOut()).catch(() => {});
        return { ...g, onDuty: next };
      })
    );
  };

  const onDuty = guards.filter((g) => g.onDuty).length;

  return (
    <Screen padded={false}>
      <AppHeader
        title="Security Staff"
        subtitle={`${onDuty} of ${guards.length} on duty`}
        color={c.admin}
        onBack={() => navigation.goBack()}
      />
      <View style={styles.body}>
        <Card style={styles.card}>
          {guards.map((g, i) => (
            <React.Fragment key={g.id}>
              <View style={styles.row}>
                <Avatar.Text
                  size={44}
                  label={initials(...g.name.split(' '))}
                  style={{ backgroundColor: g.onDuty ? c.success : c.muted }}
                />
                <View style={styles.info}>
                  <Text style={styles.name}>{g.name}</Text>
                  <Text style={styles.meta}>
                    {g.gate} · {g.shift}
                  </Text>
                  <Text style={styles.phone}>{g.phone}</Text>
                </View>
                <View style={styles.dutyWrap}>
                  <Text style={[styles.duty, { color: g.onDuty ? c.success : c.muted }]}>
                    {g.onDuty ? 'On duty' : 'Off'}
                  </Text>
                  <Switch value={g.onDuty} onValueChange={() => toggle(g.id)} />
                </View>
              </View>
              {i < guards.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </Card>
      </View>
    </Screen>
  );
};

const makeStyles = (c: Pal) =>
  StyleSheet.create({
  body: { padding: spacing(4) },
  card: { backgroundColor: c.card },
  row: { flexDirection: 'row', alignItems: 'center', padding: spacing(3) },
  info: { flex: 1, marginLeft: spacing(3) },
  name: { fontSize: 15, fontWeight: '700', color: c.text },
  meta: { fontSize: 12, color: c.muted, marginTop: 2 },
  phone: { fontSize: 12, color: c.muted, marginTop: 2 },
  dutyWrap: { alignItems: 'center' },
  duty: { fontSize: 11, fontWeight: '700', marginBottom: 2 },
});

export default AdminGuardsScreen;
