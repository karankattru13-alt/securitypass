import React from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  RefreshControl,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme';

interface Props {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  style?: ViewStyle;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

const Screen: React.FC<Props> = ({
  children,
  scroll = true,
  padded = true,
  refreshing,
  onRefresh,
  style,
  edges = ['top', 'bottom', 'left', 'right'],
}) => {
  const inner = (
    <View style={[padded && styles.padded, !scroll && styles.flex, style]}>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={!!refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            ) : undefined
          }
        >
          {inner}
        </ScrollView>
      ) : (
        inner
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: spacing(8) },
  padded: { padding: spacing(4) },
});

export default Screen;
