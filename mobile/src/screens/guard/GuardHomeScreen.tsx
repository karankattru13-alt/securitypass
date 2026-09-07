import React, { useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Button, ActivityIndicator, Tooltip } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../services/api';
import { RootState, AppDispatch } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { confirmSignOut } from '../../components/AppHeader';
import { appAlert } from '../../components/AppDialog';
import AccentCard from '../../components/AccentCard';
import DecisionButtons from '../../components/DecisionButtons';
import SectionTitle from '../../components/SectionTitle';
import StatTile from '../../components/StatTile';
import ActionTile from '../../components/ActionTile';
import { useAppColors, spacing, radius, gradientFor } from '../../theme';
import { clockTime, smartDate } from '../../utils/format';

type Pal = ReturnType<typeof useAppColors>;

const EmptyRow: React.FC<{ text: string }> = ({ text }) => {
  const c = useAppColors();
  return (
    <View
      style={{
        backgroundColor: c.card,
        borderRadius: radius.lg,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: c.border,
        padding: spacing(4),
        marginBottom: spacing(3),
      }}
    >
      <Text style={{ color: c.muted, fontSize: 13 }}>{text}</Text>
    </View>
  );
};

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
        pre.data.filter((x: any) => x.status === 'active' && !x.admitted).slice(0, 5)
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

  const handleEmergency = () =>
    appAlert(
      'Emergency alert sent',
      'The security supervisor and control room have been notified.',
      'danger'
    );

  const actions = [
    { label: 'New Visitor', icon: 'account-plus', bg: c.guard, onPress: () => navigation.navigate('NewVisitor') },
    { label: 'Delivery', icon: 'package-variant-closed', bg: c.resident, onPress: () => navigation.navigate('NewVisitor', { type: 'delivery' }) },
    { label: 'Staff', icon: 'toolbox-outline', bg: c.info, onPress: () => navigation.navigate('NewVisitor', { type: 'staff' }) },
    { label: 'Emergency', icon: 'alert-octagon', bg: c.danger, onPress: handleEmergency },
  ] as const;

  const onDuty = !!user?.on_duty;
  const shiftLabel = onDuty
    ? user?.duty_shift === 'night'
      ? 'Night shift'
      : 'Day shift'
    : 'Off duty';

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
        <LinearGradient
          colors={gradientFor(c.guard)}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View pointerEvents="none" style={styles.headerBlob} />
          <View style={{ flex: 1 }}>
            <Text style={styles.hLabel}>SIGNED IN</Text>
            <Text style={styles.hTitle}>
              {user ? `${user.first_name} ${user.last_name}` : 'Guard'}
            </Text>
            <View style={styles.hPills}>
              <View style={styles.hPill}>
                <Icon name="door-sliding" size={12} color="#fff" />
                <Text style={styles.hPillText}>{user?.gate || 'Main Gate'}</Text>
              </View>
              <View style={[styles.hPill, onDuty && styles.hPillOn]}>
                <Icon
                  name={onDuty ? 'shield-check' : 'shield-off-outline'}
                  size={12}
                  color="#fff"
                />
                <Text style={styles.hPillText}>{shiftLabel}</Text>
              </View>
            </View>
          </View>
          <Tooltip title="Profile">
            <TouchableOpacity onPress={() => navigation.navigate('Profile')} hitSlop={12}>
              <Icon name="account-circle" size={28} color="#fff" />
            </TouchableOpacity>
          </Tooltip>
          <Tooltip title="Sign out">
            <TouchableOpacity
              onPress={() => confirmSignOut(() => dispatch(logout()))}
              style={styles.signOut}
              hitSlop={12}
            >
              <Icon name="logout" size={22} color="#fff" />
            </TouchableOpacity>
          </Tooltip>
        </LinearGradient>

        <View style={styles.pad}>
          <View style={styles.row}>
            <StatTile icon="account-clock" label="Today" value={stats.todayVisitors} tint={c.guard} />
            <StatTile icon="login-variant" label="Inside" value={stats.currentlyInside} tint={c.success} />
            <StatTile icon="timer-sand" label="Pending" value={stats.pendingApprovals} tint={c.warning} />
          </View>

          <View style={styles.grid}>
            {actions.map((a) => (
              <ActionTile
                key={a.label}
                icon={a.icon as any}
                label={a.label}
                color={a.bg}
                filled
                onPress={a.onPress}
              />
            ))}
          </View>

          <SectionTitle title="Awaiting approval" count={pending.length} color={c.warning} />
          {pending.length === 0 ? (
            <EmptyRow text="No visitors waiting at the gate." />
          ) : (
            pending.map((v) => (
              <AccentCard key={v.id} accent={c.warning}>
                <Text style={styles.itemName}>{v.name}</Text>
                <Text style={styles.itemMeta}>
                  {v.type} · for {v.resident_name || v.flat} · {clockTime(v.requested_at)}
                </Text>
                <DecisionButtons
                  loading={busyId === v.id}
                  disabled={busyId === v.id}
                  onAccept={() => act(() => api.approveVisitor(v.id), v.id)}
                  onDeny={() => act(() => api.denyVisitor(v.id), v.id)}
                  onOpen={() => navigation.navigate('VisitorApproval', { visitorId: v.id })}
                />
              </AccentCard>
            ))
          )}

          <SectionTitle title="Pre-approved visitors" count={preApproved.length} color={c.resident} />
          {preApproved.length === 0 ? (
            <EmptyRow text="No active pre-approved visitors." />
          ) : (
            preApproved.map((p) => (
              <AccentCard key={p.id} accent={c.resident}>
                <Text style={styles.itemName}>{p.name}</Text>
                <Text style={styles.itemMeta}>
                  {p.flat} · {p.resident_name} · {p.purpose}
                </Text>
                <Text style={styles.itemSub}>
                  Valid {p.days} day{p.days === 1 ? '' : 's'} · until {smartDate(p.valid_to)}
                </Text>
                <Button
                  mode="contained"
                  icon="login-variant"
                  buttonColor={c.success}
                  textColor="#fff"
                  loading={busyId === p.id}
                  disabled={busyId === p.id}
                  onPress={() => act(() => api.admitPreApproved(p.id), p.id)}
                  style={styles.cardBtn}
                  contentStyle={styles.cardBtnContent}
                  labelStyle={styles.cardBtnLabel}
                >
                  Admit visitor
                </Button>
              </AccentCard>
            ))
          )}

          <SectionTitle title="Currently inside" count={inside.length} color={c.info} />
          {inside.length === 0 ? (
            <EmptyRow text="Nobody is inside right now." />
          ) : (
            inside.map((v) => (
              <AccentCard
                key={v.id}
                accent={c.info}
                onPress={() => navigation.navigate('VisitorDetails', { visitorId: v.id })}
              >
                <View style={styles.insideRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{v.name}</Text>
                    <Text style={styles.itemMeta}>
                      {v.flat} · in since {clockTime(v.entry_time)}
                    </Text>
                  </View>
                  <Button
                    mode="contained-tonal"
                    icon="logout-variant"
                    loading={busyId === v.id}
                    disabled={busyId === v.id}
                    onPress={() => act(() => api.markVisitorExited(v.id), v.id)}
                    style={styles.exitBtn}
                    contentStyle={styles.cardBtnContent}
                    labelStyle={styles.cardBtnLabel}
                  >
                    Exit
                  </Button>
                </View>
              </AccentCard>
            ))
          )}

          <View style={styles.quick}>
            <Button
              mode="outlined"
              icon="history"
              onPress={() => navigation.navigate('GuardHistory')}
              style={styles.quickBtn}
              contentStyle={styles.quickContent}
            >
              History
            </Button>
            <Button
              mode="outlined"
              icon="bell-outline"
              onPress={() => navigation.navigate('Notifications')}
              style={styles.quickBtn}
              contentStyle={styles.quickContent}
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
      paddingHorizontal: spacing(4),
      paddingTop: spacing(5),
      paddingBottom: spacing(6),
      flexDirection: 'row',
      alignItems: 'flex-start',
      borderBottomLeftRadius: 26,
      borderBottomRightRadius: 26,
      overflow: 'hidden',
      elevation: 6,
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 5 },
    },
    headerBlob: {
      position: 'absolute',
      right: -50,
      top: -70,
      width: 180,
      height: 180,
      borderRadius: 90,
      backgroundColor: 'rgba(255,255,255,0.08)',
    },
    hLabel: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1,
      color: 'rgba(255,255,255,0.7)',
    },
    hTitle: { fontSize: 21, fontWeight: '800', color: '#fff', marginTop: 2 },
    hPills: { flexDirection: 'row', gap: spacing(2), marginTop: spacing(3), flexWrap: 'wrap' },
    hPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(255,255,255,0.16)',
      borderRadius: radius.pill,
      paddingHorizontal: spacing(2),
      paddingVertical: 3,
    },
    hPillOn: { backgroundColor: 'rgba(255,255,255,0.28)' },
    hPillText: { color: '#fff', fontSize: 11, fontWeight: '700' },
    signOut: {
      marginLeft: spacing(3),
      paddingLeft: spacing(3),
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderLeftColor: 'rgba(255,255,255,0.4)',
    },
    pad: { paddingHorizontal: spacing(4), paddingBottom: spacing(4) },
    row: { flexDirection: 'row', gap: spacing(3), marginTop: -spacing(7) },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginTop: spacing(4),
    },
    itemName: { fontSize: 15.5, fontWeight: '800', color: c.text },
    itemMeta: { fontSize: 12.5, color: c.muted, marginTop: 3, textTransform: 'capitalize' },
    itemSub: { fontSize: 11.5, color: c.muted, marginTop: 4 },
    cardBtn: { borderRadius: radius.md, marginTop: spacing(3), alignSelf: 'flex-start' },
    cardBtnContent: { height: 40, paddingHorizontal: spacing(3) },
    cardBtnLabel: { fontSize: 13, fontWeight: '800', marginVertical: 0 },
    exitBtn: { borderRadius: radius.md },
    insideRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(3) },
    quick: { flexDirection: 'row', gap: spacing(3), marginTop: spacing(6) },
    quickBtn: { flex: 1, borderColor: c.border, borderRadius: radius.pill },
    quickContent: { height: 44 },
  });

export default GuardHomeScreen;
