import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  StyleProp,
  ViewStyle,
  KeyboardTypeOptions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppColors, spacing, radius } from '../theme';

interface Props {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  maxLength?: number;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoFocus?: boolean;
  disabled?: boolean;
  hint?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

const LabeledInput: React.FC<Props> = ({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  secureTextEntry,
  keyboardType,
  maxLength,
  autoCapitalize = 'sentences',
  autoFocus,
  disabled,
  hint,
  containerStyle,
}) => {
  const c = useAppColors();
  const styles = React.useMemo(() => makeStyles(c), [c]);
  const [focused, setFocused] = useState(false);
  const [reveal, setReveal] = useState(false);

  return (
    <View style={[styles.wrap, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.field,
          focused && styles.fieldFocused,
          disabled && styles.fieldDisabled,
        ]}
      >
        {icon ? (
          <MaterialCommunityIcons
            name={icon}
            size={20}
            color={focused ? c.primary : c.muted}
            style={styles.leadIcon}
          />
        ) : null}
        <TextInput
          style={[styles.input, { outlineWidth: 0, outlineColor: 'transparent' } as any]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={c.muted}
          secureTextEntry={secureTextEntry && !reveal}
          keyboardType={keyboardType}
          maxLength={maxLength}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          autoFocus={autoFocus}
          editable={!disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          selectionColor={c.primary}
          underlineColorAndroid="transparent"
        />
        {secureTextEntry ? (
          <Pressable
            onPress={() => setReveal((r) => !r)}
            hitSlop={10}
            style={styles.trailBtn}
          >
            <MaterialCommunityIcons
              name={reveal ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={c.muted}
            />
          </Pressable>
        ) : null}
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
};

const makeStyles = (c: ReturnType<typeof useAppColors>) =>
  StyleSheet.create({
    wrap: { marginBottom: spacing(4) },
    label: {
      fontSize: 12.5,
      fontWeight: '700',
      color: c.muted,
      marginBottom: spacing(2),
      letterSpacing: 0.2,
    },
    field: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.card,
      borderWidth: 1.5,
      borderColor: c.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing(3),
      minHeight: 52,
    },
    fieldFocused: {
      borderColor: c.primary,
      shadowColor: c.primary,
      shadowOpacity: 0.14,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    fieldDisabled: { opacity: 0.55 },
    leadIcon: { marginRight: spacing(2) },
    input: {
      flex: 1,
      fontSize: 15,
      color: c.text,
      paddingVertical: spacing(3),
    },
    trailBtn: { paddingLeft: spacing(2), paddingVertical: spacing(2) },
    hint: { fontSize: 11.5, color: c.muted, marginTop: spacing(1) },
  });

export default LabeledInput;
