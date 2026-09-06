import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, ActivityIndicator, Button, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../../components/Screen';
import AppHeader from '../../components/AppHeader';
import EmptyState from '../../components/EmptyState';
import ExportButton from '../../components/ExportButton';
import EntityFormDialog, { FormField } from '../../components/EntityFormDialog';
import { useAppColors, spacing } from '../../theme';
import { AppDispatch, RootState } from '../../store';
import { setSociety as setMySociety } from '../../store/slices/authSlice';
import api from '../../services/api';

type Pal = ReturnType<typeof useAppColors>;

const FIELDS: FormField[] = [
  { key: 'name', label: 'Society / building name', required: true, autoCapitalize: 'words' },
  {
    key: 'type',
    label: 'Type',
    type: 'select',
    options: [
      { value: 'society', label: 'Society' },
      { value: 'building', label: 'Building' },
    ],
  },
  { key: 'city', label: 'City', autoCapitalize: 'words' },
  { key: 'address', label: 'Address', autoCapitalize: 'sentences' },
  { key: 'pincode', label: 'Pincode', type: 'number' },
];

const AdminSocietyScreen: React.FC<any> = ({ navigation }) => {
  const c = useAppColors();
  const styles = React.useMemo(() => makeStyles(c), [c]);
  const dispatch = useDispatch<AppDispatch>();
  const mySocietyId = useSelector((s: RootState) => s.auth.user?.society_id);
  const [societies, setSocieties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState<any | 'new' | null>(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const r = await api.getSocieties();
      setSocieties(r.data);
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

  const save = async (v: Record<string, string>) => {
    if (editing === 'new') {
      const r = await api.adminCreateSociety(v);
      // Stick the first one they create so the rest of the app scopes to it.
      if (!mySocietyId && r.data?.id) dispatch(setMySociety(r.data.id));
    } else if (editing) {
      await api.adminUpdateSociety(editing.id, v);
    }
    await load();
  };

  const remove = async () => {
    if (editing && editing !== 'new') {
      await api.adminDeleteSociety(editing.id);
      await load();
    }
  };

  return (
    <Screen padded={false} refreshing={refreshing} onRefresh={load}>
      <AppHeader
        title="Societies & Buildings"
        subtitle={`${societies.length} place${societies.length === 1 ? '' : 's'}`}
        color={c.admin}
        icon="home-city"
        onBack={() => navigation.navigate('AdminDashboard')}
      />
      <View style={styles.body}>
        <View style={styles.toolRow}>
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
          {societies.length > 0 && (
            <ExportButton
              filename="societies"
              rows={() => societies}
              columns={[
                { key: 'name', label: 'Name' },
                { key: 'type', label: 'Type' },
                { key: 'city', label: 'City' },
                { key: 'address', label: 'Address' },
                { key: 'pincode', label: 'Pincode' },
                { key: 'total_residents', label: 'Residents' },
                { key: 'total_guards', label: 'Guards' },
              ]}
            />
          )}
        </View>

        {loading ? (
          <ActivityIndicator color={c.admin} style={{ marginTop: spacing(10) }} />
        ) : societies.length === 0 ? (
          <EmptyState
            icon="office-building-outline"
            title="No societies yet"
            message="Add the society or building you manage so members can pick it."
          />
        ) : (
          societies.map((s) => (
            <Card key={s.id} style={styles.card} onPress={() => setEditing(s)}>
              <Card.Content>
                <View style={styles.head}>
                  <MaterialCommunityIcons
                    name={s.type === 'building' ? 'domain' : 'city'}
                    size={22}
                    color={c.admin}
                  />
                  <Text style={styles.name}>{s.name}</Text>
                  <MaterialCommunityIcons name="pencil-outline" size={18} color={c.muted} />
                </View>
                <Text style={styles.meta}>
                  {[s.address, s.city, s.pincode].filter(Boolean).join(', ') || 'No address set'}
                </Text>
                <Divider style={styles.divider} />
                <Text style={styles.counts}>
                  {s.total_residents} residents · {s.total_flats} flats · {s.total_guards} guards
                </Text>
              </Card.Content>
            </Card>
          ))
        )}
      </View>

      <EntityFormDialog
        visible={editing != null}
        title={editing === 'new' ? 'Add society / building' : 'Edit society / building'}
        fields={FIELDS}
        initial={
          editing && editing !== 'new' ? editing : { type: 'society' }
        }
        accent={c.admin}
        submitLabel={editing === 'new' ? 'Create' : 'Save'}
        onSubmit={save}
        onDismiss={() => setEditing(null)}
        onDelete={editing && editing !== 'new' ? remove : undefined}
        deleteConfirm={{
          title: 'Delete this society?',
          message:
            'You can only delete a society with no residents or guards assigned to it.',
        }}
      />
    </Screen>
  );
};

const makeStyles = (c: Pal) =>
  StyleSheet.create({
    body: { padding: spacing(4) },
    toolRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing(4),
    },
    add: { borderRadius: 12 },
    card: { backgroundColor: c.card, marginBottom: spacing(3), borderRadius: 14 },
    head: { flexDirection: 'row', alignItems: 'center', gap: spacing(2) },
    name: { flex: 1, fontSize: 16, fontWeight: '800', color: c.text },
    meta: { fontSize: 12.5, color: c.muted, marginTop: spacing(2) },
    divider: { marginVertical: spacing(3) },
    counts: { fontSize: 12, color: c.muted, fontWeight: '600' },
  });

export default AdminSocietyScreen;
