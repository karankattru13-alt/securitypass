import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, ActivityIndicator, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { RootState } from '../../store';
import Screen from '../../components/Screen';
import AppHeader from '../../components/AppHeader';
import VisitorCard from '../../components/VisitorCard';
import SocietySelect from '../../components/SocietySelect';
import SectionTitle from '../../components/SectionTitle';
import StatTile from '../../components/StatTile';
import ActionTile from '../../components/ActionTile';
import { useAppColors, spacing, radius } from '../../theme';
import api from '../../services/api';

type Pal = ReturnType<typeof useAppColors>;

const AdminDashboardScreen: React.FC<any> = ({ navigation }) => {
  const c = useAppColors();
  const styles = React.useMemo(() => makeStyles(c), [c]);
  const user = useSelector((s: RootState) => s.auth.user);

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
          <TouchableOpacity
            style={styles.setupCard}
            onPress={() => navigation.navigate('AdminSociety')}
            activeOpacity={0.85}
          >
            <View style={[styles.setupIcon, { backgroundColor: `${c.admin}22` }]}>
              <MaterialCommunityIcons name="office-building-outline" size={20} color={c.admin} />
            </View>
            <Text style={styles.setupText}>
              Add your society or building to get started — guards and residents
              pick it when they sign in.
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={c.muted} />
          </TouchableOpacity>
        ) : (
          <Card style={styles.societyCard}>
            <Card.Content>
              <SocietySelect />
              <Button
                compact
                icon="cog-outline"
                textColor={c.admin}
                onPress={() => navigation.navigate('AdminSociety')}
                style={{ alignSelf: 'flex-start' }}
              >
                Manage societies &amp; buildings ({societyCount})
              </Button>
            </Card.Content>
          </Card>
        )}

        <View style={styles.row}>
          <StatTile icon="account-group" label="Residents" value={society?.total_residents} tint={c.admin} />
          <StatTile icon="home-city" label="Flats" value={society?.total_flats} tint={c.admin} />
          <StatTile icon="shield-account" label="Guards" value={society?.total_guards} tint={c.admin} />
        </View>
        <View style={[styles.row, { marginTop: spacing(3) }]}>
          <StatTile icon="account-clock" label="Today" value={stats.todayVisitors} tint={c.info} />
          <StatTile icon="login-variant" label="Inside" value={stats.currentlyInside} tint={c.success} />
          <StatTile icon="timer-sand" label="Pending" value={stats.pendingApprovals} tint={c.warning} />
        </View>

        <SectionTitle title="Manage" color={c.admin} />
        <View style={styles.manageRow}>
          <ActionTile
            icon="account-multiple"
            label="Residents"
            color={c.admin}
            filled
            width="31%"
            onPress={() => navigation.navigate('AdminResidents')}
          />
          <ActionTile
            icon="shield-account"
            label="Guards"
            color={c.guard}
            filled
            width="31%"
            onPress={() => navigation.navigate('AdminGuards')}
          />
          <ActionTile
            icon="account-clock"
            label="Visitors"
            color={c.info}
            filled
            width="31%"
            onPress={() => navigation.navigate('AdminVisitors')}
          />
        </View>

        <SectionTitle title="On duty now" count={onDutyGuards.length} color={c.admin} />
        <Card style={styles.card}>
          <Card.Content>
            {onDutyGuards.length === 0 ? (
              <Text style={styles.empty}>No guard is currently on duty.</Text>
            ) : (
              onDutyGuards.map((g, i) => (
                <View key={g.id} style={[styles.dutyRow, i > 0 && styles.dutyRowBorder]}>
                  <MaterialCommunityIcons name="shield-check" size={16} color={c.success} />
                  <Text style={styles.dutyName}>{g.name}</Text>
                  <Text style={styles.dutyGate}>
                    {g.gate} · {g.shift}
                  </Text>
                </View>
              ))
            )}
          </Card.Content>
        </Card>

        <SectionTitle title="Recent activity" color={c.admin} />
        {recent.length === 0 ? (
          <Text style={styles.empty}>No visitor activity yet.</Text>
        ) : (
          recent.map((v) => <VisitorCard key={v.id} visitor={v} />)
        )}
      </View>
    </Screen>
  );
};

const makeStyles = (c: Pal) =>
  StyleSheet.create({
    body: { padding: spacing(4) },
    setupCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(3),
      backgroundColor: c.cardAlt,
      borderRadius: radius.lg,
      padding: spacing(3),
      marginBottom: spacing(4),
    },
    setupIcon: {
      width: 34,
      height: 34,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    setupText: { flex: 1, fontSize: 13, color: c.text, fontWeight: '600' },
    societyCard: {
      backgroundColor: c.card,
      marginBottom: spacing(4),
      borderRadius: radius.lg,
    },
    row: { flexDirection: 'row', gap: spacing(3) },
    manageRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    card: {
      backgroundColor: c.card,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    empty: { color: c.muted, fontSize: 13 },
    dutyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(2),
      paddingVertical: spacing(2),
    },
    dutyRowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
    dutyName: { flex: 1, fontSize: 14, fontWeight: '700', color: c.text },
    dutyGate: { fontSize: 12, color: c.muted },
  });

export default AdminDashboardScreen;
