import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Portal,
  Dialog,
  Button,
  TextInput,
  HelperText,
  Text,
  Chip,
} from 'react-native-paper';
import { useAppColors, spacing, radius } from '../theme';
import { appConfirm } from './AppDialog';

export interface FormField {
  key: string;
  label: string;
  type?: 'text' | 'phone' | 'email' | 'number' | 'select';
  options?: { value: string; label: string }[];
  required?: boolean;
  autoCapitalize?: 'none' | 'characters' | 'words' | 'sentences';
  placeholder?: string;
}

interface Props {
  visible: boolean;
  title: string;
  fields: FormField[];
  initial?: Record<string, any>;
  submitLabel?: string;
  accent?: string;
  onSubmit: (values: Record<string, string>) => Promise<void> | void;
  onDismiss: () => void;
  /** Provide to show a Delete button (edit mode). */
  onDelete?: () => Promise<void> | void;
  deleteConfirm?: { title: string; message: string };
}

const kbType = (t?: string) =>
  t === 'phone' ? 'phone-pad' : t === 'email' ? 'email-address' : t === 'number' ? 'number-pad' : 'default';

const EntityFormDialog: React.FC<Props> = ({
  visible,
  title,
  fields,
  initial,
  submitLabel = 'Save',
  accent,
  onSubmit,
  onDismiss,
  onDelete,
  deleteConfirm,
}) => {
  const c = useAppColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const tint = accent ?? c.primary;

  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const seed: Record<string, string> = {};
    fields.forEach((f) => {
      const v = initial?.[f.key];
      seed[f.key] = v === undefined || v === null ? '' : String(v);
    });
    setValues(seed);
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const set = (k: string, v: string) => setValues((s) => ({ ...s, [k]: v }));

  const submit = async () => {
    const missing = fields.find((f) => f.required && !String(values[f.key] || '').trim());
    if (missing) {
      setError(`${missing.label} is required.`);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await onSubmit(values);
      onDismiss();
    } catch (e: any) {
      setError(typeof e === 'string' ? e : e?.message || 'Could not save.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    const ok = await appConfirm({
      title: deleteConfirm?.title ?? 'Delete this record?',
      message: deleteConfirm?.message ?? 'This cannot be undone.',
      confirmLabel: 'Delete',
      tone: 'danger',
      icon: 'trash-can-outline',
    });
    if (!ok) return;
    setBusy(true);
    try {
      await onDelete?.();
      onDismiss();
    } catch (e: any) {
      setError(typeof e === 'string' ? e : e?.message || 'Could not delete.');
      setBusy(false);
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={[styles.dialog, { backgroundColor: c.card }]}>
        <Dialog.Title style={{ color: c.text }}>{title}</Dialog.Title>
        <Dialog.ScrollArea style={styles.scrollArea}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            {fields.map((f) =>
              f.type === 'select' ? (
                <View key={f.key} style={styles.selectWrap}>
                  <Text style={[styles.selectLabel, { color: c.muted }]}>{f.label}</Text>
                  <View style={styles.chips}>
                    {(f.options || []).map((o) => (
                      <Chip
                        key={o.value}
                        selected={values[f.key] === o.value}
                        showSelectedCheck={false}
                        onPress={() => set(f.key, o.value)}
                        style={styles.chip}
                      >
                        {o.label}
                      </Chip>
                    ))}
                  </View>
                </View>
              ) : (
                <TextInput
                  key={f.key}
                  label={f.label + (f.required ? ' *' : '')}
                  value={values[f.key] ?? ''}
                  onChangeText={(v) => set(f.key, v)}
                  mode="outlined"
                  keyboardType={kbType(f.type) as any}
                  autoCapitalize={f.autoCapitalize ?? (f.type === 'email' ? 'none' : 'sentences')}
                  placeholder={f.placeholder}
                  style={styles.input}
                />
              )
            )}
            {error ? (
              <HelperText type="error" visible>
                {error}
              </HelperText>
            ) : null}
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions style={styles.actions}>
          {onDelete ? (
            <Button textColor={c.danger} disabled={busy} onPress={remove} style={styles.leftBtn}>
              Delete
            </Button>
          ) : null}
          <Button disabled={busy} onPress={onDismiss}>
            Cancel
          </Button>
          <Button mode="contained" buttonColor={tint} loading={busy} disabled={busy} onPress={submit}>
            {submitLabel}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const makeStyles = (c: ReturnType<typeof useAppColors>) =>
  StyleSheet.create({
    dialog: { borderRadius: radius.lg, alignSelf: 'center', width: '100%', maxWidth: 460 },
    scrollArea: { paddingHorizontal: 0, borderColor: c.border },
    scroll: { padding: spacing(4), paddingTop: spacing(2) },
    input: { marginBottom: spacing(3), backgroundColor: c.card },
    selectWrap: { marginBottom: spacing(3) },
    selectLabel: { fontSize: 12, marginBottom: spacing(2) },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2) },
    chip: {},
    actions: { flexWrap: 'wrap', justifyContent: 'flex-end' },
    leftBtn: { marginRight: 'auto' },
  });

export default EntityFormDialog;
