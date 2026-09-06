import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { List, Card, Divider, Switch, Button, Text } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import Screen from '../../components/Screen';
import AppHeader from '../../components/AppHeader';
import { useAppColors, spacing } from '../../theme';
import { AppDispatch, RootState } from '../../store';
import { setTheme } from '../../store/slices/guiSlice';
import { logout, updateProfile } from '../../store/slices/authSlice';
import api from '../../services/api';
import { appConfirm } from '../../components/AppDialog';

type Pal = ReturnType<typeof useAppColors>;

const SettingsScreen: React.FC<any> = ({ navigation }) => {
  const c = useAppColors();
  const styles = React.useMemo(() => makeStyles(c), [c]);
  const dispatch = useDispatch<AppDispatch>();
  const theme = useSelector((s: RootState) => s.gui.theme);
  const [working, setWorking] = useState(false);

  const resetData = async () => {
    const ok = await appConfirm({
      title: 'Reset demo data?',
      message:
        'This restores all visitors, notifications and passes to their seeded state, then signs you out.',
      confirmLabel: 'Reset',
      tone: 'danger',
      icon: 'database-refresh-outline',
    });
    if (!ok) return;
    setWorking(true);
    try {
      await (api as any).resetData?.();
    } finally {
      setWorking(false);
      dispatch(logout());
    }
  };

  return (
    <Screen padded={false}>
      <AppHeader title="Settings" onBack={() => navigation.goBack()} />
      <View style={styles.body}>
        <Card style={styles.card}>
          <List.Item
            title="Dark theme"
            description={`${theme === 'dark' ? 'On' : 'Off'} · saved to this account`}
            left={(p) => <List.Icon {...p} icon="theme-light-dark" />}
            right={() => (
              <Switch
                value={theme === 'dark'}
                onValueChange={(v) => {
                  const next = v ? 'dark' : 'light';
                  dispatch(setTheme(next));
                  dispatch(updateProfile({ theme: next }));
                }}
              />
            )}
          />
          <Divider />
          <List.Item
            title="Notifications"
            left={(p) => <List.Icon {...p} icon="bell-outline" />}
            right={(p) => <List.Icon {...p} icon="chevron-right" />}
            onPress={() => navigation.navigate('Notifications')}
          />
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Demo data" />
          <Card.Content>
            <Text style={styles.muted}>
              The app runs on an in-memory mock backend. Reset it any time to get a clean set of
              sample data.
            </Text>
          </Card.Content>
          <Card.Actions>
            <Button
              mode="outlined"
              textColor={c.danger}
              loading={working}
              onPress={resetData}
            >
              Reset demo data
            </Button>
          </Card.Actions>
        </Card>

        <Card style={styles.card}>
          <List.Item
            title="About"
            description="SocietyPass Mobile v1.0.0"
            left={(p) => <List.Icon {...p} icon="information-outline" />}
          />
        </Card>
      </View>
    </Screen>
  );
};

const makeStyles = (c: Pal) =>
  StyleSheet.create({
  body: { padding: spacing(4) },
  card: { marginBottom: spacing(4), backgroundColor: c.card },
  muted: { color: c.muted, fontSize: 13 },
});

export default SettingsScreen;
