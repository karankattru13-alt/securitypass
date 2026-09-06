import React, { useState } from 'react';
import { View, Image, StyleSheet, Platform } from 'react-native';
import { Button, Text, HelperText } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Screen from '../../components/Screen';
import AppHeader from '../../components/AppHeader';
import { colors, spacing, radius } from '../../theme';
import api from '../../services/api';

const VisitorPhotoScreen: React.FC<any> = ({ navigation, route }) => {
  const visitorId: number = route.params?.visitorId;
  const [uri, setUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const pick = async (fromCamera: boolean) => {
    setError(null);
    try {
      const perm = fromCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted' && Platform.OS !== 'web') {
        setError('Permission to access the camera/photos was denied.');
        return;
      }
      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({ quality: 0.6, allowsEditing: true })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.6, allowsEditing: true });
      if (!result.canceled) setUri(result.assets[0].uri);
    } catch {
      setError('Could not open the image picker.');
    }
  };

  const proceed = async () => {
    setBusy(true);
    try {
      if (uri) await api.uploadVisitorPhoto(visitorId, uri, 'entry');
      navigation.replace('VisitorApproval', { visitorId });
    } catch {
      setError('Upload failed, try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen padded={false}>
      <AppHeader
        title="Visitor Photo"
        subtitle="Capture for the entry record"
        color={colors.guard}
        onBack={() => navigation.goBack()}
      />
      <View style={styles.body}>
        <View style={styles.preview}>
          {uri ? (
            <Image source={{ uri }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.placeholder}>
              <MaterialCommunityIcons name="camera-outline" size={56} color={colors.muted} />
              <Text style={styles.placeholderText}>No photo captured</Text>
            </View>
          )}
        </View>

        {error ? (
          <HelperText type="error" visible>
            {error}
          </HelperText>
        ) : null}

        <Button
          mode="contained-tonal"
          icon="camera"
          onPress={() => pick(true)}
          style={styles.action}
        >
          Take Photo
        </Button>
        <Button
          mode="contained-tonal"
          icon="image-multiple"
          onPress={() => pick(false)}
          style={styles.action}
        >
          Choose from Library
        </Button>

        <Button
          mode="contained"
          onPress={proceed}
          loading={busy}
          disabled={busy}
          buttonColor={colors.guard}
          style={styles.next}
        >
          {uri ? 'Save & Continue' : 'Skip Photo'}
        </Button>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  body: { padding: spacing(4) },
  preview: {
    height: 300,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing(4),
  },
  image: { width: '100%', height: '100%' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: colors.muted, marginTop: spacing(2) },
  action: { marginBottom: spacing(3) },
  next: { marginTop: spacing(2), paddingVertical: spacing(1) },
});

export default VisitorPhotoScreen;
