import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, ActivityIndicator, Divider, SegmentedButtons } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../../components/Screen';
import AppHeader from '../../components/AppHeader';
import EmptyState from '../../components/EmptyState';
import StatusPill from '../../components/StatusPill';
import { useAppColors, spacing, radius, prettyStatus } from '../../theme';
import { smartDate } from '../../utils/format';
import api from '../../services/api';

type Pal = ReturnType<typeof useAppColors>;

const roleLabel: Record<string, string> = {
  created: 'You opened',
  approved: 'You approved',
  denied: 'You denied',
};

const GuardRecordsScreen: React.FC<any> = ({ navigation }) => {
  const c = useAppColors();
  const styles = React.useMemo(() => makeStyles(c), [c]);
  const [tab, setTab] = useState<'mine' | 'preapproved'>('mine');
  const [records, setRecords] = useState<any[]>([]);
  const [preApproved, setPreApproved] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [r, p] = await Promise.all([
        api.getMyGuardRecords(),
        api.getPreApprovedVisitors(),
      ]);
      setRecords(r.data);
      setPreApproved(p.data);
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

  return (
    <Screen padded={false} refreshing={refreshing} onRefresh={load}>
      <AppHeader title="My Records" color={c.guard} icon="clipboard-text-outline" />
      <View style={styles.body}>
        <SegmentedButtons
          value={tab}
          onValueChange={(v) => setTab(v as any)}
          buttons={[
            { value: 'mine', label: `My Requests (${records.length})` },
            { value: 'preapproved', label: `Pre-Approved (${preApproved.length})` },
          ]}
          style={styles.segment}
        />

        {loading ? (
          <ActivityIndicator color={c.guard} style={{ marginTop: spacing(8) }} />
        ) : tab === 'mine' ? (
          records.length === 0 ? (
            <EmptyState
              icon="clipboard-text-off-outline"
              title="No records yet"
              message="Requests you open or approve will be logged here."
            />
          ) : (
            records.map((v) => (
              <Card
                key={v.id}
                style={styles.card}
                onPress={() =>
                  navigation.navigate('VisitorDetails', { visitorId: v.id })
                }
              >
                <Card.Content style={styles.row}>
                  <View style={styles.info}>
                    <Text style={styles.name}>{v.name}</Text>
                    <Text style={styles.meta}>
                      {v.flat || v.resident_name} • {v.purpose}
                    </Text>
                    <View style={styles.tagRow}>
                      <View style={[styles.tag, { backgroundColor: c.cardAlt }]}>
                        <MaterialCommunityIcons
                          name={v.my_role === 'created' ? 'plus-circle-outline' : 'gavel'}
                          size={12}
                          color={c.primary}
                        />
                        <Text style={[styles.tagText, { color: c.primary }]}>
                          {roleLabel[v.my_role] || 'You handled'}
                        </Text>
                      </View>
                      <Text style={styles.time}>{smartDate(v.requested_at)}</Text>
                    </View>
                  </View>
                  <StatusPill status={v.status} />
                </Card.Content>
              </Card>
            ))
          )
        ) : preApproved.length === 0 ? (
          <EmptyState icon="account-clock-outline" title="No pre-approved visitors" />
        ) : (
          preApproved.map((p) => {
            const expired = p.status === 'expired';
            return (
              <Card key={p.id} style={styles.card}>
                <Card.Content>
                  <View style={styles.row}>
                    <View style={styles.info}>
                      <Text style={styles.name}>{p.name}</Text>
                      <Text style={styles.meta}>
                        {p.flat} · {p.resident_name}
                      </Text>
                      <Text style={styles.meta}>{p.purpose}</Text>
                    </View>
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: expired ? `${c.danger}22` : `${c.success}22` },
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          { color: expired ? c.danger : c.success },
                        ]}
                      >
                        {prettyStatus(p.status)}
                      </Text>
                    </View>
                  </View>
                  <Divider style={styles.divider} />
                  <View style={styles.validRow}>
                    <MaterialCommunityIcons name="calendar-range" size={16} color={c.muted} />
                    <Text style={styles.validText}>
                      Valid {p.days} day{p.days === 1 ? '' : 's'} ·{' '}
                      {expired ? 'expired ' : 'until '}
                      {smartDate(p.valid_to)}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            );
          })
        )}
      </View>
    </Screen>
  );
};

const makeStyles = (c: Pal) =>
  StyleSheet.create({
    body: { padding: spacing(4) },
    segment: { marginBottom: spacing(4) },
    card: { backgroundColor: c.card, marginBottom: spacing(3) },
    row: { flexDirection: 'row', alignItems: 'flex-start' },
    info: { flex: 1 },
    name: { fontSize: 15, fontWeight: '700', color: c.text },
    meta: { fontSize: 13, color: c.muted, marginTop: 2 },
    tagRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing(2), gap: spacing(2) },
    tag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.pill,
    },
    tagText: { fontSize: 11, fontWeight: '700' },
    time: { fontSize: 11, color: c.muted },
    badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill },
    badgeText: { fontSize: 11, fontWeight: '800' },
    divider: { marginVertical: spacing(3) },
    validRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(2) },
    validText: { fontSize: 12, color: c.muted, fontWeight: '600' },
  });

export default GuardRecordsScreen;
