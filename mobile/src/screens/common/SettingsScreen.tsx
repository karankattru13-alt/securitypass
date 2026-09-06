import React, { useState } from 'react';
import { View, StyleSheet, Alert, Platform } from 'react-native';
import { List, Card, Divider, Switch, Button, Text } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import Screen from '../../components/Screen';
import AppHeader from '../../components/AppHeader';
import { colors, spacing } from '../../theme';
import { AppDispatch, RootState } from '../../store';
import { setTheme } from '../../store/slices/guiSlice';
import { logout } from '../../store/slices/authSlice';
import api from '../../services/api';

const confirm = (title: string, message: string, onYes: () => void) => {
  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-alert
    if (window.confirm(`${title}\n\n${message}`)) onYes();
  } else {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', style: 'destructive', onPress: onYes },
    ]);
  }
};

const SettingsScreen: React.FC<any> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const theme = useSelector((s: RootState) => s.gui.theme);
  const [working, setWorking] = useState(false);

  const resetData = () => {
    confirm(
      'Reset demo data',
      'This restores all visitors, notifications and passes to their seeded state, then signs you out.',
      async () => {
        setWorking(true);
        try {
          await (api as any).resetData?.();
        } finally {
          setWorking(false);
          dispatch(logout());
        }
      }
    );
  };

  return (
    <Screen padded={false}>
      <AppHeader title="Settings" onBack={() => navigation.goBack()} />
      <View style={styles.body}>
        <Card style={styles.card}>
          <List.Item
            title="Dark theme"
            description="Applies on next launch"
            left={(p) => <List.Icon {...p} icon="theme-light-dark" />}
            right={() => (
              <Switch
                value={theme === 'dark'}
                onValueChange={(v) => {
                  dispatch(setTheme(v ? 'dark' : 'light'));
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
              textColor={colors.danger}
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

const styles = StyleSheet.create({
  body: { padding: spacing(4) },
  card: { marginBottom: spacing(4), backgroundColor: colors.card },
  muted: { color: colors.muted, fontSize: 13 },
});

export default SettingsScreen;
