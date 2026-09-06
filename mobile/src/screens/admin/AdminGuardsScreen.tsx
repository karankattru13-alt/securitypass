import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Divider, Switch, Avatar, ActivityIndicator, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../../components/Screen';
import AppHeader from '../../components/AppHeader';
import EmptyState from '../../components/EmptyState';
import ExportButton from '../../components/ExportButton';
import EntityFormDialog, { FormField } from '../../components/EntityFormDialog';
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
  duty_shift?: 'day' | 'night';
  on_duty: boolean;
}

const FIELDS: FormField[] = [
  { key: 'first_name', label: 'First name', required: true, autoCapitalize: 'words' },
  { key: 'last_name', label: 'Last name', autoCapitalize: 'words' },
  { key: 'phone', label: 'Phone', type: 'phone', required: true },
  { key: 'gate', label: 'Gate', autoCapitalize: 'words' },
  {
    key: 'duty_shift',
    label: 'Shift',
    type: 'select',
    options: [
      { value: 'day', label: 'Day' },
      { value: 'night', label: 'Night' },
    ],
  },
];

const AdminGuardsScreen: React.FC<any> = ({ navigation }) => {
  const c = useAppColors();
  const styles = React.useMemo(() => makeStyles(c), [c]);
  const [guards, setGuards] = useState<Guard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [editing, setEditing] = useState<Guard | 'new' | null>(null);

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

  const save = async (v: Record<string, string>) => {
    if (editing === 'new') {
      await api.adminCreateUser({ ...v, role: 'guard' });
    } else if (editing) {
      await api.adminUpdateUser(editing.id, v);
    }
    await load();
  };

  const remove = async () => {
    if (editing && editing !== 'new') {
      await api.adminDeleteUser(editing.id);
      await load();
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
        <View style={styles.exportRow}>
          {guards.length > 0 && (
            <ExportButton
              filename="security-staff"
              rows={() => guards}
              columns={[
                { key: 'name', label: 'Name' },
                { key: 'phone', label: 'Phone' },
                { key: 'gate', label: 'Gate' },
                { key: 'shift', label: 'Shift' },
                { key: 'on_duty', label: 'On duty', map: (g) => (g.on_duty ? 'yes' : 'no') },
              ]}
            />
          )}
        </View>
        <Button
          mode="contained"
          icon="shield-plus"
          buttonColor={c.admin}
          onPress={() => setEditing('new')}
          style={styles.addBtn}
        >
          Add guard
        </Button>
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
                  <TouchableOpacity style={styles.info} onPress={() => setEditing(g)}>
                    <Text style={styles.name}>{g.name}</Text>
                    <Text style={styles.meta}>
                      {g.gate} · {g.shift}
                    </Text>
                    <Text style={styles.phone}>{g.phone}</Text>
                  </TouchableOpacity>
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
                  <TouchableOpacity onPress={() => setEditing(g)} hitSlop={10} style={styles.editIcon}>
                    <MaterialCommunityIcons name="pencil-outline" size={18} color={c.muted} />
                  </TouchableOpacity>
                </View>
                {i < guards.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </Card>
        )}
      </View>

      <EntityFormDialog
        visible={editing != null}
        title={editing === 'new' ? 'Add guard' : 'Edit guard'}
        fields={FIELDS}
        initial={
          editing && editing !== 'new'
            ? { ...editing, duty_shift: editing.duty_shift || 'day' }
            : { duty_shift: 'day' }
        }
        accent={c.admin}
        submitLabel={editing === 'new' ? 'Create' : 'Save'}
        onSubmit={save}
        onDismiss={() => setEditing(null)}
        onDelete={editing && editing !== 'new' ? remove : undefined}
        deleteConfirm={{
          title: 'Delete guard?',
          message: 'Their account is removed from the roster.',
        }}
      />
    </Screen>
  );
};

const makeStyles = (c: Pal) =>
  StyleSheet.create({
    body: { padding: spacing(4) },
    exportRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing(2), minHeight: 4 },
    addBtn: { marginBottom: spacing(4), borderRadius: 12 },
    card: { backgroundColor: c.card },
    row: { flexDirection: 'row', alignItems: 'center', padding: spacing(3), gap: spacing(2) },
    info: { flex: 1, marginLeft: spacing(2) },
    editIcon: { paddingLeft: spacing(1) },
    name: { fontSize: 15, fontWeight: '700', color: c.text },
    meta: { fontSize: 12, color: c.muted, marginTop: 2 },
    phone: { fontSize: 12, color: c.muted, marginTop: 2 },
    dutyWrap: { alignItems: 'center' },
    duty: { fontSize: 11, fontWeight: '700', marginBottom: 2 },
  });

export default AdminGuardsScreen;
