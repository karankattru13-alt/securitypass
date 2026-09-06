import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Menu, Button, Text, HelperText } from 'react-native-paper';
import { useAppColors, spacing, radius } from '../theme';
import api from '../services/api';

interface Props {
  value: number | null;
  onChange: (id: number) => void;
  label?: string;
  disabled?: boolean;
  /** Shown when there are no societies to pick. */
  emptyHint?: string;
  /** Reports how many societies are available (for form validation). */
  onCount?: (n: number) => void;
}

/** Presentational (no redux) society/building dropdown — used at sign-up. */
const SocietyPicker: React.FC<Props> = ({
  value,
  onChange,
  label = 'Society / Building',
  disabled,
  emptyHint = 'No societies yet — you can pick one later in Profile.',
  onCount,
}) => {
  const c = useAppColors();
  const styles = React.useMemo(() => makeStyles(c), [c]);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .getSocieties()
      .then((r) => {
        if (!active) return;
        setItems(r.data);
        onCount?.(r.data.length);
      })
      .catch(() => {
        if (!active) return;
        setItems([]);
        onCount?.(0);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = items.find((s) => s.id === value);
  const title = current
    ? `${current.name}${current.city ? ` · ${current.city}` : ''}`
    : loading
    ? 'Loading…'
    : items.length
    ? 'Select a society / building'
    : 'None available yet';

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Menu
        visible={open}
        onDismiss={() => setOpen(false)}
        anchor={
          <Button
            mode="outlined"
            icon="office-building-marker-outline"
            contentStyle={styles.btnContent}
            style={styles.btn}
            textColor={c.text}
            disabled={disabled || loading || items.length === 0}
            onPress={() => setOpen(true)}
          >
            <Text style={styles.btnText} numberOfLines={1}>
              {title}
            </Text>
          </Button>
        }
      >
        {items.map((s) => (
          <Menu.Item
            key={s.id}
            onPress={() => {
              onChange(s.id);
              setOpen(false);
            }}
            title={`${s.name}${s.city ? ` · ${s.city}` : ''}`}
            leadingIcon={
              s.id === value ? 'check' : s.type === 'building' ? 'domain' : 'city'
            }
          />
        ))}
      </Menu>
      {!loading && items.length === 0 ? (
        <HelperText type="info" visible style={styles.hint}>
          {emptyHint}
        </HelperText>
      ) : null}
    </View>
  );
};

const makeStyles = (c: ReturnType<typeof useAppColors>) =>
  StyleSheet.create({
    wrap: { marginBottom: spacing(3) },
    label: { fontSize: 12, color: c.muted, marginBottom: spacing(2) },
    btn: { borderRadius: radius.md, borderColor: c.border },
    btnContent: { flexDirection: 'row-reverse', height: 44, justifyContent: 'space-between' },
    btnText: { color: c.text, fontWeight: '600', fontSize: 13 },
    hint: { paddingHorizontal: 0 },
  });

export default SocietyPicker;
