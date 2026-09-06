import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, ActivityIndicator, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { RootState } from '../../store';
import Screen from '../../components/Screen';
import AppHeader from '../../components/AppHeader';
import VisitorCard from '../../components/VisitorCard';
import SocietySelect from '../../components/SocietySelect';
import { useAppColors, spacing, radius } from '../../theme';
import api from '../../services/api';

type Pal = ReturnType<typeof useAppColors>;


const AdminDashboardScreen: React.FC<any> = ({ navigation }) => {
  const c = useAppColors();
  const styles = React.useMemo(() => makeStyles(c), [c]);
  const user = useSelector((s: RootState) => s.auth.user);

  const Stat = ({ icon, label, value, tint }: any) => (
    <Card style={styles.statCard}>
      <Card.Content style={styles.statInner}>
        <MaterialCommunityIcons name={icon} size={26} color={tint} />
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </Card.Content>
    </Card>
  );

  const [society, setSociety] = useState<any>(null);
  const [societyCount, setSocietyCount] = useState(0);
  const [stats, setStats] = useState<any>({ todayVisitors: 0, currentlyInside: 0, pendingApprovals: 0 });
  const [recent, setRecent] = useState<any[]>([]);
  const [onDutyGuards, setOnDutyGuards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [societies, gs, v, g] = await Promise.all([
        api.getSocieties(),
        api.getGuardStats(),
        api.getVisitors(),
        api.getOnDutyGuards(),
      ]);
      setSocietyCount(societies.data.length);
      setSociety(
        societies.data.find((s: any) => s.id === user?.society_id) ||
          societies.data[0] ||
          null
      );
      setStats(gs.data);
      setRecent(v.data.slice(0, 6));
      setOnDutyGuards(g.data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.society_id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) {
    return (
      <Screen>
        <ActivityIndicator style={{ marginTop: spacing(12) }} color={c.admin} />
      </Screen>
    );
  }

  return (
    <Screen padded={false} refreshing={refreshing} onRefresh={load}>
      <AppHeader
        title="Admin Dashboard"
        subtitle={
          societyCount > 1
            ? `${society?.name || 'Society'} · ${societyCount} places`
            : society?.name
        }
        color={c.admin}
        icon="view-dashboard"
      />
      <View style={styles.body}>
        {societyCount === 0 ? (
          <Card style={styles.setupCard} onPress={() => navigation.navigate('AdminSociety')}>
            <Card.Content style={styles.setupRow}>
              <MaterialCommunityIcons name="office-building-outline" size={26} color={c.admin} />
              <Text style={styles.setupText}>
                Add your society or building to get started — guards and residents
                will pick it when they sign in.
              </Text>
              <MaterialCommunityIcons name="chevron-right" size={22} color={c.muted} />
            </Card.Content>
          </Card>
        ) : (
          <Card style={styles.societyCard}>
            <Card.Content>
              <SocietySelect />
              <Button
                compact
                icon="cog-outline"
                textColor={c.admin}
                onPress={() => navigation.navigate('AdminSociety')}
              >
                Manage societies &amp; buildings ({societyCount})
              </Button>
            </Card.Content>
          </Card>
        )}

        <View style={styles.statGrid}>
          <Stat icon="account-group" label="Residents" value={society?.total_residents} tint={c.admin} />
          <Stat icon="home-city" label="Flats" value={society?.total_flats} tint={c.admin} />
          <Stat icon="shield-account" label="Guards" value={society?.total_guards} tint={c.admin} />
        </View>
        <View style={styles.statGrid}>
          <Stat icon="account-clock" label="Today" value={stats.todayVisitors} tint={c.info} />
          <Stat icon="login-variant" label="Inside" value={stats.currentlyInside} tint={c.success} />
          <Stat icon="timer-sand" label="Pending" value={stats.pendingApprovals} tint={c.warning} />
        </View>

        <View style={styles.linkRow}>
          <Button
            mode="contained-tonal"
            icon="account-multiple"
            compact
            onPress={() => navigation.navigate('AdminResidents')}
            style={styles.link}
          >
            Residents
          </Button>
          <Button
            mode="contained-tonal"
            icon="shield-account"
            compact
            onPress={() => navigation.navigate('AdminGuards')}
            style={styles.link}
          >
            Guards
          </Button>
          <Button
            mode="contained-tonal"
            icon="account-clock"
            compact
            onPress={() => navigation.navigate('AdminVisitors')}
            style={styles.link}
          >
            Visitors
          </Button>
        </View>

        <Text style={styles.section}>On duty now ({onDutyGuards.length})</Text>
        <Card style={styles.dutyCard}>
          <Card.Content>
            {onDutyGuards.length === 0 ? (
              <Text style={styles.dutyEmpty}>No guard is currently on duty.</Text>
            ) : (
              onDutyGuards.map((g, i) => (
                <View
                  key={g.id}
                  style={[styles.dutyRow, i > 0 && styles.dutyRowBorder]}
                >
                  <MaterialCommunityIcons name="shield-check" size={18} color={c.success} />
                  <Text style={styles.dutyName}>{g.name}</Text>
                  <Text style={styles.dutyGate}>{g.gate}</Text>
                </View>
              ))
            )}
          </Card.Content>
        </Card>

        <Text style={styles.section}>Recent activity</Text>
        {recent.map((v) => (
          <VisitorCard key={v.id} visitor={v} />
        ))}
      </View>
    </Screen>
  );
};

const makeStyles = (c: Pal) =>
  StyleSheet.create({
  body: { padding: spacing(4) },
  setupCard: { backgroundColor: c.cardAlt, marginBottom: spacing(4) },
  setupRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(3) },
  setupText: { flex: 1, fontSize: 13, color: c.text, fontWeight: '600' },
  societyCard: { backgroundColor: c.card, marginBottom: spacing(4) },
  statGrid: { flexDirection: 'row', gap: spacing(2), marginBottom: spacing(3) },
  statCard: { flex: 1, backgroundColor: c.card },
  statInner: { alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: c.text, marginTop: spacing(1) },
  statLabel: { fontSize: 11, color: c.muted, marginTop: 2 },
  linkRow: { flexDirection: 'row', gap: spacing(3), marginVertical: spacing(3) },
  link: { flex: 1, borderRadius: radius.sm },
  dutyCard: { backgroundColor: c.card },
  dutyEmpty: { color: c.muted, fontSize: 13 },
  dutyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(2), paddingVertical: spacing(2) },
  dutyRowBorder: { borderTopWidth: 1, borderTopColor: c.border },
  dutyName: { flex: 1, fontSize: 14, fontWeight: '700', color: c.text },
  dutyGate: { fontSize: 12, color: c.muted },
  section: {
    fontSize: 16,
    fontWeight: '800',
    color: c.text,
    marginTop: spacing(3),
    marginBottom: spacing(3),
  },
});

export default AdminDashboardScreen;
