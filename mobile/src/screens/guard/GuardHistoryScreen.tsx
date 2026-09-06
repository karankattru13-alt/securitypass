import React, { useCallback, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Chip, Searchbar, ActivityIndicator } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../../components/Screen';
import AppHeader from '../../components/AppHeader';
import VisitorCard from '../../components/VisitorCard';
import EmptyState from '../../components/EmptyState';
import { colors, spacing } from '../../theme';
import api from '../../services/api';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'waiting', label: 'Waiting' },
  { key: 'entered', label: 'Inside' },
  { key: 'exited', label: 'Exited' },
  { key: 'denied', label: 'Denied' },
];

const GuardHistoryScreen: React.FC<any> = ({ navigation }) => {
  const [visitors, setVisitors] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
      const matchFilter = filter === 'all' || v.status === filter;
      const matchQuery =
        !q ||
        v.name.toLowerCase().includes(q) ||
        (v.flat || '').toLowerCase().includes(q) ||
        (v.phone || '').includes(q);
      return matchFilter && matchQuery;
    });
  }, [visitors, filter, query]);

  return (
    <Screen padded={false} refreshing={refreshing} onRefresh={load}>
      <AppHeader title="Visitor History" color={colors.guard} icon="history" />
      <View style={styles.body}>
        <Searchbar
          placeholder="Search name, flat or phone"
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
          <ActivityIndicator style={{ marginTop: spacing(10) }} color={colors.primary} />
        ) : filtered.length === 0 ? (
          <EmptyState icon="account-search-outline" title="No visitors match" />
        ) : (
          filtered.map((v) => (
            <VisitorCard
              key={v.id}
              visitor={v}
              onPress={() => navigation.navigate('VisitorDetails', { visitorId: v.id })}
            />
          ))
        )}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  body: { padding: spacing(4) },
  search: { marginBottom: spacing(3), backgroundColor: colors.card },
  chips: { paddingBottom: spacing(3) },
  chip: { marginRight: spacing(2) },
});

export default GuardHistoryScreen;
