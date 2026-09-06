import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, ActivityIndicator, Badge } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../../components/Screen';
import AppHeader from '../../components/AppHeader';
import EmptyState from '../../components/EmptyState';
import { useAppColors, spacing } from '../../theme';
import { timeAgo } from '../../utils/format';
import { AppDispatch, RootState } from '../../store';
import {
  fetchNotifications,
  markNotificationRead,
  Notification,
} from '../../store/slices/notificationSlice';

type Pal = ReturnType<typeof useAppColors>;

const iconFor = (type: string): keyof typeof MaterialCommunityIcons.glyphMap => {
  if (type.includes('approved')) return 'check-circle-outline';
  if (type.includes('denied')) return 'close-circle-outline';
  if (type.includes('visitor')) return 'account-clock-outline';
  if (type.includes('announcement')) return 'bullhorn-outline';
  return 'bell-outline';
};

const NotificationsScreen: React.FC<any> = ({ navigation }) => {
  const c = useAppColors();
  const styles = React.useMemo(() => makeStyles(c), [c]);
  const dispatch = useDispatch<AppDispatch>();
  const { notifications, loading, unreadCount } = useSelector(
    (s: RootState) => s.notification
  );
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchNotifications(30));
    setRefreshing(false);
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <Screen padded={false} refreshing={refreshing} onRefresh={load}>
      <AppHeader
        title="Notifications"
        subtitle={unreadCount ? `${unreadCount} unread` : 'All caught up'}
        onBack={() => navigation.goBack()}
      />
      <View style={styles.body}>
        {loading && notifications.length === 0 ? (
          <ActivityIndicator style={{ marginTop: spacing(10) }} color={c.primary} />
        ) : notifications.length === 0 ? (
          <EmptyState icon="bell-sleep-outline" title="No notifications yet" />
        ) : (
          notifications.map((n: Notification) => (
            <Card
              key={n.id}
              style={[styles.card, !n.is_read && styles.unread]}
              onPress={() => !n.is_read && dispatch(markNotificationRead(n.id))}
            >
              <Card.Content style={styles.row}>
                <MaterialCommunityIcons
                  name={iconFor(n.type)}
                  size={26}
                  color={n.is_read ? c.muted : c.primary}
                />
                <View style={styles.content}>
                  <Text style={styles.title}>{n.title}</Text>
                  <Text style={styles.message}>{n.message}</Text>
                  <Text style={styles.time}>{timeAgo(n.created_at)}</Text>
                </View>
                {!n.is_read && <Badge style={{ backgroundColor: c.primary }} size={10} />}
              </Card.Content>
            </Card>
          ))
        )}
      </View>
    </Screen>
  );
};

const makeStyles = (c: Pal) =>
  StyleSheet.create({
  body: { padding: spacing(4) },
  card: { marginBottom: spacing(3), backgroundColor: c.card },
  unread: { backgroundColor: c.cardAlt },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  content: { flex: 1, marginLeft: spacing(3) },
  title: { fontSize: 15, fontWeight: '700', color: c.text },
  message: { fontSize: 13, color: c.muted, marginTop: 2 },
  time: { fontSize: 11, color: c.muted, marginTop: 4 },
});

export default NotificationsScreen;
