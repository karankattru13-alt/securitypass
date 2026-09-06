import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TextInput, Button, Card, ActivityIndicator } from 'react-native-paper';
import { useSelector } from 'react-redux';
import QRView from '../../components/QRView';
import Screen from '../../components/Screen';
import AppHeader from '../../components/AppHeader';
import { useAppColors, spacing, radius } from '../../theme';
import { smartDate } from '../../utils/format';
import { RootState } from '../../store';
import api from '../../services/api';

type Pal = ReturnType<typeof useAppColors>;

const QRPassGeneratorScreen: React.FC<any> = ({ navigation }) => {
  const c = useAppColors();
  const styles = React.useMemo(() => makeStyles(c), [c]);
  const { user } = useSelector((s: RootState) => s.auth);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [purpose, setPurpose] = useState('');
  const [hours, setHours] = useState('6');
  const [pass, setPass] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const validHours = Math.max(1, parseInt(hours, 10) || 6);
      const r = await api.createQRPass({
        visitor_name: name.trim(),
        phone: phone.trim(),
        purpose: purpose.trim() || 'Visit',
        flat: user?.flat,
        valid_from: new Date().toISOString(),
        valid_to: new Date(Date.now() + validHours * 3600 * 1000).toISOString(),
      });
      setPass(r.data);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setPass(null);
    setName('');
    setPhone('');
    setPurpose('');
    setHours('6');
  };

  return (
    <Screen padded={false}>
      <AppHeader
        title="QR Gate Pass"
        subtitle="Share with your visitor"
        color={c.resident}
        onBack={() => navigation.goBack()}
      />
      <View style={styles.body}>
        {loading ? (
          <ActivityIndicator color={c.resident} style={{ marginTop: spacing(12) }} />
        ) : pass ? (
          <Card style={styles.passCard}>
            <Card.Content style={styles.passContent}>
              <View style={styles.qrWrap}>
                <QRView value={pass.token} size={200} />
              </View>
              <Text style={styles.token}>{pass.token}</Text>
              <Text style={styles.passName}>{pass.visitor_name}</Text>
              <Text style={styles.passMeta}>
                {pass.purpose} • Flat {pass.flat}
              </Text>
              <Text style={styles.passValid}>Valid until {smartDate(pass.valid_to)}</Text>
              <Button
                mode="contained"
                buttonColor={c.resident}
                onPress={reset}
                style={styles.again}
              >
                Create Another
              </Button>
            </Card.Content>
          </Card>
        ) : (
          <>
            <TextInput
              label="Visitor name *"
              value={name}
              onChangeText={setName}
              left={<TextInput.Icon icon="account" />}
              style={styles.input}
            />
            <TextInput
              label="Phone"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={10}
              left={<TextInput.Icon icon="phone" />}
              style={styles.input}
            />
            <TextInput
              label="Purpose"
              value={purpose}
              onChangeText={setPurpose}
              left={<TextInput.Icon icon="text" />}
              style={styles.input}
            />
            <TextInput
              label="Valid for (hours)"
              value={hours}
              onChangeText={setHours}
              keyboardType="number-pad"
              left={<TextInput.Icon icon="clock-outline" />}
              style={styles.input}
            />
            <Button
              mode="contained"
              icon="qrcode"
              buttonColor={c.resident}
              onPress={generate}
              style={styles.button}
            >
              Generate Pass
            </Button>
          </>
        )}
      </View>
    </Screen>
  );
};

const makeStyles = (c: Pal) =>
  StyleSheet.create({
  body: { padding: spacing(4) },
  input: { marginBottom: spacing(3), backgroundColor: c.card },
  button: { marginTop: spacing(2), paddingVertical: spacing(1) },
  passCard: { backgroundColor: c.card },
  passContent: { alignItems: 'center' },
  qrWrap: {
    padding: spacing(4),
    backgroundColor: '#fff',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.border,
    marginVertical: spacing(3),
  },
  token: { fontSize: 16, fontWeight: '800', letterSpacing: 1, color: c.text },
  passName: { fontSize: 16, fontWeight: '700', color: c.text, marginTop: spacing(3) },
  passMeta: { fontSize: 13, color: c.muted, marginTop: 2 },
  passValid: { fontSize: 12, color: c.warning, marginTop: spacing(2), fontWeight: '600' },
  again: { marginTop: spacing(5), alignSelf: 'stretch' },
});

export default QRPassGeneratorScreen;
