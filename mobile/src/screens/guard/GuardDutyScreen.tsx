import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, ActivityIndicator, Divider, SegmentedButtons } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../../components/Screen';
import AppHeader from '../../components/AppHeader';
import EmptyState from '../../components/EmptyState';
import { useAppColors, spacing, radius } from '../../theme';
import { initials } from '../../utils/format';
import { AppDispatch, RootState } from '../../store';
import { setDuty } from '../../store/slices/authSlice';
import api from '../../services/api';

type Pal = ReturnType<typeof useAppColors>;

const MODES = [
  { value: 'off', label: 'Off Duty', icon: 'shield-off-outline' },
  { value: 'day', label: 'Day Duty', icon: 'weather-sunny' },
  { value: 'night', label: 'Night Duty', icon: 'weather-night' },
];

const GuardDutyScreen: React.FC<any> = ({ navigation }) => {
  const c = useAppColors();
  const styles = React.useMemo(() => makeStyles(c), [c]);
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((s: RootState) => s.auth);
  const [onDutyGuards, setOnDutyGuards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const r = await api.getOnDutyGuards();
      setOnDutyGuards(r.data);
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

  const mode: 'off' | 'day' | 'night' = !user?.on_duty
    ? 'off'
    : user?.duty_shift === 'night'
    ? 'night'
    : 'day';

  const change = async (next: string) => {
    setSaving(true);
    try {
      await dispatch(
        setDuty({
          onDuty: next !== 'off',
          dutyShift: next === 'night' ? 'night' : 'day',
        })
      ).unwrap();
      await load();
    } finally {
      setSaving(false);
    }
  };

  const onDuty = mode !== 'off';
  const isNight = mode === 'night';

  return (
    <Screen padded={false} refreshing={refreshing} onRefresh={load}>
      <AppHeader
        title="My Duty"
        subtitle={user?.gate || 'Main Gate'}
        color={c.guard}
        icon="shield-account"
        onBack={() => navigation.navigate('GuardHome')}
      />
      <View style={styles.body}>
        <Card style={[styles.statusCard, { borderColor: onDuty ? c.success : c.border }]}>
          <Card.Content>
            <View style={styles.statusRow}>
              <MaterialCommunityIcons
                name={
                  !onDuty ? 'shield-off-outline' : isNight ? 'weather-night' : 'weather-sunny'
                }
                size={40}
                color={!onDuty ? c.muted : isNight ? c.info : c.warning}
              />
              <View style={styles.statusText}>
                <Text style={styles.statusTitle}>
                  {mode === 'off'
                    ? 'Off duty'
                    : isNight
                    ? 'On duty — Night Shift'
                    : 'On duty — Day Shift'}
                </Text>
                <Text style={styles.statusSub}>
                  {onDuty
                    ? 'Residents and admins can see you are at the gate.'
                    : 'Pick a shift when you start work.'}
                </Text>
              </View>
            </View>

            <SegmentedButtons
              value={mode}
              onValueChange={change}
              buttons={MODES.map((m) => ({
                value: m.value,
                label: m.label,
                icon: m.icon,
                disabled: saving,
              }))}
              style={styles.segment}
            />

            <Divider style={styles.divider} />
            <Text style={styles.meta}>
              {user?.gate || 'Main Gate'} ·{' '}
              {mode === 'off' ? 'Not signed on' : isNight ? 'Night Shift' : 'Day Shift'}
            </Text>
          </Card.Content>
        </Card>

        <Text style={styles.section}>On duty right now</Text>
        {loading ? (
          <ActivityIndicator color={c.guard} style={{ marginTop: spacing(6) }} />
        ) : onDutyGuards.length === 0 ? (
          <EmptyState icon="account-off-outline" title="No guards on duty" />
        ) : (
          <Card style={styles.listCard}>
            {onDutyGuards.map((g, i) => (
              <React.Fragment key={g.id}>
                <View style={styles.guardRow}>
                  <View
                    style={[
                      styles.avatar,
                      { backgroundColor: g.duty_shift === 'night' ? c.info : c.guard },
                    ]}
                  >
                    <Text style={styles.avatarText}>
                      {initials(g.first_name, g.last_name)}
                    </Text>
                  </View>
                  <View style={styles.guardInfo}>
                    <Text style={styles.guardName}>
                      {g.name}
                      {g.id === user?.id ? ' (you)' : ''}
                    </Text>
                    <Text style={styles.guardMeta}>
                      {g.gate} · {g.shift}
                    </Text>
                  </View>
                  <MaterialCommunityIcons
                    name={g.duty_shift === 'night' ? 'weather-night' : 'weather-sunny'}
                    size={18}
                    color={g.duty_shift === 'night' ? c.info : c.warning}
                  />
                </View>
                {i < onDutyGuards.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </Card>
        )}
      </View>
    </Screen>
  );
};

const makeStyles = (c: Pal) =>
  StyleSheet.create({
    body: { padding: spacing(4) },
    statusCard: {
      backgroundColor: c.card,
      borderWidth: 1.5,
      marginBottom: spacing(5),
    },
    statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing(4) },
    statusText: { marginLeft: spacing(3), flex: 1 },
    statusTitle: { fontSize: 17, fontWeight: '800', color: c.text },
    statusSub: { fontSize: 12, color: c.muted, marginTop: 2 },
    segment: { marginTop: spacing(1) },
    divider: { marginVertical: spacing(3) },
    meta: { fontSize: 13, color: c.muted, fontWeight: '600' },
    section: {
      fontSize: 16,
      fontWeight: '800',
      color: c.text,
      marginBottom: spacing(3),
    },
    listCard: { backgroundColor: c.card },
    guardRow: { flexDirection: 'row', alignItems: 'center', padding: spacing(3) },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { color: '#fff', fontWeight: '800', fontSize: 13 },
    guardInfo: { flex: 1, marginLeft: spacing(3) },
    guardName: { fontSize: 15, fontWeight: '700', color: c.text },
    guardMeta: { fontSize: 12, color: c.muted, marginTop: 2 },
  });

export default GuardDutyScreen;
