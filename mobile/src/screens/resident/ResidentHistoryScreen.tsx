import React, { useCallback, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Chip, Searchbar, ActivityIndicator } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../../components/Screen';
import AppHeader from '../../components/AppHeader';
import VisitorCard from '../../components/VisitorCard';
import EmptyState from '../../components/EmptyState';
import { useAppColors, spacing } from '../../theme';
import api from '../../services/api';

type Pal = ReturnType<typeof useAppColors>;

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'waiting', label: 'Waiting' },
  { key: 'approved', label: 'Expected' },
  { key: 'entered', label: 'Inside' },
  { key: 'exited', label: 'Left' },
  { key: 'denied', label: 'Denied' },
];

const ResidentHistoryScreen: React.FC<any> = ({ navigation }) => {
  const c = useAppColors();
  const styles = React.useMemo(() => makeStyles(c), [c]);
  const [visitors, setVisitors] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

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

  const decide = async (id: number, approve: boolean) => {
    setBusyId(id);
    try {
      if (approve) await api.approveVisitor(id);
      else await api.denyVisitor(id);
      await load();
    } finally {
      setBusyId(null);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return visitors.filter((v) => {
      const matchFilter = filter === 'all' || v.status === filter;
      const matchQuery =
        !q ||
        v.name.toLowerCase().includes(q) ||
        (v.purpose || '').toLowerCase().includes(q);
      return matchFilter && matchQuery;
    });
  }, [visitors, filter, query]);

  return (
    <Screen padded={false} refreshing={refreshing} onRefresh={load}>
      <AppHeader
        title="My Visitors"
        color={c.resident}
        icon="history"
        onBack={() => navigation.navigate('ResidentHome')}
      />
      <View style={styles.body}>
        <Searchbar
          placeholder="Search name or purpose"
          value={query}
          onChangeText={setQuery}
          style={styles.search}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {FILTERS.map((f) => (
            <Chip
              key={f.key}
              selected={filter === f.key}
              onPress={() => setFilter(f.key)}
              style={styles.chip}
              showSelectedCheck={false}
            >
              {f.label}
            </Chip>
          ))}
        </ScrollView>

        {loading ? (
          <ActivityIndicator style={{ marginTop: spacing(10) }} color={c.resident} />
        ) : filtered.length === 0 ? (
          <EmptyState icon="account-search-outline" title="No visitors match" />
        ) : (
          filtered.map((v) => (
            <VisitorCard
              key={v.id}
              visitor={v}
              onPress={() =>
                navigation.navigate('ResidentVisitorDetails', { visitorId: v.id })
              }
              onDecide={(approve) => decide(v.id, approve)}
              deciding={busyId === v.id}
            />
          ))
        )}
      </View>
    </Screen>
  );
};

const makeStyles = (c: Pal) =>
  StyleSheet.create({
  body: { padding: spacing(4) },
  search: { marginBottom: spacing(3), backgroundColor: c.card },
  chips: { paddingBottom: spacing(3) },
  chip: { marginRight: spacing(2) },
});

export default ResidentHistoryScreen;
