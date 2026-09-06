import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import StatusPill from './StatusPill';
import { colors, spacing } from '../theme';
import { smartDate } from '../utils/format';

const typeIcon: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  guest: 'account',
  delivery: 'package-variant-closed',
  staff: 'toolbox-outline',
  cab: 'car',
};

interface VisitorLike {
  id: number;
  name?: string;
  visitor_name?: string;
  flat?: string;
  purpose?: string;
  type?: string;
  status?: string;
  requested_at?: string;
  entry_time?: string | null;
}

const VisitorCard: React.FC<{ visitor: VisitorLike; onPress?: () => void }> = ({
  visitor,
  onPress,
}) => {
  const name = visitor.name || visitor.visitor_name || 'Visitor';
  return (
    <Card style={styles.card} onPress={onPress}>
      <Card.Content style={styles.row}>
        <Avatar.Icon
          size={44}
          icon={typeIcon[visitor.type || 'guest'] || 'account'}
          style={styles.avatar}
          color="#fff"
        />
        <View style={styles.info}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.meta}>
            {visitor.flat}
            {visitor.purpose ? ` • ${visitor.purpose}` : ''}
          </Text>
          <Text style={styles.time}>
            {smartDate(visitor.entry_time || visitor.requested_at)}
          </Text>
        </View>
        <StatusPill status={visitor.status} />
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { marginBottom: spacing(3), backgroundColor: colors.card },
  row: { flexDirection: 'row', alignItems: 'center' },
  avatar: { backgroundColor: colors.primary },
  info: { flex: 1, marginLeft: spacing(3) },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  meta: { fontSize: 13, color: colors.muted, marginTop: 2 },
  time: { fontSize: 11, color: colors.muted, marginTop: 2 },
});

export default VisitorCard;
