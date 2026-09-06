import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, Searchbar, ActivityIndicator, Avatar, Divider, Chip } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../../components/Screen';
import AppHeader from '../../components/AppHeader';
import EmptyState from '../../components/EmptyState';
import { colors, spacing } from '../../theme';
import { initials } from '../../utils/format';
import api from '../../services/api';

interface Resident {
  id: number;
  name: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  flat: string;
}

const AdminResidentsScreen: React.FC<any> = ({ navigation }) => {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  return (
    <Screen padded={false} refreshing={refreshing} onRefresh={load}>
      <AppHeader
        title="Residents"
        subtitle={`${residents.length} registered`}
        color={colors.admin}
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
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: spacing(10) }} color={colors.admin} />
        ) : filtered.length === 0 ? (
          <EmptyState icon="account-search-outline" title="No residents match" />
        ) : (
          <Card style={styles.card}>
            {filtered.map((r, i) => (
              <React.Fragment key={r.id}>
                <View style={styles.row}>
                  <Avatar.Text
                    size={40}
                    label={initials(r.first_name, r.last_name)}
                    style={{ backgroundColor: colors.admin }}
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
                </View>
                {i < filtered.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </Card>
        )}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  body: { padding: spacing(4) },
  search: { marginBottom: spacing(3), backgroundColor: colors.card },
  chips: { flexDirection: 'row', gap: spacing(2), marginBottom: spacing(3) },
  chip: { backgroundColor: colors.card },
  card: { backgroundColor: colors.card },
  row: { flexDirection: 'row', alignItems: 'center', padding: spacing(3) },
  info: { flex: 1, marginLeft: spacing(3) },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  meta: { fontSize: 12, color: colors.muted, marginTop: 2 },
  flatWrap: { alignItems: 'flex-end', minWidth: 64 },
  flatLabel: { fontSize: 10, color: colors.muted, textTransform: 'uppercase' },
  flat: { fontSize: 15, fontWeight: '800', color: colors.admin, marginTop: 2 },
  flatMissing: { color: colors.border },
});

export default AdminResidentsScreen;
