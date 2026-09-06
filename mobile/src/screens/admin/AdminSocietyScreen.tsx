import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, ActivityIndicator, List, Divider, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../../components/Screen';
import AppHeader from '../../components/AppHeader';
import EmptyState from '../../components/EmptyState';
import ExportButton from '../../components/ExportButton';
import { useAppColors, spacing } from '../../theme';
import api from '../../services/api';

type Pal = ReturnType<typeof useAppColors>;

const AdminSocietyScreen: React.FC<any> = ({ navigation }) => {
  const c = useAppColors();
  const styles = React.useMemo(() => makeStyles(c), [c]);

  const Row = ({ icon, text }: any) => (
    <View style={styles.row}>
      <MaterialCommunityIcons name={icon} size={18} color={c.admin} />
      <Text style={styles.rowText}>{text}</Text>
    </View>
  );

  const [society, setSociety] = useState<any>(null);
  const [flats, setFlats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tower, setTower] = useState<string>('All');

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [s, f] = await Promise.all([api.getSociety(1), api.getSocietyFlats(1)]);
      setSociety(s.data);
      setFlats(f.data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) {
    return (
      <Screen>
        <ActivityIndicator style={{ marginTop: spacing(12) }} color={c.admin} />
      </Screen>
    );
  }

  const towers = ['All', ...(society?.towers ?? [])];
  const shown = tower === 'All' ? flats : flats.filter((f) => f.tower === tower);

  return (
    <Screen padded={false} refreshing={refreshing} onRefresh={load}>
      <AppHeader
        title="Society"
        subtitle={society?.name}
        color={c.admin}
        icon="home-city"
        onBack={() => navigation.navigate('AdminDashboard')}
      />
      <View style={styles.body}>
        <Card style={styles.card}>
          <Card.Content>
            <Row icon="map-marker" text={`${society?.address}, ${society?.city}`} />
            <Row icon="home-group" text={`${society?.total_flats} flats · ${society?.towers?.length} towers`} />
            <Row icon="account-group" text={`${society?.total_residents} residents`} />
            <Row icon="shield-account" text={`${society?.total_guards} security staff`} />
          </Card.Content>
        </Card>

        {flats.length > 0 && (
          <View style={styles.exportRow}>
            <ExportButton
              filename="society-flats"
              rows={() => flats}
              columns={[
                { key: 'number', label: 'Flat' },
                { key: 'tower', label: 'Tower' },
                { key: 'resident_name', label: 'Resident' },
                { key: 'resident_phone', label: 'Phone' },
              ]}
            />
          </View>
        )}

        {flats.length > 1 && (
          <View style={styles.chips}>
            {towers.map((t) => (
              <Chip
                key={t}
                selected={tower === t}
                onPress={() => setTower(t)}
                style={styles.chip}
                showSelectedCheck={false}
              >
                {t === 'All' ? 'All' : `Tower ${t}`}
              </Chip>
            ))}
          </View>
        )}

        {shown.length === 0 ? (
          <EmptyState
            icon="home-plus-outline"
            title="No flats yet"
            message="Flats appear here as residents sign up and set their house number."
          />
        ) : (
          <Card style={styles.card}>
            {shown.map((f, i) => (
              <React.Fragment key={f.id}>
                <List.Item
                  title={f.number}
                  description={f.resident_name}
                  left={(p) => <List.Icon {...p} icon="door" />}
                />
                {i < shown.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </Card>
        )}
      </View>
    </Screen>
  );
};


const makeStyles = (c: Pal) =>
  StyleSheet.create({
  body: { padding: spacing(4) },
  card: { backgroundColor: c.card, marginBottom: spacing(4) },
  exportRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing(3) },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing(2) },
  rowText: { marginLeft: spacing(2), color: c.text, fontSize: 14, flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing(3) },
  chip: { marginRight: spacing(2), marginBottom: spacing(2) },
});

export default AdminSocietyScreen;
