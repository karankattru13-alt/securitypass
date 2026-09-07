import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { TextInput } from 'react-native-paper';
import { useAppColors, spacing, radius } from '../theme';

type PaperInputProps = React.ComponentProps<typeof TextInput>;

interface Props extends Omit<PaperInputProps, 'label' | 'mode'> {
  label: string;
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * TextInput with a plain text label above it. Paper's animated floating label
 * mis-positions on react-native-web (it sits over the value), so we don't use
 * it — the label lives outside the field.
 */
const LabeledInput: React.FC<Props> = ({ label, style, containerStyle, ...rest }) => {
  const c = useAppColors();
  const styles = React.useMemo(() => makeStyles(c), [c]);
  return (
    <View style={[styles.wrap, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput mode="outlined" dense {...rest} style={[styles.input, style]} />
    </View>
  );
};

const makeStyles = (c: ReturnType<typeof useAppColors>) =>
  StyleSheet.create({
    wrap: { marginBottom: spacing(3) },
    label: {
      fontSize: 12.5,
      fontWeight: '600',
      color: c.muted,
      marginBottom: spacing(1),
    },
    input: { backgroundColor: c.card, borderRadius: radius.sm },
  });

export default LabeledInput;
