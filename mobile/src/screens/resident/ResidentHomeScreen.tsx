import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Button, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../../components/Screen';
import AppHeader from '../../components/AppHeader';
import VisitorCard from '../../components/VisitorCard';
import EmptyState from '../../components/EmptyState';
import { colors, spacing, radius } from '../../theme';
import { timeAgo } from '../../utils/format';
import { RootState } from '../../store';
import api from '../../services/api';

const QUICK = [
  { key: 'VisitorRequest', label: 'Expect Guest', icon: 'account-plus' },
  { key: 'PreApprovedVisitors', label: 'Pre-Approved', icon: 'account-check' },
  { key: 'QRPassGenerator', label: 'QR Pass', icon: 'qrcode' },
];

const ResidentHomeScreen: React.FC<any> = ({ navigation }) => {
  const { user } = useSelector((s: RootState) => s.auth);
  const unread = useSelector((s: RootState) => s.notification.unreadCount);
  const [pending, setPending] = useState<any[]>([]);
  const [active, setActive] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const all = await api.getVisitors();
      setPending(
        all.data.filter(
          (v: any) => v.status === 'waiting' && v.approval_status === 'pending'
        )
      );
      setActive(
        all.data.filter((v: any) => ['approved', 'entered'].includes(v.status))
      );
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

  return (
    <Screen
      padded={false}
      refreshing={refreshing}
      onRefresh={load}
    >
      <AppHeader
        title={`Hi, ${user?.first_name ?? 'Resident'}`}
        subtitle={user?.flat ? `Flat ${user.flat}` : 'Welcome back'}
        color={colors.resident}
        right={
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')} hitSlop={12}>
            <MaterialCommunityIcons name="bell-outline" size={26} color="#fff" />
            {unread > 0 && <View style={styles.dot} />}
          </TouchableOpacity>
        }
      />
      <View style={styles.body}>
        <View style={styles.quickRow}>
          {QUICK.map((q) => (
            <TouchableOpacity
              key={q.key}
              style={styles.quick}
              onPress={() => navigation.navigate(q.key)}
            >
              <MaterialCommunityIcons name={q.icon as any} size={28} color={colors.resident} />
              <Text style={styles.quickLabel}>{q.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.section}>Waiting for your approval</Text>
        {loading ? (
          <ActivityIndicator color={colors.resident} style={{ marginVertical: spacing(6) }} />
        ) : pending.length === 0 ? (
          <EmptyState icon="check-all" title="Nothing pending" message="Visitors at the gate will show up here." />
        ) : (
          pending.map((v) => (
            <Card key={v.id} style={styles.approvalCard}>
              <Card.Content>
                <Text style={styles.name}>{v.name}</Text>
                <Text style={styles.meta}>
                  {v.purpose} • {timeAgo(v.requested_at)}
                </Text>
                <View style={styles.approvalActions}>
                  <Button
                    mode="contained"
                    compact
                    buttonColor={colors.success}
                    loading={busyId === v.id}
                    disabled={busyId === v.id}
                    onPress={() => decide(v.id, true)}
                    style={styles.approvalBtn}
                  >
                    Approve
                  </Button>
                  <Button
                    mode="contained"
                    compact
                    buttonColor={colors.danger}
                    loading={busyId === v.id}
                    disabled={busyId === v.id}
                    onPress={() => decide(v.id, false)}
                    style={styles.approvalBtn}
                  >
                    Deny
                  </Button>
                  <Button
                    compact
                    onPress={() =>
                      navigation.navigate('ResidentVisitorDetails', { visitorId: v.id })
                    }
                  >
                    Details
                  </Button>
                </View>
              </Card.Content>
            </Card>
          ))
        )}

        <Text style={styles.section}>Expected & inside</Text>
        {active.length === 0 ? (
          <EmptyState icon="calendar-blank-outline" title="No upcoming visitors" />
        ) : (
          active.map((v) => (
            <VisitorCard
              key={v.id}
              visitor={v}
              onPress={() =>
                navigation.navigate('ResidentVisitorDetails', { visitorId: v.id })
              }
            />
          ))
        )}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  body: { padding: spacing(4) },
  dot: {
    position: 'absolute',
    right: -1,
    top: -1,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.warning,
  },
  quickRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing(5) },
  quick: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingVertical: spacing(4),
    alignItems: 'center',
    marginHorizontal: spacing(1),
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickLabel: { fontSize: 12, fontWeight: '600', color: colors.text, marginTop: spacing(2) },
  section: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing(3),
    marginBottom: spacing(3),
  },
  approvalCard: { backgroundColor: '#FFF7ED', marginBottom: spacing(3) },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  meta: { fontSize: 13, color: colors.muted, marginTop: 2, marginBottom: spacing(3) },
  approvalActions: { flexDirection: 'row', alignItems: 'center', gap: spacing(2) },
  approvalBtn: { borderRadius: radius.sm },
});

export default ResidentHomeScreen;
