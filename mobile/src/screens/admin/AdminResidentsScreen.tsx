import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, Searchbar, ActivityIndicator, Avatar, Divider } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../../components/Screen';
import AppHeader from '../../components/AppHeader';
import EmptyState from '../../components/EmptyState';
import { colors, spacing } from '../../theme';
import api from '../../services/api';

const AdminResidentsScreen: React.FC<any> = ({ navigation }) => {
  const [flats, setFlats] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const r = await api.getSocietyFlats(1);
      setFlats(r.data);
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
    if (!q) return flats;
    return flats.filter(
      (f) =>
        f.number.toLowerCase().includes(q) ||
        f.resident_name.toLowerCase().includes(q) ||
        (f.resident_phone || '').includes(q)
    );
  }, [flats, query]);

  return (
    <Screen padded={false} refreshing={refreshing} onRefresh={load}>
      <AppHeader
        title="Residents"
        subtitle={`${flats.length} flats`}
        color={colors.admin}
        onBack={() => navigation.goBack()}
      />
      <View style={styles.body}>
        <Searchbar
          placeholder="Search flat, name or phone"
          value={query}
          onChangeText={setQuery}
          style={styles.search}
        />
        {loading ? (
          <ActivityIndicator style={{ marginTop: spacing(10) }} color={colors.admin} />
        ) : filtered.length === 0 ? (
          <EmptyState icon="account-search-outline" title="No residents match" />
        ) : (
          <Card style={styles.card}>
            {filtered.map((f, i) => (
              <React.Fragment key={f.id}>
                <View style={styles.row}>
                  <Avatar.Text
                    size={40}
                    label={f.number.replace('-', '')}
                    style={{ backgroundColor: colors.admin }}
                    labelStyle={{ fontSize: 12 }}
                  />
                  <View style={styles.info}>
                    <Text style={styles.name}>{f.resident_name}</Text>
                    <Text style={styles.meta}>
                      {f.number} · {f.resident_phone} · {f.members} members
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
  card: { backgroundColor: colors.card },
  row: { flexDirection: 'row', alignItems: 'center', padding: spacing(3) },
  info: { flex: 1, marginLeft: spacing(3) },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  meta: { fontSize: 12, color: colors.muted, marginTop: 2 },
});

export default AdminResidentsScreen;
