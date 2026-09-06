import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, ActivityIndicator, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../../components/Screen';
import AppHeader from '../../components/AppHeader';
import VisitorCard from '../../components/VisitorCard';
import { useAppColors, spacing, radius } from '../../theme';
import api from '../../services/api';

type Pal = ReturnType<typeof useAppColors>;


const AdminDashboardScreen: React.FC<any> = ({ navigation }) => {
  const c = useAppColors();
  const styles = React.useMemo(() => makeStyles(c), [c]);

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
  const [stats, setStats] = useState<any>({ todayVisitors: 0, currentlyInside: 0, pendingApprovals: 0 });
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [s, gs, v] = await Promise.all([
        api.getSociety(1),
        api.getGuardStats(),
        api.getVisitors(),
      ]);
      setSociety(s.data);
      setStats(gs.data);
      setRecent(v.data.slice(0, 6));
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
        subtitle={society?.name}
        color={c.admin}
        icon="view-dashboard"
      />
      <View style={styles.body}>
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
            onPress={() => navigation.navigate('AdminResidents')}
            style={styles.link}
          >
            Residents
          </Button>
          <Button
            mode="contained-tonal"
            icon="shield-account"
            onPress={() => navigation.navigate('AdminGuards')}
            style={styles.link}
          >
            Guards
          </Button>
        </View>

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
  statGrid: { flexDirection: 'row', gap: spacing(2), marginBottom: spacing(3) },
  statCard: { flex: 1, backgroundColor: c.card },
  statInner: { alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: c.text, marginTop: spacing(1) },
  statLabel: { fontSize: 11, color: c.muted, marginTop: 2 },
  linkRow: { flexDirection: 'row', gap: spacing(3), marginVertical: spacing(3) },
  link: { flex: 1, borderRadius: radius.sm },
  section: {
    fontSize: 16,
    fontWeight: '800',
    color: c.text,
    marginTop: spacing(3),
    marginBottom: spacing(3),
  },
});

export default AdminDashboardScreen;
