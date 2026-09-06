import React, { useCallback, useState } from 'react';
import { View, Image, StyleSheet, Platform, Alert } from 'react-native';
import { Text, Button, ActivityIndicator, Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../../components/Screen';
import AppHeader from '../../components/AppHeader';
import StatusPill from '../../components/StatusPill';
import { useAppColors, spacing, radius } from '../../theme';
import { smartDate } from '../../utils/format';
import api from '../../services/api';

type Pal = ReturnType<typeof useAppColors>;


const notify = (msg: string) =>
  Platform.OS === 'web' ? window.alert(msg) : Alert.alert('SocietyPass', msg);

const VisitorDetailsScreen: React.FC<any> = ({ navigation, route }) => {
  const c = useAppColors();
  const styles = React.useMemo(() => makeStyles(c), [c]);

  const Row = ({ icon, label, value }: any) => (
    <View style={styles.row}>
      <MaterialCommunityIcons name={icon} size={18} color={c.muted} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value || '—'}</Text>
    </View>
  );

  const visitorId: number = route.params?.visitorId;
  const [visitor, setVisitor] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(
    () => api.getVisitor(visitorId).then((r) => setVisitor(r.data)),
    [visitorId]
  );
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const run = async (fn: () => Promise<any>, msg: string) => {
    setBusy(true);
    try {
      await fn();
      await load();
      notify(msg);
    } finally {
      setBusy(false);
    }
  };

  const callResident = () =>
    run(
      () => api.initiateCall(0, 'voice'),
      'Calling resident… (simulated in demo mode)'
    );

  if (!visitor) {
    return (
      <Screen>
        <ActivityIndicator style={{ marginTop: spacing(12) }} color={c.primary} />
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <AppHeader
        title="Visitor Details"
        subtitle={visitor.name}
        color={c.guard}
        onBack={() => navigation.goBack()}
      />
      <View style={styles.body}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.head}>
              {visitor.photo ? (
                <Image source={{ uri: visitor.photo }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <MaterialCommunityIcons name="account" size={40} color="#fff" />
                </View>
              )}
              <View style={styles.headInfo}>
                <Text style={styles.name}>{visitor.name}</Text>
                <Text style={styles.sub}>{visitor.purpose}</Text>
                <StatusPill status={visitor.status} />
              </View>
            </View>
            <Row icon="phone" label="Phone" value={visitor.phone} />
            <Row icon="home" label="Flat" value={visitor.flat} />
            <Row icon="account-tie" label="Resident" value={visitor.resident_name} />
            <Row icon="car" label="Vehicle" value={visitor.vehicle_number} />
            <Row icon="clock-outline" label="Requested" value={smartDate(visitor.requested_at)} />
            <Row icon="login-variant" label="Entered" value={smartDate(visitor.entry_time)} />
            <Row icon="logout-variant" label="Exited" value={smartDate(visitor.exit_time)} />
          </Card.Content>
        </Card>

        {visitor.status === 'waiting' && (
          <Button
            mode="contained"
            icon="clipboard-check-outline"
            buttonColor={c.guard}
            onPress={() => navigation.navigate('VisitorApproval', { visitorId })}
            style={styles.action}
          >
            Go to Approval
          </Button>
        )}
        {visitor.approval_status === 'approved' && visitor.status !== 'entered' && visitor.status !== 'exited' && (
          <Button
            mode="contained"
            icon="login-variant"
            buttonColor={c.success}
            loading={busy}
            disabled={busy}
            onPress={() => run(() => api.markVisitorEntered(visitorId), 'Entry recorded.')}
            style={styles.action}
          >
            Mark Entry
          </Button>
        )}
        {visitor.status === 'entered' && (
          <Button
            mode="contained"
            icon="logout-variant"
            buttonColor={c.info}
            loading={busy}
            disabled={busy}
            onPress={() => run(() => api.markVisitorExited(visitorId), 'Exit recorded.')}
            style={styles.action}
          >
            Mark Exit
          </Button>
        )}
        <Button
          mode="outlined"
          icon="phone"
          loading={busy}
          disabled={busy}
          onPress={callResident}
          style={styles.action}
        >
          Call Resident
        </Button>
      </View>
    </Screen>
  );
};

const makeStyles = (c: Pal) =>
  StyleSheet.create({
  body: { padding: spacing(4) },
  card: { backgroundColor: c.card, marginBottom: spacing(4) },
  head: { flexDirection: 'row', marginBottom: spacing(3) },
  avatar: { width: 72, height: 72, borderRadius: radius.md, backgroundColor: c.border },
  avatarFallback: { backgroundColor: c.guard, alignItems: 'center', justifyContent: 'center' },
  headInfo: { flex: 1, marginLeft: spacing(3), justifyContent: 'center' },
  name: { fontSize: 18, fontWeight: '800', color: c.text },
  sub: { fontSize: 13, color: c.muted, marginTop: 2, marginBottom: spacing(2) },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing(2),
    borderTopWidth: 1,
    borderTopColor: c.border,
  },
  rowLabel: { marginLeft: spacing(2), color: c.muted, width: 90, fontSize: 13 },
  rowValue: { flex: 1, color: c.text, fontSize: 14, fontWeight: '600' },
  action: { marginBottom: spacing(3) },
});

export default VisitorDetailsScreen;
