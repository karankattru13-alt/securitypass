import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Searchbar, ActivityIndicator, Avatar, Divider, Chip, Button } from 'react-native-paper';
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

interface Resident {
  id: number;
  name: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  flat: string;
}

const FIELDS: FormField[] = [
  { key: 'first_name', label: 'First name', required: true, autoCapitalize: 'words' },
  { key: 'last_name', label: 'Last name', autoCapitalize: 'words' },
  { key: 'phone', label: 'Phone', type: 'phone', required: true },
  { key: 'email', label: 'Email', type: 'email' },
  { key: 'flat', label: 'House / Flat number', autoCapitalize: 'characters' },
];

const AdminResidentsScreen: React.FC<any> = ({ navigation }) => {
  const c = useAppColors();
  const styles = React.useMemo(() => makeStyles(c), [c]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState<Resident | 'new' | null>(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const r = await api.getResidents();
      setResidents(r.data);
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return residents;
    return residents.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.flat || '').toLowerCase().includes(q) ||
        (r.phone || '').includes(q)
    );
  }, [residents, query]);

  const withFlat = residents.filter((r) => r.flat).length;

  const save = async (v: Record<string, string>) => {
    if (editing === 'new') {
      await api.adminCreateUser({ ...v, role: 'resident' });
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

  return (
    <Screen padded={false} refreshing={refreshing} onRefresh={load}>
      <AppHeader
        title="Residents"
        subtitle={`${residents.length} registered`}
        color={c.admin}
        onBack={() => navigation.goBack()}
      />
      <View style={styles.body}>
        <Searchbar
          placeholder="Search name, house number or phone"
          value={query}
          onChangeText={setQuery}
          style={styles.search}
        />
        <View style={styles.chips}>
          <Chip icon="home" style={styles.chip}>
            {withFlat} with house no.
          </Chip>
          <Chip icon="home-alert" style={styles.chip}>
            {residents.length - withFlat} pending
          </Chip>
          <ExportButton
            filename="residents"
            rows={() => filtered}
            columns={[
              { key: 'name', label: 'Name' },
              { key: 'phone', label: 'Phone' },
              { key: 'email', label: 'Email' },
              { key: 'flat', label: 'House / Flat' },
            ]}
          />
        </View>

        <Button
          mode="contained"
          icon="account-plus"
          buttonColor={c.admin}
          onPress={() => setEditing('new')}
          style={styles.addBtn}
        >
          Add resident
        </Button>

        {loading ? (
          <ActivityIndicator style={{ marginTop: spacing(10) }} color={c.admin} />
        ) : filtered.length === 0 ? (
          <EmptyState icon="account-search-outline" title="No residents match" />
        ) : (
          <Card style={styles.card}>
            {filtered.map((r, i) => (
              <React.Fragment key={r.id}>
                <TouchableOpacity style={styles.row} onPress={() => setEditing(r)}>
                  <Avatar.Text
                    size={40}
                    label={initials(r.first_name, r.last_name)}
                    style={{ backgroundColor: c.admin }}
                  />
                  <View style={styles.info}>
                    <Text style={styles.name}>{r.name}</Text>
                    <Text style={styles.meta}>{r.phone}</Text>
                    <Text style={styles.meta}>{r.email}</Text>
                  </View>
                  <View style={styles.flatWrap}>
                    <Text style={styles.flatLabel}>House</Text>
                    <Text style={[styles.flat, !r.flat && styles.flatMissing]}>
                      {r.flat || '—'}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="pencil-outline" size={18} color={c.muted} />
                </TouchableOpacity>
                {i < filtered.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </Card>
        )}
      </View>

      <EntityFormDialog
        visible={editing != null}
        title={editing === 'new' ? 'Add resident' : 'Edit resident'}
        fields={FIELDS}
        initial={editing && editing !== 'new' ? editing : undefined}
        accent={c.admin}
        submitLabel={editing === 'new' ? 'Create' : 'Save'}
        onSubmit={save}
        onDismiss={() => setEditing(null)}
        onDelete={editing && editing !== 'new' ? remove : undefined}
        deleteConfirm={{
          title: 'Delete resident?',
          message:
            'Their account is removed. Existing visitor records stay for the log.',
        }}
      />
    </Screen>
  );
};

const makeStyles = (c: Pal) =>
  StyleSheet.create({
    body: { padding: spacing(4) },
    search: { marginBottom: spacing(3), backgroundColor: c.card },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: spacing(2),
      marginBottom: spacing(3),
    },
    chip: { backgroundColor: c.card },
    addBtn: { marginBottom: spacing(4), borderRadius: 12 },
    card: { backgroundColor: c.card },
    row: { flexDirection: 'row', alignItems: 'center', padding: spacing(3), gap: spacing(2) },
    info: { flex: 1, marginLeft: spacing(2) },
    name: { fontSize: 15, fontWeight: '700', color: c.text },
    meta: { fontSize: 12, color: c.muted, marginTop: 2 },
    flatWrap: { alignItems: 'flex-end', minWidth: 56 },
    flatLabel: { fontSize: 10, color: c.muted, textTransform: 'uppercase' },
    flat: { fontSize: 15, fontWeight: '800', color: c.admin, marginTop: 2 },
    flatMissing: { color: c.border },
  });

export default AdminResidentsScreen;
