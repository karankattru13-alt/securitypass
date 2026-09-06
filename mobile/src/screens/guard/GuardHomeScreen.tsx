import React, { useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity, Text, StyleSheet, Alert, Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Button, ActivityIndicator, Tooltip } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';
import { RootState, AppDispatch } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { confirmSignOut } from '../../components/AppHeader';
import { useAppColors, spacing, radius } from '../../theme';
import { clockTime, smartDate } from '../../utils/format';

type Pal = ReturnType<typeof useAppColors>;

const GuardHomeScreen: React.FC<any> = ({ navigation }) => {
  const c = useAppColors();
  const styles = React.useMemo(() => makeStyles(c), [c]);
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<any[]>([]);
  const [inside, setInside] = useState<any[]>([]);
  const [preApproved, setPreApproved] = useState<any[]>([]);
  const [stats, setStats] = useState({ todayVisitors: 0, currentlyInside: 0, pendingApprovals: 0 });
  const [busyId, setBusyId] = useState<number | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [p, ins, st, pre] = await Promise.all([
        api.getVisitors({ approval_status: 'pending', status: 'waiting' }),
        api.getVisitors({ status: 'entered' }),
        api.getGuardStats(),
        api.getPreApprovedVisitors(),
      ]);
      setPending(p.data);
      setInside(ins.data);
      setStats(st.data);
      setPreApproved(
        pre.data
          .filter((x: any) => x.status === 'active' && !x.admitted)
          .slice(0, 5)
      );
    } catch (error) {
      console.error('Error loading guard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const act = async (fn: () => Promise<any>, id: number) => {
    setBusyId(id);
    try {
      await fn();
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setBusyId(null);
    }
  };

  const handleEmergency = () => {
    const msg = 'This would alert the security supervisor and control room.';
    if (Platform.OS === 'web') window.alert(`Emergency alert\n\n${msg}`);
    else Alert.alert('Emergency alert', msg);
  };

  const actions = [
    { label: 'New Visitor', icon: 'plus-circle', bg: c.guard, onPress: () => navigation.navigate('NewVisitor') },
    { label: 'Delivery', icon: 'package-variant-closed', bg: c.resident, onPress: () => navigation.navigate('NewVisitor', { type: 'delivery' }) },
    { label: 'Staff', icon: 'toolbox-outline', bg: c.info, onPress: () => navigation.navigate('NewVisitor', { type: 'staff' }) },
    { label: 'Emergency', icon: 'alert-octagon', bg: c.danger, onPress: handleEmergency },
  ] as const;

  if (loading && pending.length === 0 && inside.length === 0) {
    return (
      <View style={[styles.fill, styles.center]}>
        <ActivityIndicator size="large" color={c.guard} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.fill} contentContainerStyle={styles.scroll}>
      <View style={styles.wrap}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hTitle}>
              {user ? `${user.first_name} ${user.last_name}` : 'Guard'}
            </Text>
            <Text style={styles.hSub}>
              {user?.gate || 'Main Gate'} •{' '}
              {user?.on_duty
                ? user?.duty_shift === 'night'
                  ? 'Night Shift'
                  : 'Day Shift'
                : 'Off duty'}
            </Text>
          </View>
          <Tooltip title="Profile">
            <TouchableOpacity
              onPress={() => navigation.navigate('Profile')}
              hitSlop={12}
              accessibilityLabel="Profile"
            >
              <Icon name="account-circle" size={26} color="#fff" />
            </TouchableOpacity>
          </Tooltip>
          <Tooltip title="Sign out">
            <TouchableOpacity
              onPress={() => confirmSignOut(() => dispatch(logout()))}
              style={styles.signOut}
              hitSlop={12}
              accessibilityLabel="Sign out"
            >
              <Icon name="logout" size={22} color="#fff" />
            </TouchableOpacity>
          </Tooltip>
        </View>

        <View style={styles.pad}>
          <View style={styles.statsRow}>
            {[
              { label: "Today", value: stats.todayVisitors },
              { label: 'Inside', value: stats.currentlyInside },
              { label: 'Pending', value: stats.pendingApprovals },
            ].map((s) => (
              <Card key={s.label} style={styles.statCard}>
                <Card.Content style={styles.statInner}>
                  <Text style={styles.statValue}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </Card.Content>
              </Card>
            ))}
          </View>

          <View style={styles.grid}>
            {actions.map((a) => (
              <TouchableOpacity
                key={a.label}
                style={[styles.tile, { backgroundColor: a.bg }]}
                onPress={a.onPress}
                activeOpacity={0.85}
              >
                <Icon name={a.icon as any} size={30} color="#fff" />
                <Text style={styles.tileText}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Awaiting approval — inline accept / deny */}
          <Text style={styles.section}>Awaiting Approval ({pending.length})</Text>
          {pending.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content>
                <Text style={styles.emptyText}>No visitors waiting at the gate.</Text>
              </Card.Content>
            </Card>
          ) : (
            pending.map((v) => (
              <Card key={v.id} style={[styles.itemCard, { borderLeftColor: c.warning }]}>
                <Card.Content>
                  <View style={styles.itemTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemName}>{v.name}</Text>
                      <Text style={styles.itemMeta}>
                        {v.type} · for {v.resident_name || v.flat} · {clockTime(v.requested_at)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.actionRow}>
                    <Button
                      mode="contained"
                      compact
                      icon="check"
                      buttonColor={c.success}
                      loading={busyId === v.id}
                      disabled={busyId === v.id}
                      onPress={() => act(() => api.approveVisitor(v.id), v.id)}
                      style={styles.actBtn}
                    >
                      Accept
                    </Button>
                    <Button
                      mode="contained"
                      compact
                      icon="close"
                      buttonColor={c.danger}
                      loading={busyId === v.id}
                      disabled={busyId === v.id}
                      onPress={() => act(() => api.denyVisitor(v.id), v.id)}
                      style={styles.actBtn}
                    >
                      Deny
                    </Button>
                    <Button
                      compact
                      textColor={c.primary}
                      onPress={() => navigation.navigate('VisitorApproval', { visitorId: v.id })}
                    >
                      Open
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            ))
          )}

          {/* Pre-approved visitors (society-wide) */}
          <Text style={styles.section}>Pre-Approved Visitors ({preApproved.length})</Text>
          {preApproved.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content>
                <Text style={styles.emptyText}>No active pre-approved visitors.</Text>
              </Card.Content>
            </Card>
          ) : (
            preApproved.map((p) => (
              <Card key={p.id} style={[styles.itemCard, { borderLeftColor: c.resident }]}>
                <Card.Content>
                  <View style={styles.itemTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemName}>{p.name}</Text>
                      <Text style={styles.itemMeta}>
                        {p.flat} · {p.resident_name} · {p.purpose}
                      </Text>
                      <Text style={styles.itemSub}>
                        Valid {p.days} day{p.days === 1 ? '' : 's'} · until {smartDate(p.valid_to)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.actionRow}>
                    <Button
                      mode="contained"
                      compact
                      icon="login-variant"
                      buttonColor={c.success}
                      loading={busyId === p.id}
                      disabled={busyId === p.id}
                      onPress={() => act(() => api.admitPreApproved(p.id), p.id)}
                      style={styles.actBtn}
                    >
                      Admit
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            ))
          )}

          {/* Currently inside */}
          <Text style={styles.section}>Currently Inside ({inside.length})</Text>
          {inside.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content>
                <Text style={styles.emptyText}>Nobody is inside right now.</Text>
              </Card.Content>
            </Card>
          ) : (
            inside.map((v) => (
              <Card
                key={v.id}
                style={[styles.itemCard, { borderLeftColor: c.info }]}
                onPress={() => navigation.navigate('VisitorDetails', { visitorId: v.id })}
              >
                <Card.Content style={styles.insideRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{v.name}</Text>
                    <Text style={styles.itemMeta}>
                      {v.flat} · in since {clockTime(v.entry_time)}
                    </Text>
                  </View>
                  <Button
                    mode="outlined"
                    compact
                    icon="logout-variant"
                    textColor={c.info}
                    loading={busyId === v.id}
                    disabled={busyId === v.id}
                    onPress={() => act(() => api.markVisitorExited(v.id), v.id)}
                  >
                    Exit
                  </Button>
                </Card.Content>
              </Card>
            ))
          )}

          <View style={styles.quick}>
            <Button
              mode="outlined"
              icon="history"
              onPress={() => navigation.navigate('GuardHistory')}
              style={styles.quickBtn}
            >
              History
            </Button>
            <Button
              mode="outlined"
              icon="bell-outline"
              onPress={() => navigation.navigate('Notifications')}
              style={styles.quickBtn}
            >
              Notifications
            </Button>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const makeStyles = (c: Pal) =>
  StyleSheet.create({
    fill: { flex: 1, backgroundColor: c.bg },
    center: { alignItems: 'center', justifyContent: 'center' },
    scroll: { paddingBottom: spacing(10) },
    wrap: { width: '100%', maxWidth: 720, alignSelf: 'center' },
    header: {
      backgroundColor: c.guard,
      paddingHorizontal: spacing(4),
      paddingVertical: spacing(4),
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
      elevation: 4,
      shadowColor: '#000',
      shadowOpacity: 0.18,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
    },
    hTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
    hSub: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 2 },
    signOut: {
      marginLeft: spacing(3),
      paddingLeft: spacing(3),
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderLeftColor: 'rgba(255,255,255,0.4)',
    },
    pad: { padding: spacing(4) },
    statsRow: { flexDirection: 'row', gap: spacing(3), marginBottom: spacing(4) },
    statCard: { flex: 1, backgroundColor: c.card },
    statInner: { alignItems: 'center', paddingVertical: spacing(1) },
    statValue: { fontSize: 24, fontWeight: '800', color: c.guard },
    statLabel: { fontSize: 12, color: c.muted, marginTop: 2 },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: spacing(2),
    },
    tile: {
      width: '48%',
      minHeight: 88,
      borderRadius: radius.lg,
      paddingVertical: spacing(4),
      paddingHorizontal: spacing(2),
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing(3),
      elevation: 2,
    },
    tileText: {
      color: '#fff',
      fontWeight: '800',
      fontSize: 13,
      marginTop: spacing(2),
      textAlign: 'center',
    },
    section: {
      fontSize: 15,
      fontWeight: '800',
      color: c.text,
      marginTop: spacing(4),
      marginBottom: spacing(3),
    },
    emptyCard: { backgroundColor: c.card },
    emptyText: { color: c.muted, fontSize: 13 },
    itemCard: {
      backgroundColor: c.card,
      marginBottom: spacing(3),
      borderLeftWidth: 4,
    },
    itemTop: { flexDirection: 'row', alignItems: 'flex-start' },
    itemName: { fontSize: 15, fontWeight: '700', color: c.text },
    itemMeta: { fontSize: 12.5, color: c.muted, marginTop: 2, textTransform: 'capitalize' },
    itemSub: { fontSize: 11.5, color: c.muted, marginTop: 3 },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: spacing(2),
      marginTop: spacing(3),
    },
    actBtn: { borderRadius: radius.sm },
    insideRow: { flexDirection: 'row', alignItems: 'center' },
    quick: { flexDirection: 'row', gap: spacing(3), marginTop: spacing(5) },
    quickBtn: { flex: 1, borderColor: c.border },
  });

export default GuardHomeScreen;
