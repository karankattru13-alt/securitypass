import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Portal, Dialog, Button, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppColors, spacing, radius } from '../theme';

type Tone = 'default' | 'danger' | 'success' | 'warning' | 'info';

interface DialogAction {
  label: string;
  value?: any;
  mode?: 'text' | 'contained' | 'outlined';
  tone?: Tone;
}

interface DialogOpts {
  title: string;
  message?: string;
  tone?: Tone;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  actions?: DialogAction[];
}

let resolver: ((v: any) => void) | null = null;
const listeners = new Set<(o: DialogOpts | null) => void>();
const emit = (o: DialogOpts | null) => listeners.forEach((l) => l(o));

/** Imperative, promise-based replacement for window.alert / window.confirm. */
export function showDialog(opts: DialogOpts): Promise<any> {
  return new Promise((resolve) => {
    resolver = resolve;
    emit(opts);
  });
}

export function appAlert(title: string, message?: string, tone: Tone = 'default') {
  return showDialog({
    title,
    message,
    tone,
    actions: [{ label: 'OK', value: true, mode: 'contained', tone }],
  });
}

export function appConfirm(opts: {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: Tone;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
}): Promise<boolean> {
  return showDialog({
    title: opts.title,
    message: opts.message,
    tone: opts.tone ?? 'default',
    icon: opts.icon,
    actions: [
      { label: opts.cancelLabel ?? 'Cancel', value: false, mode: 'text' },
      {
        label: opts.confirmLabel ?? 'Confirm',
        value: true,
        mode: 'contained',
        tone: opts.tone ?? 'default',
      },
    ],
  }).then((v) => v === true);
}

const defaultIcon = (t?: Tone): keyof typeof MaterialCommunityIcons.glyphMap => {
  switch (t) {
    case 'danger':
      return 'alert-circle-outline';
    case 'success':
      return 'check-circle-outline';
    case 'warning':
      return 'alert-outline';
    case 'info':
      return 'information-outline';
    default:
      return 'help-circle-outline';
  }
};

export const AppDialogHost: React.FC = () => {
  const c = useAppColors();
  const [opts, setOpts] = useState<DialogOpts | null>(null);

  useEffect(() => {
    const l = (o: DialogOpts | null) => setOpts(o);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  const tone = (t?: Tone) =>
    t === 'danger'
      ? c.danger
      : t === 'success'
      ? c.success
      : t === 'warning'
      ? c.warning
      : t === 'info'
      ? c.info
      : c.primary;

  const close = (v: any) => {
    const r = resolver;
    resolver = null;
    setOpts(null);
    r?.(v);
  };

  const actions = opts?.actions ?? [{ label: 'OK', value: true, mode: 'contained' as const }];
  const accent = tone(opts?.tone);
  const icon = opts?.icon ?? defaultIcon(opts?.tone);

  return (
    <Portal>
      <Dialog
        visible={!!opts}
        onDismiss={() => close(undefined)}
        style={[styles.dialog, { backgroundColor: c.card }]}
      >
        <View style={styles.iconWrap}>
          <View style={[styles.iconCircle, { backgroundColor: `${accent}22` }]}>
            <MaterialCommunityIcons name={icon} size={30} color={accent} />
          </View>
        </View>
        <Dialog.Title style={[styles.title, { color: c.text }]}>
          {opts?.title}
        </Dialog.Title>
        {opts?.message ? (
          <Dialog.Content>
            <Text style={[styles.msg, { color: c.muted }]}>{opts.message}</Text>
          </Dialog.Content>
        ) : null}
        <Dialog.Actions style={styles.actions}>
          {actions.map((a, i) => (
            <Button
              key={i}
              mode={a.mode ?? 'text'}
              buttonColor={a.mode === 'contained' ? tone(a.tone ?? opts?.tone) : undefined}
              textColor={a.mode !== 'contained' ? tone(a.tone ?? opts?.tone) : undefined}
              onPress={() => close(a.value)}
              style={styles.btn}
            >
              {a.label}
            </Button>
          ))}
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: { borderRadius: radius.lg, alignSelf: 'center', width: '100%', maxWidth: 420 },
  iconWrap: { alignItems: 'center', marginTop: spacing(6) },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { textAlign: 'center', fontWeight: '800', fontSize: 19 },
  msg: { textAlign: 'center', fontSize: 14, lineHeight: 20 },
  actions: {
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: spacing(2),
    paddingBottom: spacing(3),
  },
  btn: { minWidth: 100 },
});

export default AppDialogHost;
