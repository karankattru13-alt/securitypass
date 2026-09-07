import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Button, ActivityIndicator, Tooltip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../../components/Screen';
import AppHeader from '../../components/AppHeader';
import VisitorCard from '../../components/VisitorCard';
import EmptyState from '../../components/EmptyState';
import AccentCard from '../../components/AccentCard';
import DecisionButtons from '../../components/DecisionButtons';
import SectionTitle from '../../components/SectionTitle';
import ActionTile from '../../components/ActionTile';
import { useAppColors, spacing, radius } from '../../theme';
import { timeAgo, smartDate } from '../../utils/format';
import { RootState } from '../../store';
import api from '../../services/api';

type Pal = ReturnType<typeof useAppColors>;

const QUICK = [
  { key: 'VisitorRequest', label: 'Expect Guest', icon: 'account-plus' },
  { key: 'PreApprovedVisitors', label: 'Pre-Approved', icon: 'account-check' },
  { key: 'QRPassGenerator', label: 'QR Pass', icon: 'qrcode' },
];

const ResidentHomeScreen: React.FC<any> = ({ navigation }) => {
  const c = useAppColors();
  const styles = React.useMemo(() => makeStyles(c), [c]);
  const { user } = useSelector((s: RootState) => s.auth);
  const unread = useSelector((s: RootState) => s.notification.unreadCount);
  const [pending, setPending] = useState<any[]>([]);
  const [active, setActive] = useState<any[]>([]);
  const [preApproved, setPreApproved] = useState<any[]>([]);
  const [onDutyGuards, setOnDutyGuards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [all, guards, pre] = await Promise.all([
        api.getVisitors(),
        api.getOnDutyGuards(),
        api.getPreApprovedVisitors(),
      ]);
      setPending(
        all.data.filter(
          (v: any) => v.status === 'waiting' && v.approval_status === 'pending'
        )
      );
      setActive(all.data.filter((v: any) => ['approved', 'entered'].includes(v.status)));
      setOnDutyGuards(guards.data);
      setPreApproved(pre.data.filter((p: any) => p.status !== 'cancelled'));
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
    <Screen padded={false} refreshing={refreshing} onRefresh={load}>
      <AppHeader
        title={user ? `${user.first_name} ${user.last_name}` : 'Resident'}
        subtitle={user?.flat ? `Flat ${user.flat}` : 'Welcome back'}
        color={c.resident}
        right={
          <View style={styles.headerRight}>
            <Tooltip title={unread > 0 ? `Notifications (${unread} unread)` : 'Notifications'}>
              <TouchableOpacity
                onPress={() => navigation.navigate('Notifications')}
                hitSlop={12}
              >
                <MaterialCommunityIcons name="bell-outline" size={24} color="#fff" />
                {unread > 0 && <View style={styles.dot} />}
              </TouchableOpacity>
            </Tooltip>
            <Tooltip title="Profile">
              <TouchableOpacity
                onPress={() => navigation.navigate('Profile')}
                hitSlop={12}
              >
                <MaterialCommunityIcons name="account-circle" size={26} color="#fff" />
              </TouchableOpacity>
            </Tooltip>
          </View>
        }
      />
      <View style={styles.body}>
        {!user?.flat && (
          <TouchableOpacity
            style={styles.flatPrompt}
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.85}
          >
            <View style={[styles.promptIcon, { backgroundColor: `${c.warning}22` }]}>
              <MaterialCommunityIcons name="home-alert" size={20} color={c.warning} />
            </View>
            <Text style={styles.flatPromptText}>
              Add your house / flat number so guards can send visitor requests to you.
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={c.muted} />
          </TouchableOpacity>
        )}

        <View style={styles.dutyCard}>
          <View
            style={[
              styles.promptIcon,
              { backgroundColor: onDutyGuards.length ? `${c.resident}22` : `${c.muted}22` },
            ]}
          >
            <MaterialCommunityIcons
              name={onDutyGuards.length ? 'shield-check' : 'shield-off-outline'}
              size={18}
              color={onDutyGuards.length ? c.resident : c.muted}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.dutyLabel}>ON DUTY NOW</Text>
            <Text style={styles.dutyText}>
              {onDutyGuards.length
                ? onDutyGuards.map((g) => `${g.name} (${g.gate} · ${g.shift})`).join(',  ')
                : 'No guard is on duty right now'}
            </Text>
          </View>
        </View>

        <View style={styles.quickRow}>
          {QUICK.map((q) => (
            <ActionTile
              key={q.key}
              icon={q.icon as any}
              label={q.label}
              color={c.resident}
              width="31%"
              onPress={() => navigation.navigate(q.key)}
            />
          ))}
        </View>

        <SectionTitle title="Waiting for your approval" count={pending.length} color={c.warning} />
        {loading ? (
          <ActivityIndicator color={c.resident} style={{ marginVertical: spacing(6) }} />
        ) : pending.length === 0 ? (
          <EmptyState
            icon="check-all"
            title="Nothing pending"
            message="Visitors at the gate will show up here."
          />
        ) : (
          pending.map((v) => (
            <AccentCard key={v.id} accent={c.warning}>
              <Text style={styles.name}>{v.name}</Text>
              <Text style={styles.meta}>
                {v.purpose} • {timeAgo(v.requested_at)}
              </Text>
              {v.created_by_name ? (
                <View style={styles.byRow}>
                  <MaterialCommunityIcons name="shield-account" size={13} color={c.guard} />
                  <Text style={styles.byText}>Opened by {v.created_by_name}</Text>
                </View>
              ) : null}
              <DecisionButtons
                acceptLabel="Approve"
                openLabel="Details"
                loading={busyId === v.id}
                disabled={busyId === v.id}
                onAccept={() => decide(v.id, true)}
                onDeny={() => decide(v.id, false)}
                onOpen={() =>
                  navigation.navigate('ResidentVisitorDetails', { visitorId: v.id })
                }
              />
            </AccentCard>
          ))
        )}

        <SectionTitle title="Expected & inside" count={active.length} color={c.resident} />
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

        <SectionTitle
          title="Pre-approved visitors"
          count={preApproved.length}
          color={c.resident}
          actionLabel="Manage"
          onAction={() => navigation.navigate('PreApprovedVisitors')}
        />
        {preApproved.length === 0 ? (
          <EmptyState
            icon="account-check-outline"
            title="No pre-approved visitors"
            message="Add recurring guests or house help so the guard can let them in."
          />
        ) : (
          preApproved.slice(0, 4).map((p) => {
            const expired = p.status === 'expired';
            return (
              <Card
                key={p.id}
                style={styles.preCard}
                onPress={() => navigation.navigate('PreApprovedVisitors')}
              >
                <Card.Content style={styles.preRow}>
                  <View style={[styles.promptIcon, { backgroundColor: `${expired ? c.muted : c.resident}22` }]}>
                    <MaterialCommunityIcons
                      name="account-check"
                      size={18}
                      color={expired ? c.muted : c.resident}
                    />
                  </View>
                  <View style={styles.preInfo}>
                    <Text style={styles.name}>{p.name}</Text>
                    <Text style={styles.preMeta}>
                      {p.purpose} · valid {p.days} day{p.days === 1 ? '' : 's'} ·{' '}
                      {expired ? 'expired' : `until ${smartDate(p.valid_to)}`}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.prePill,
                      { backgroundColor: expired ? `${c.danger}22` : `${c.success}22` },
                    ]}
                  >
                    <Text
                      style={[styles.prePillText, { color: expired ? c.danger : c.success }]}
                    >
                      {expired ? 'Expired' : 'Active'}
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
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing(3) },
    dot: {
      position: 'absolute',
      right: -1,
      top: -1,
      width: 9,
      height: 9,
      borderRadius: 5,
      backgroundColor: c.warning,
    },
    promptIcon: {
      width: 34,
      height: 34,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    flatPrompt: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(3),
      backgroundColor: c.cardAlt,
      borderRadius: radius.lg,
      padding: spacing(3),
      marginBottom: spacing(4),
    },
    flatPromptText: { flex: 1, fontSize: 13, color: c.text, fontWeight: '600' },
    dutyCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(3),
      backgroundColor: c.card,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      padding: spacing(3),
      marginBottom: spacing(5),
    },
    dutyLabel: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.8,
      color: c.muted,
      marginBottom: 2,
    },
    dutyText: { fontSize: 12.5, color: c.text, fontWeight: '600' },
    quickRow: { flexDirection: 'row', justifyContent: 'space-between' },
    name: { fontSize: 15, fontWeight: '800', color: c.text },
    meta: { fontSize: 13, color: c.muted, marginTop: 3 },
    byRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing(2) },
    byText: { fontSize: 12, color: c.guard, fontWeight: '700' },
    preCard: {
      backgroundColor: c.card,
      marginBottom: spacing(3),
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    preRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(3) },
    preInfo: { flex: 1 },
    preMeta: { fontSize: 12, color: c.muted, marginTop: 2 },
    prePill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill },
    prePillText: { fontSize: 11, fontWeight: '800' },
  });

export default ResidentHomeScreen;
