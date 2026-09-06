import React, { useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity, Text, StyleSheet, Alert, Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Button, Badge, ActivityIndicator, Tooltip } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';
import { RootState, AppDispatch } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { confirmSignOut } from '../../components/AppHeader';
import { useAppColors, spacing, radius } from '../../theme';
import { clockTime } from '../../utils/format';

type Pal = ReturnType<typeof useAppColors>;

interface PendingApproval {
  id: number;
  visitor_name: string;
  flat: string;
  resident_name?: string;
  requested_at: string;
}

interface CurrentVisitor {
  id: number;
  name: string;
  flat: string;
  entry_time: string;
}

const GuardHomeScreen: React.FC<any> = ({ navigation }) => {
  const c = useAppColors();
  const styles = React.useMemo(() => makeStyles(c), [c]);
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [currentVisitors, setCurrentVisitors] = useState<CurrentVisitor[]>([]);
  const [stats, setStats] = useState({
    todayVisitors: 0,
    currentlyInside: 0,
    pendingApprovals: 0,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const approvalsResponse = await api.getVisitors({
        approval_status: 'pending',
        status: 'waiting',
      });
      setPendingApprovals(approvalsResponse.data);

      const currentResponse = await api.getVisitors({ status: 'entered' });
      setCurrentVisitors(currentResponse.data);

      const statsResponse = await api.getGuardStats();
      setStats(statsResponse.data);
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

  const handleExit = async (visitorId: number) => {
    try {
      await api.markVisitorExited(visitorId);
      loadData();
    } catch (error) {
      console.error('Error marking exit:', error);
    }
  };

  const handleEmergency = () => {
    const msg = 'This would alert the security supervisor and control room.';
    if (Platform.OS === 'web') window.alert(`Emergency alert\n\n${msg}`);
    else Alert.alert('Emergency alert', msg);
  };

  if (loading && pendingApprovals.length === 0) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={c.guard} />
      </View>
    );
  }

  const actions = [
    { label: 'NEW VISITOR', icon: 'plus-circle', bg: c.guard, onPress: () => navigation.navigate('NewVisitor') },
    { label: 'DELIVERY', icon: 'package-variant-closed', bg: c.resident, onPress: () => navigation.navigate('NewVisitor', { type: 'delivery' }) },
    { label: 'STAFF', icon: 'account-multiple', bg: c.resident, onPress: () => navigation.navigate('NewVisitor', { type: 'staff' }) },
    { label: 'EMERGENCY', icon: 'alert-circle', bg: c.danger, onPress: handleEmergency },
  ] as const;

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.header, { backgroundColor: c.guard }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>SocietyPass Guard</Text>
          <Text style={styles.subtitle}>
            {user?.gate || 'Main Gate'} • {user?.shift || 'Morning Shift'}
          </Text>
        </View>
        <Icon name="security" size={26} color="#fff" />
        <Tooltip title="Sign out">
          <TouchableOpacity
            onPress={() => confirmSignOut(() => dispatch(logout()))}
            style={styles.signOutBtn}
            hitSlop={12}
            accessibilityLabel="Sign out"
          >
            <Icon name="logout" size={22} color="#fff" />
          </TouchableOpacity>
        </Tooltip>
      </View>

      <View style={styles.statsContainer}>
        {[
          { label: "Today's Visitors", value: stats.todayVisitors },
          { label: 'Currently Inside', value: stats.currentlyInside },
          { label: 'Pending', value: stats.pendingApprovals },
        ].map((s) => (
          <Card key={s.label} style={styles.statCard}>
            <Card.Content>
              <Text style={styles.statLabel}>{s.label}</Text>
              <Text style={styles.statValue}>{s.value}</Text>
            </Card.Content>
          </Card>
        ))}
      </View>

      <View style={styles.actionButtonsContainer}>
        {actions.map((a) => (
          <Tooltip key={a.label} title={a.label}>
            <TouchableOpacity
              style={[styles.largeButton, { backgroundColor: a.bg }]}
              onPress={a.onPress}
            >
              <Icon name={a.icon as any} size={38} color="#fff" />
              <Text style={styles.buttonText}>{a.label}</Text>
            </TouchableOpacity>
          </Tooltip>
        ))}
      </View>

      {pendingApprovals.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Awaiting Resident Approval ({pendingApprovals.length})
          </Text>
          {pendingApprovals.map((approval) => (
            <Card
              key={approval.id}
              style={[styles.eventCard, { backgroundColor: c.cardAlt }]}
              onPress={() =>
                navigation.navigate('VisitorApproval', { visitorId: approval.id })
              }
            >
              <Card.Content style={styles.eventRow}>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventName}>{approval.visitor_name}</Text>
                  <Text style={styles.eventMeta}>
                    For {approval.resident_name || approval.flat || 'resident'}
                  </Text>
                  <Text style={styles.eventTime}>{clockTime(approval.requested_at)}</Text>
                </View>
                <Badge size={22} style={{ backgroundColor: c.warning }}>
                  1
                </Badge>
              </Card.Content>
            </Card>
          ))}
        </View>
      )}

      {currentVisitors.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Currently Inside ({currentVisitors.length})
          </Text>
          {currentVisitors.map((visitor) => (
            <Card
              key={visitor.id}
              style={styles.eventCard}
              onPress={() =>
                navigation.navigate('VisitorDetails', { visitorId: visitor.id })
              }
            >
              <Card.Content style={styles.eventRow}>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventName}>{visitor.name}</Text>
                  <Text style={styles.eventMeta}>{visitor.flat}</Text>
                </View>
                <Tooltip title="Mark exit">
                  <TouchableOpacity
                    style={styles.exitButton}
                    onPress={() => handleExit(visitor.id)}
                    accessibilityLabel="Mark exit"
                  >
                    <Icon name="logout-variant" size={24} color={c.success} />
                  </TouchableOpacity>
                </Tooltip>
              </Card.Content>
            </Card>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <Button
          mode="outlined"
          icon="history"
          onPress={() => navigation.navigate('GuardHistory')}
          style={styles.quickActionButton}
        >
          View History
        </Button>
        <Button
          mode="outlined"
          icon="bell-outline"
          onPress={() => navigation.navigate('Notifications')}
          style={styles.quickActionButton}
        >
          Notifications
        </Button>
      </View>
    </ScrollView>
  );
};

const makeStyles = (c: Pal) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg, paddingBottom: 20 },
    center: { alignItems: 'center', justifyContent: 'center' },
    header: {
      padding: 20,
      flexDirection: 'row',
      alignItems: 'center',
    },
    title: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
    subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)' },
    signOutBtn: {
      marginLeft: 12,
      paddingLeft: 12,
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderLeftColor: 'rgba(255,255,255,0.4)',
    },
    statsContainer: {
      flexDirection: 'row',
      padding: 10,
      justifyContent: 'space-between',
    },
    statCard: { flex: 1, marginHorizontal: 5, backgroundColor: c.card },
    statLabel: { fontSize: 12, color: c.muted, textAlign: 'center', marginBottom: 8 },
    statValue: { fontSize: 26, fontWeight: 'bold', color: c.guard, textAlign: 'center' },
    actionButtonsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      padding: 10,
      justifyContent: 'space-between',
    },
    largeButton: {
      width: '48%',
      borderRadius: radius.md,
      padding: 20,
      marginBottom: 10,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 3,
    },
    buttonText: {
      color: '#fff',
      fontWeight: 'bold',
      marginTop: 8,
      fontSize: 12,
      textAlign: 'center',
    },
    section: { padding: 15 },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 12,
      color: c.text,
    },
    eventCard: { marginBottom: 10, backgroundColor: c.card },
    eventRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    eventInfo: { flex: 1 },
    eventName: { fontSize: 16, fontWeight: '600', color: c.text },
    eventMeta: { fontSize: 14, color: c.muted, marginTop: 4 },
    eventTime: { fontSize: 12, color: c.muted, marginTop: 4 },
    exitButton: { padding: 10 },
    quickActionButton: { marginBottom: 10, borderColor: c.guard },
  });

export default GuardHomeScreen;
