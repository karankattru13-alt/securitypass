import React, { useCallback, useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
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

  const decide = async (approve: boolean) => {
    setBusy(true);
    try {
      if (approve) await api.approveVisitor(visitorId);
      else await api.denyVisitor(visitorId);
      await load();
    } finally {
      setBusy(false);
    }
  };

  if (!visitor) {
    return (
      <Screen>
        <ActivityIndicator style={{ marginTop: spacing(12) }} color={c.primary} />
      </Screen>
    );
  }

  const pending = visitor.approval_status === 'pending';
  const cancellable = visitor.approval_status === 'approved' && visitor.status === 'approved';

  return (
    <Screen padded={false}>
      <AppHeader
        title="Visitor"
        subtitle={visitor.name}
        color={c.resident}
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
            <Row icon="shape-outline" label="Type" value={visitor.type} />
            <Row icon="car" label="Vehicle" value={visitor.vehicle_number} />
            <Row icon="clock-outline" label="Requested" value={smartDate(visitor.requested_at)} />
            <Row icon="login-variant" label="Entered" value={smartDate(visitor.entry_time)} />
            <Row icon="logout-variant" label="Exited" value={smartDate(visitor.exit_time)} />
            {visitor.remarks ? (
              <Row icon="comment-text-outline" label="Remarks" value={visitor.remarks} />
            ) : null}
          </Card.Content>
        </Card>

        {pending && (
          <View style={styles.actions}>
            <Button
              mode="contained"
              icon="check"
              buttonColor={c.success}
              loading={busy}
              disabled={busy}
              onPress={() => decide(true)}
              style={styles.actionBtn}
            >
              Approve
            </Button>
            <Button
              mode="contained"
              icon="close"
              buttonColor={c.danger}
              loading={busy}
              disabled={busy}
              onPress={() => decide(false)}
              style={styles.actionBtn}
            >
              Deny
            </Button>
          </View>
        )}
        {cancellable && (
          <Button
            mode="outlined"
            icon="cancel"
            textColor={c.danger}
            loading={busy}
            disabled={busy}
            onPress={() => decide(false)}
            style={styles.cancel}
          >
            Cancel this visit
          </Button>
        )}
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
  avatarFallback: { backgroundColor: c.resident, alignItems: 'center', justifyContent: 'center' },
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
  actions: { flexDirection: 'row', gap: spacing(3) },
  actionBtn: { flex: 1 },
  cancel: { marginTop: spacing(2) },
});

export default VisitorDetailsScreen;
