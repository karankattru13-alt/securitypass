import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Text, Button, TextInput, ActivityIndicator, Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../../components/Screen';
import AppHeader from '../../components/AppHeader';
import StatusPill from '../../components/StatusPill';
import { useAppColors, spacing, radius } from '../../theme';
import { smartDate } from '../../utils/format';
import api from '../../services/api';
import {
  buildRequestMessage,
  notifyResidentOnWhatsApp,
} from '../../utils/whatsapp';

type Pal = ReturnType<typeof useAppColors>;


const VisitorApprovalScreen: React.FC<any> = ({ navigation, route }) => {
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
        <ActivityIndicator style={{ marginTop: spacing(12) }} color={c.primary} />
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
          <>
            <View style={styles.actions}>
              <Button
                mode="contained"
                icon="check"
                buttonColor={c.success}
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
                buttonColor={c.danger}
                onPress={() => decide(false)}
                loading={busy}
                disabled={busy}
                style={styles.actionBtn}
              >
                Deny
              </Button>
            </View>
            {visitor.resident_phone ? (
              <Button
                mode="contained-tonal"
                icon="whatsapp"
                disabled={busy}
                onPress={() =>
                  notifyResidentOnWhatsApp(
                    visitor.resident_phone,
                    buildRequestMessage({
                      visitorId: visitor.id,
                      visitorName: visitor.name,
                      purpose: visitor.purpose,
                      flat: visitor.flat,
                      guardName: visitor.created_by_name,
                    })
                  )
                }
                style={styles.next}
              >
                Send WhatsApp to {visitor.resident_name || 'resident'}
              </Button>
            ) : null}
            <Button
              mode="outlined"
              icon="account-arrow-right-outline"
              disabled={busy}
              onPress={() =>
                navigation.navigate('GuardApp', { screen: 'GuardHome' })
              }
              style={styles.next}
            >
              Let the resident decide
            </Button>
            <Text style={styles.hint}>
              Leaves the request pending. The resident is asked to approve on
              WhatsApp and in the app, and it stays on your Home screen with
              Accept / Deny in case you need to act.
            </Text>
          </>
        ) : approved && visitor.status !== 'entered' ? (
          <Button
            mode="contained"
            icon="login-variant"
            buttonColor={c.guard}
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
  input: { backgroundColor: c.card, marginBottom: spacing(4) },
  actions: { flexDirection: 'row', gap: spacing(3) },
  actionBtn: { flex: 1 },
  next: { marginTop: spacing(3), paddingVertical: spacing(1) },
  hint: { fontSize: 12, color: c.muted, marginTop: spacing(2) },
});

export default VisitorApprovalScreen;
