import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, Avatar, Tooltip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import StatusPill from './StatusPill';
import { useAppColors, spacing } from '../theme';
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
  const c = useAppColors();
  const name = visitor.name || visitor.visitor_name || 'Visitor';

  const body = (
    <Card style={[styles.card, { backgroundColor: c.card }]} onPress={onPress}>
      <Card.Content style={styles.row}>
        <Avatar.Icon
          size={44}
          icon={typeIcon[visitor.type || 'guest'] || 'account'}
          style={{ backgroundColor: c.primary }}
          color="#fff"
        />
        <View style={styles.info}>
          <Text style={[styles.name, { color: c.text }]}>{name}</Text>
          <Text style={[styles.meta, { color: c.muted }]}>
            {visitor.flat}
            {visitor.purpose ? ` • ${visitor.purpose}` : ''}
          </Text>
          <Text style={[styles.time, { color: c.muted }]}>
            {smartDate(visitor.entry_time || visitor.requested_at)}
          </Text>
        </View>
        <StatusPill status={visitor.status} />
      </Card.Content>
    </Card>
  );

  return onPress ? <Tooltip title="View details">{body}</Tooltip> : body;
};

const styles = StyleSheet.create({
  card: { marginBottom: spacing(3) },
  row: { flexDirection: 'row', alignItems: 'center' },
  info: { flex: 1, marginLeft: spacing(3) },
  name: { fontSize: 15, fontWeight: '700' },
  meta: { fontSize: 13, marginTop: 2 },
  time: { fontSize: 11, marginTop: 2 },
});

export default VisitorCard;
