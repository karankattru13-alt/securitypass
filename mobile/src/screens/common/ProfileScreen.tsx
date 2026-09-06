import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Avatar, Card, List, Button, Divider } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import Screen from '../../components/Screen';
import AppHeader from '../../components/AppHeader';
import { colors, spacing, roleColor, prettyStatus } from '../../theme';
import { initials } from '../../utils/format';
import { AppDispatch, RootState } from '../../store';
import { logout } from '../../store/slices/authSlice';

const ProfileScreen: React.FC<any> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((s: RootState) => s.auth);
  const unread = useSelector((s: RootState) => s.notification.unreadCount);
  if (!user) return null;
  const accent = roleColor(user.role);

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
          buttonColor={colors.danger}
          icon="logout"
          style={styles.logout}
          onPress={() => dispatch(logout())}
        >
          Sign Out
        </Button>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  body: { padding: spacing(4) },
  card: { marginBottom: spacing(4), backgroundColor: colors.card },
  userRow: { flexDirection: 'row', alignItems: 'center' },
  userInfo: { marginLeft: spacing(4), flex: 1 },
  name: { fontSize: 18, fontWeight: '800', color: colors.text },
  meta: { fontSize: 13, color: colors.muted, marginTop: 2 },
  role: { fontSize: 13, fontWeight: '700', marginTop: 4 },
  logout: { marginTop: spacing(2) },
});

export default ProfileScreen;
