import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { useAppColors, spacing, radius } from '../theme';

interface Props {
  onAccept: () => void;
  onDeny: () => void;
  onOpen?: () => void;
  acceptLabel?: string;
  denyLabel?: string;
  openLabel?: string;
  loading?: boolean;
  disabled?: boolean;
}

/** Consistent Accept / Deny / (Open) row for every pending-request card. */
const DecisionButtons: React.FC<Props> = ({
  onAccept,
  onDeny,
  onOpen,
  acceptLabel = 'Accept',
  denyLabel = 'Deny',
  openLabel = 'Open',
  loading,
  disabled,
}) => {
  const c = useAppColors();
  return (
    <View style={styles.row}>
      <Button
        mode="contained"
        icon="check-bold"
        buttonColor={c.success}
        textColor="#fff"
        loading={loading}
        disabled={disabled}
        onPress={onAccept}
        style={styles.btn}
        contentStyle={styles.content}
        labelStyle={styles.label}
      >
        {acceptLabel}
      </Button>
      <Button
        mode="contained"
        icon="close-thick"
        buttonColor={c.danger}
        textColor="#fff"
        loading={loading}
        disabled={disabled}
        onPress={onDeny}
        style={styles.btn}
        contentStyle={styles.content}
        labelStyle={styles.label}
      >
        {denyLabel}
      </Button>
      {onOpen ? (
        <Button
          mode="text"
          textColor={c.primary}
          disabled={disabled}
          onPress={onOpen}
          style={styles.openBtn}
          labelStyle={styles.label}
        >
          {openLabel}
        </Button>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing(2),
    marginTop: spacing(3),
  },
  btn: { borderRadius: radius.md, elevation: 0 },
  content: { height: 40, paddingHorizontal: spacing(3) },
  label: { fontSize: 13, fontWeight: '700', letterSpacing: 0.2, marginVertical: 0 },
  openBtn: { borderRadius: radius.md },
});

export default DecisionButtons;
