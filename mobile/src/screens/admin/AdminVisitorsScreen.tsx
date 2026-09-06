import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Card, Searchbar, Chip, ActivityIndicator, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../../components/Screen';
import AppHeader from '../../components/AppHeader';
import EmptyState from '../../components/EmptyState';
import ExportButton from '../../components/ExportButton';
import StatusPill from '../../components/StatusPill';
import EntityFormDialog, { FormField } from '../../components/EntityFormDialog';
import { useAppColors, spacing } from '../../theme';
import { smartDate } from '../../utils/format';
import api from '../../services/api';

type Pal = ReturnType<typeof useAppColors>;

const FILTERS = ['all', 'waiting', 'approved', 'entered', 'exited', 'denied'];

const FIELDS: FormField[] = [
  { key: 'name', label: 'Visitor name', required: true, autoCapitalize: 'words' },
  { key: 'phone', label: 'Phone', type: 'phone' },
  { key: 'purpose', label: 'Purpose' },
  {
    key: 'type',
    label: 'Type',
    type: 'select',
    options: [
      { value: 'guest', label: 'Guest' },
      { value: 'delivery', label: 'Delivery' },
      { value: 'staff', label: 'Staff' },
      { value: 'cab', label: 'Cab' },
    ],
  },
  { key: 'flat', label: 'Flat', autoCapitalize: 'characters' },
  { key: 'vehicle_number', label: 'Vehicle number', autoCapitalize: 'characters' },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'waiting', label: 'Waiting' },
      { value: 'approved', label: 'Approved' },
      { value: 'entered', label: 'Inside' },
      { value: 'exited', label: 'Exited' },
      { value: 'denied', label: 'Denied' },
    ],
  },
  {
    key: 'approval_status',
    label: 'Approval',
    type: 'select',
    options: [
      { value: 'pending', label: 'Pending' },
      { value: 'approved', label: 'Approved' },
      { value: 'denied', label: 'Denied' },
    ],
  },
];

const COLUMNS = [
  { key: 'name', label: 'Visitor' },
  { key: 'phone', label: 'Phone' },
  { key: 'type', label: 'Type' },
  { key: 'purpose', label: 'Purpose' },
  { key: 'flat', label: 'Flat' },
  { key: 'resident_name', label: 'Resident' },
  { key: 'status', label: 'Status' },
  { key: 'approval_status', label: 'Approval' },
  { key: 'requested_at', label: 'Requested' },
  { key: 'entry_time', label: 'Entered' },
  { key: 'exit_time', label: 'Exited' },
];

const AdminVisitorsScreen: React.FC<any> = ({ navigation }) => {
  const c = useAppColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const [visitors, setVisitors] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState<any | 'new' | null>(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const r = await api.getVisitors();
      setVisitors(r.data);
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
    return visitors.filter((v) => {
      const mf = filter === 'all' || v.status === filter;
      const mq =
        !q ||
        v.name?.toLowerCase().includes(q) ||
        (v.flat || '').toLowerCase().includes(q) ||
        (v.phone || '').includes(q);
      return mf && mq;
    });
  }, [visitors, filter, query]);

  const save = async (val: Record<string, string>) => {
    if (editing === 'new') {
      await api.adminCreateVisitor(val);
    } else if (editing) {
      await api.adminUpdateVisitor(editing.id, val);
    }
    await load();
  };

  const remove = async () => {
    if (editing && editing !== 'new') {
      await api.adminDeleteVisitor(editing.id);
      await load();
    }
  };

  return (
    <Screen padded={false} refreshing={refreshing} onRefresh={load}>
      <AppHeader
        title="Visitors"
        subtitle={`${visitors.length} total`}
        color={c.admin}
        onBack={() => navigation.navigate('AdminDashboard')}
      />
      <View style={styles.body}>
        <Searchbar
          placeholder="Search name, flat or phone"
          value={query}
          onChangeText={setQuery}
          style={styles.search}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {FILTERS.map((f) => (
            <Chip
              key={f}
              selected={filter === f}
              onPress={() => setFilter(f)}
              showSelectedCheck={false}
              style={styles.chip}
            >
              {f[0].toUpperCase() + f.slice(1)}
            </Chip>
          ))}
        </ScrollView>

        <View style={styles.actions}>
          <ExportButton filename="visitors" rows={() => filtered} columns={COLUMNS} />
          <Button
            mode="contained"
            icon="plus"
            compact
            buttonColor={c.admin}
            onPress={() => setEditing('new')}
            style={styles.add}
          >
            Add
          </Button>
        </View>

        {loading ? (
          <ActivityIndicator color={c.admin} style={{ marginTop: spacing(10) }} />
        ) : filtered.length === 0 ? (
          <EmptyState icon="account-search-outline" title="No visitors match" />
        ) : (
          filtered.map((v) => (
            <Card key={v.id} style={styles.card} onPress={() => setEditing(v)}>
              <Card.Content style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{v.name}</Text>
                  <Text style={styles.meta}>
                    {v.type} · {v.flat || v.resident_name || '—'} · {smartDate(v.requested_at)}
                  </Text>
                </View>
                <StatusPill status={v.status} />
                <MaterialCommunityIcons name="pencil-outline" size={18} color={c.muted} />
              </Card.Content>
            </Card>
          ))
        )}
      </View>

      <EntityFormDialog
        visible={editing != null}
        title={editing === 'new' ? 'Add visitor' : 'Edit visitor'}
        fields={FIELDS}
        initial={
          editing && editing !== 'new'
            ? editing
            : { type: 'guest', status: 'waiting', approval_status: 'pending' }
        }
        accent={c.admin}
        submitLabel={editing === 'new' ? 'Create' : 'Save'}
        onSubmit={save}
        onDismiss={() => setEditing(null)}
        onDelete={editing && editing !== 'new' ? remove : undefined}
        deleteConfirm={{
          title: 'Delete visitor record?',
          message: 'The entry is permanently removed from the log.',
        }}
      />
    </Screen>
  );
};

const makeStyles = (c: Pal) =>
  StyleSheet.create({
    body: { padding: spacing(4) },
    search: { marginBottom: spacing(3), backgroundColor: c.card },
    chips: { paddingBottom: spacing(3) },
    chip: { marginRight: spacing(2) },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing(3),
    },
    add: { borderRadius: 12 },
    card: { backgroundColor: c.card, marginBottom: spacing(3), borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing(3) },
    name: { fontSize: 15, fontWeight: '700', color: c.text },
    meta: { fontSize: 12.5, color: c.muted, marginTop: 2, textTransform: 'capitalize' },
  });

export default AdminVisitorsScreen;
