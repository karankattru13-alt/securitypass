import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, Switch, ActivityIndicator, Divider } from 'react-native-paper';
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

const GuardDutyScreen: React.FC = () => {
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

  const toggle = async (value: boolean) => {
    setSaving(true);
    try {
      await dispatch(setDuty(value)).unwrap();
      await load();
    } finally {
      setSaving(false);
    }
  };

  const onDuty = !!user?.on_duty;

  return (
    <Screen padded={false} refreshing={refreshing} onRefresh={load}>
      <AppHeader
        title="My Duty"
        subtitle={user?.gate || 'Main Gate'}
        color={c.guard}
        icon="shield-account"
      />
      <View style={styles.body}>
        <Card style={[styles.statusCard, { borderColor: onDuty ? c.success : c.border }]}>
          <Card.Content>
            <View style={styles.statusRow}>
              <View style={styles.statusLeft}>
                <MaterialCommunityIcons
                  name={onDuty ? 'shield-check' : 'shield-off-outline'}
                  size={40}
                  color={onDuty ? c.success : c.muted}
                />
                <View style={styles.statusText}>
                  <Text style={styles.statusTitle}>
                    {onDuty ? 'On duty' : 'Off duty'}
                  </Text>
                  <Text style={styles.statusSub}>
                    {onDuty
                      ? 'Residents and admins can see you are at the gate.'
                      : 'Turn on when you start your shift.'}
                  </Text>
                </View>
              </View>
              <Switch
                value={onDuty}
                onValueChange={toggle}
                disabled={saving}
                color={c.success}
              />
            </View>
            <Divider style={styles.divider} />
            <Text style={styles.meta}>
              {user?.gate || 'Main Gate'} · {user?.shift || 'General Shift'}
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
                  <View style={[styles.avatar, { backgroundColor: c.guard }]}>
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
                  <View style={[styles.dot, { backgroundColor: c.success }]} />
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
    statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    statusLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    statusText: { marginLeft: spacing(3), flex: 1 },
    statusTitle: { fontSize: 18, fontWeight: '800', color: c.text },
    statusSub: { fontSize: 12, color: c.muted, marginTop: 2 },
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
    dot: { width: 10, height: 10, borderRadius: 5 },
  });

export default GuardDutyScreen;
