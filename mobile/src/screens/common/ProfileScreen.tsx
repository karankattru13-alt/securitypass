import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  Avatar,
  Card,
  List,
  Button,
  Divider,
  Portal,
  Dialog,
  TextInput,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import Screen from '../../components/Screen';
import AppHeader from '../../components/AppHeader';
import { useAppColors, spacing, roleColor, prettyStatus } from '../../theme';
import { initials } from '../../utils/format';
import { AppDispatch, RootState } from '../../store';
import { logout, updateProfile } from '../../store/slices/authSlice';

type Pal = ReturnType<typeof useAppColors>;

const ProfileScreen: React.FC<any> = ({ navigation }) => {
  const c = useAppColors();
  const styles = React.useMemo(() => makeStyles(c), [c]);
  const dispatch = useDispatch<AppDispatch>();
  const { user, loading } = useSelector((s: RootState) => s.auth);
  const unread = useSelector((s: RootState) => s.notification.unreadCount);
  const [editing, setEditing] = useState(false);
  const [flatInput, setFlatInput] = useState('');

  if (!user) return null;
  const accent = roleColor(user.role, c);
  const isResident = user.role === 'resident' || user.role === 'staff';

  const openEdit = () => {
    setFlatInput(user.flat ?? '');
    setEditing(true);
  };

  const saveFlat = async () => {
    await dispatch(updateProfile({ flat: flatInput.trim().toUpperCase() }));
    setEditing(false);
  };

  return (
    <Screen padded={false}>
      <AppHeader title="Profile" color={accent} icon="account-circle" />
      <View style={styles.body}>
        <Card style={styles.card}>
          <Card.Content style={styles.userRow}>
            <Avatar.Text
              size={64}
              label={initials(user.first_name, user.last_name)}
              style={{ backgroundColor: accent }}
            />
            <View style={styles.userInfo}>
              <Text style={styles.name}>
                {user.first_name} {user.last_name}
              </Text>
              <Text style={styles.meta}>{user.phone}</Text>
              <Text style={[styles.role, { color: accent }]}>
                {prettyStatus(user.role)}
                {user.flat ? ` • ${user.flat}` : ''}
              </Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          {isResident && (
            <>
              <List.Item
                title="House / Flat number"
                description={user.flat ? user.flat : 'Not set — tap to add'}
                left={(p) => <List.Icon {...p} icon="home-outline" />}
                right={(p) => <List.Icon {...p} icon="pencil" />}
                onPress={openEdit}
              />
              <Divider />
            </>
          )}
          <List.Item
            title="Notifications"
            description={unread ? `${unread} unread` : 'All caught up'}
            left={(p) => <List.Icon {...p} icon="bell-outline" />}
            right={(p) => <List.Icon {...p} icon="chevron-right" />}
            onPress={() => navigation.navigate('Notifications')}
          />
          <Divider />
          <List.Item
            title="Settings"
            description="Theme, data, about"
            left={(p) => <List.Icon {...p} icon="cog-outline" />}
            right={(p) => <List.Icon {...p} icon="chevron-right" />}
            onPress={() => navigation.navigate('Settings')}
          />
          <Divider />
          <List.Item
            title="Email"
            description={user.email || 'Not set'}
            left={(p) => <List.Icon {...p} icon="email-outline" />}
          />
        </Card>

        <Button
          mode="contained"
          buttonColor={c.danger}
          icon="logout"
          style={styles.logout}
          onPress={() => dispatch(logout())}
        >
          Sign Out
        </Button>
      </View>

      <Portal>
        <Dialog visible={editing} onDismiss={() => setEditing(false)}>
          <Dialog.Title>House / Flat number</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="e.g. A-1203"
              value={flatInput}
              onChangeText={setFlatInput}
              autoCapitalize="characters"
              autoFocus
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setEditing(false)}>Cancel</Button>
            <Button
              mode="contained"
              loading={loading}
              disabled={loading || !flatInput.trim()}
              onPress={saveFlat}
            >
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Screen>
  );
};

const makeStyles = (c: Pal) =>
  StyleSheet.create({
  body: { padding: spacing(4) },
  card: { marginBottom: spacing(4), backgroundColor: c.card },
  userRow: { flexDirection: 'row', alignItems: 'center' },
  userInfo: { marginLeft: spacing(4), flex: 1 },
  name: { fontSize: 18, fontWeight: '800', color: c.text },
  meta: { fontSize: 13, color: c.muted, marginTop: 2 },
  role: { fontSize: 13, fontWeight: '700', marginTop: 4 },
  logout: { marginTop: spacing(2) },
});

export default ProfileScreen;
