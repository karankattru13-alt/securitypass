import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Menu, Button, Text, ActivityIndicator } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useAppColors, spacing, radius } from '../theme';
import { AppDispatch, RootState } from '../store';
import { setSociety } from '../store/slices/authSlice';
import api from '../services/api';

interface Props {
  label?: string;
  /** Renders without the label line. */
  compact?: boolean;
}

const SocietySelect: React.FC<Props> = ({ label = 'Society / Building', compact }) => {
  const c = useAppColors();
  const styles = React.useMemo(() => makeStyles(c), [c]);
  const dispatch = useDispatch<AppDispatch>();
  const societyId = useSelector((s: RootState) => s.auth.user?.society_id);

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    api
      .getSocieties()
      .then((r) => active && setItems(r.data))
      .catch(() => active && setItems([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const current = items.find((s) => s.id === societyId);
  const title = current
    ? `${current.name}${current.city ? ` · ${current.city}` : ''}`
    : loading
    ? 'Loading…'
    : items.length
    ? 'Select a society / building'
    : 'No societies yet';

  const pick = async (id: number) => {
    setOpen(false);
    if (id === societyId) return;
    setSaving(true);
    try {
      await dispatch(setSociety(id)).unwrap();
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.wrap}>
      {!compact && <Text style={styles.label}>{label}</Text>}
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
            loading={saving}
            disabled={saving || (!loading && items.length === 0)}
            onPress={() => setOpen(true)}
          >
            <Text style={styles.btnText} numberOfLines={1}>
              {title}
            </Text>
          </Button>
        }
      >
        {loading ? (
          <ActivityIndicator style={{ margin: spacing(3) }} />
        ) : (
          items.map((s) => (
            <Menu.Item
              key={s.id}
              onPress={() => pick(s.id)}
              title={`${s.name}${s.city ? ` · ${s.city}` : ''}`}
              leadingIcon={
                s.id === societyId ? 'check' : s.type === 'building' ? 'domain' : 'city'
              }
            />
          ))
        )}
      </Menu>
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
  });

export default SocietySelect;
