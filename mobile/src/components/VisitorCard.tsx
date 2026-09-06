import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, Avatar, Tooltip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import StatusPill from './StatusPill';
import DecisionButtons from './DecisionButtons';
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
  approval_status?: string;
  requested_at?: string;
  entry_time?: string | null;
  created_by_name?: string;
}

interface Props {
  visitor: VisitorLike;
  onPress?: () => void;
  /** When provided and the visitor is still pending, inline Accept / Deny show. */
  onDecide?: (approve: boolean) => void;
  deciding?: boolean;
}

const VisitorCard: React.FC<Props> = ({ visitor, onPress, onDecide, deciding }) => {
  const c = useAppColors();
  const styles = React.useMemo(() => makeStyles(c), [c]);
  const name = visitor.name || visitor.visitor_name || 'Visitor';
  const pending = visitor.approval_status === 'pending' || visitor.status === 'waiting';

  const body = (
    <Card style={styles.card} onPress={onPress}>
      <Card.Content>
        <View style={styles.row}>
          <Avatar.Icon
            size={44}
            icon={typeIcon[visitor.type || 'guest'] || 'account'}
            style={{ backgroundColor: c.primary }}
            color="#fff"
          />
          <View style={styles.info}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.meta}>
              {visitor.flat}
              {visitor.purpose ? ` • ${visitor.purpose}` : ''}
            </Text>
            <Text style={styles.time}>
              {visitor.created_by_name ? `by ${visitor.created_by_name} • ` : ''}
              {smartDate(visitor.entry_time || visitor.requested_at)}
            </Text>
          </View>
          <StatusPill status={visitor.status} />
        </View>

        {onDecide && pending ? (
          <DecisionButtons
            loading={deciding}
            disabled={deciding}
            onAccept={() => onDecide(true)}
            onDeny={() => onDecide(false)}
          />
        ) : null}
      </Card.Content>
    </Card>
  );

  return onPress && !onDecide ? <Tooltip title="View details">{body}</Tooltip> : body;
};

const makeStyles = (c: ReturnType<typeof useAppColors>) =>
  StyleSheet.create({
    card: {
      marginBottom: spacing(3),
      backgroundColor: c.card,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    row: { flexDirection: 'row', alignItems: 'center' },
    info: { flex: 1, marginLeft: spacing(3) },
    name: { fontSize: 15, fontWeight: '700', color: c.text },
    meta: { fontSize: 13, color: c.muted, marginTop: 2 },
    time: { fontSize: 11, color: c.muted, marginTop: 2 },
  });

export default VisitorCard;
