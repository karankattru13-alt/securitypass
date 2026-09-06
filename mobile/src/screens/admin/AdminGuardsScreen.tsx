import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, Divider, Switch, Avatar, ActivityIndicator } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../../components/Screen';
import AppHeader from '../../components/AppHeader';
import EmptyState from '../../components/EmptyState';
import { useAppColors, spacing } from '../../theme';
import { initials } from '../../utils/format';
import api from '../../services/api';

type Pal = ReturnType<typeof useAppColors>;

interface Guard {
  id: number;
  name: string;
  first_name: string;
  last_name: string;
  phone: string;
  gate: string;
  shift: string;
  on_duty: boolean;
}

const AdminGuardsScreen: React.FC<any> = ({ navigation }) => {
  const c = useAppColors();
  const styles = React.useMemo(() => makeStyles(c), [c]);
  const [guards, setGuards] = useState<Guard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const r = await api.getGuards();
      setGuards(r.data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const toggle = async (g: Guard) => {
    setBusyId(g.id);
    const next = !g.on_duty;
    setGuards((prev) => prev.map((x) => (x.id === g.id ? { ...x, on_duty: next } : x)));
    try {
      await api.setGuardDuty(g.id, next);
      await load();
    } catch {
      setGuards((prev) => prev.map((x) => (x.id === g.id ? { ...x, on_duty: g.on_duty } : x)));
    } finally {
      setBusyId(null);
    }
  };

  const onDutyCount = guards.filter((g) => g.on_duty).length;

  return (
    <Screen padded={false} refreshing={refreshing} onRefresh={load}>
      <AppHeader
        title="Security Staff"
        subtitle={`${onDutyCount} of ${guards.length} on duty`}
        color={c.admin}
        onBack={() => navigation.goBack()}
      />
      <View style={styles.body}>
        {loading ? (
          <ActivityIndicator color={c.admin} style={{ marginTop: spacing(10) }} />
        ) : guards.length === 0 ? (
          <EmptyState icon="shield-off-outline" title="No guards registered" />
        ) : (
          <Card style={styles.card}>
            {guards.map((g, i) => (
              <React.Fragment key={g.id}>
                <View style={styles.row}>
                  <Avatar.Text
                    size={44}
                    label={initials(g.first_name, g.last_name)}
                    style={{ backgroundColor: g.on_duty ? c.success : c.muted }}
                  />
                  <View style={styles.info}>
                    <Text style={styles.name}>{g.name}</Text>
                    <Text style={styles.meta}>
                      {g.gate} · {g.shift}
                    </Text>
                    <Text style={styles.phone}>{g.phone}</Text>
                  </View>
                  <View style={styles.dutyWrap}>
                    <Text style={[styles.duty, { color: g.on_duty ? c.success : c.muted }]}>
                      {g.on_duty ? 'On duty' : 'Off'}
                    </Text>
                    <Switch
                      value={g.on_duty}
                      onValueChange={() => toggle(g)}
                      disabled={busyId === g.id}
                      color={c.success}
                    />
                  </View>
                </View>
                {i < guards.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </Card>
        )}
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
