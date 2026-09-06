import React, { useCallback, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Chip, Searchbar, ActivityIndicator } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../../components/Screen';
import AppHeader from '../../components/AppHeader';
import VisitorCard from '../../components/VisitorCard';
import EmptyState from '../../components/EmptyState';
import ExportButton from '../../components/ExportButton';
import { useAppColors, spacing } from '../../theme';
import api from '../../services/api';

type Pal = ReturnType<typeof useAppColors>;

const VISITOR_COLUMNS = [
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
  { key: 'created_by_name', label: 'Opened by' },
  { key: 'approved_by_name', label: 'Decided by' },
];

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'waiting', label: 'Waiting' },
  { key: 'entered', label: 'Inside' },
  { key: 'exited', label: 'Exited' },
  { key: 'denied', label: 'Denied' },
];

const GuardHistoryScreen: React.FC<any> = ({ navigation }) => {
  const c = useAppColors();
  const styles = React.useMemo(() => makeStyles(c), [c]);
  const [visitors, setVisitors] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

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
      <AppHeader
        title="Visitor History"
        color={c.guard}
        icon="history"
        onBack={() => navigation.navigate('GuardHome')}
      />
      <View style={styles.body}>
        <Searchbar
          placeholder="Search name, flat or phone"
          value={query}
          onChangeText={setQuery}
          style={styles.search}
        />
        <View style={styles.exportRow}>
          <ExportButton
            filename="visitor-history"
            rows={() => filtered}
            columns={VISITOR_COLUMNS}
          />
        </View>
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
          <ActivityIndicator style={{ marginTop: spacing(10) }} color={c.primary} />
        ) : filtered.length === 0 ? (
          <EmptyState icon="account-search-outline" title="No visitors match" />
        ) : (
          filtered.map((v) => (
            <VisitorCard
              key={v.id}
              visitor={v}
              onPress={() => navigation.navigate('VisitorDetails', { visitorId: v.id })}
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
  search: { marginBottom: spacing(2), backgroundColor: c.card },
  exportRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing(2) },
  chips: { paddingBottom: spacing(3) },
  chip: { marginRight: spacing(2) },
});

export default GuardHistoryScreen;
