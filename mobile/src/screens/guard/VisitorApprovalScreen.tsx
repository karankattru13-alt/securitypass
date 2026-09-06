import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Text, Button, TextInput, ActivityIndicator, Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../../components/Screen';
import AppHeader from '../../components/AppHeader';
import StatusPill from '../../components/StatusPill';
import { colors, spacing, radius } from '../../theme';
import { smartDate } from '../../utils/format';
import api from '../../services/api';

const Row = ({ icon, label, value }: any) => (
  <View style={styles.row}>
    <MaterialCommunityIcons name={icon} size={18} color={colors.muted} />
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue}>{value || '—'}</Text>
  </View>
);

const VisitorApprovalScreen: React.FC<any> = ({ navigation, route }) => {
  const visitorId: number = route.params?.visitorId;
  const [visitor, setVisitor] = useState<any>(null);
  const [remarks, setRemarks] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => api.getVisitor(visitorId).then((r) => setVisitor(r.data));
  useEffect(() => {
    load();
  }, [visitorId]);

  const decide = async (approve: boolean) => {
    setBusy(true);
    try {
      const r = approve
        ? await api.approveVisitor(visitorId, remarks.trim() || undefined)
        : await api.denyVisitor(visitorId, remarks.trim() || undefined);
      setVisitor(r.data);
    } finally {
      setBusy(false);
    }
  };

  const markEntry = async () => {
    setBusy(true);
    try {
      await api.markVisitorEntered(visitorId);
      navigation.navigate('GuardApp', { screen: 'GuardHome' });
    } finally {
      setBusy(false);
    }
  };

  if (!visitor) {
    return (
      <Screen>
        <ActivityIndicator style={{ marginTop: spacing(12) }} color={colors.primary} />
      </Screen>
    );
  }

  const decided = visitor.approval_status !== 'pending';
  const approved = visitor.approval_status === 'approved';

  return (
    <Screen padded={false}>
      <AppHeader
        title="Visitor Approval"
        subtitle={`Flat ${visitor.flat}`}
        color={colors.guard}
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
            {visitor.remarks ? (
              <Row icon="comment-text-outline" label="Remarks" value={visitor.remarks} />
            ) : null}
          </Card.Content>
        </Card>

        {!decided && (
          <TextInput
            label="Remarks (optional)"
            value={remarks}
            onChangeText={setRemarks}
            multiline
            style={styles.input}
          />
        )}

        {!decided ? (
          <View style={styles.actions}>
            <Button
              mode="contained"
              icon="check"
              buttonColor={colors.success}
              onPress={() => decide(true)}
              loading={busy}
              disabled={busy}
              style={styles.actionBtn}
            >
              Approve
            </Button>
            <Button
              mode="contained"
              icon="close"
              buttonColor={colors.danger}
              onPress={() => decide(false)}
              loading={busy}
              disabled={busy}
              style={styles.actionBtn}
            >
              Deny
            </Button>
          </View>
        ) : approved && visitor.status !== 'entered' ? (
          <Button
            mode="contained"
            icon="login-variant"
            buttonColor={colors.guard}
            onPress={markEntry}
            loading={busy}
            disabled={busy}
            style={styles.next}
          >
            Mark Entry & Open Gate
          </Button>
        ) : (
          <Button mode="outlined" onPress={() => navigation.goBack()} style={styles.next}>
            Done
          </Button>
        )}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  body: { padding: spacing(4) },
  card: { backgroundColor: colors.card, marginBottom: spacing(4) },
  head: { flexDirection: 'row', marginBottom: spacing(3) },
  avatar: { width: 72, height: 72, borderRadius: radius.md, backgroundColor: colors.border },
  avatarFallback: { backgroundColor: colors.guard, alignItems: 'center', justifyContent: 'center' },
  headInfo: { flex: 1, marginLeft: spacing(3), justifyContent: 'center' },
  name: { fontSize: 18, fontWeight: '800', color: colors.text },
  sub: { fontSize: 13, color: colors.muted, marginTop: 2, marginBottom: spacing(2) },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing(2),
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rowLabel: { marginLeft: spacing(2), color: colors.muted, width: 90, fontSize: 13 },
  rowValue: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '600' },
  input: { backgroundColor: colors.card, marginBottom: spacing(4) },
  actions: { flexDirection: 'row', gap: spacing(3) },
  actionBtn: { flex: 1 },
  next: { marginTop: spacing(2), paddingVertical: spacing(1) },
});

export default VisitorApprovalScreen;
