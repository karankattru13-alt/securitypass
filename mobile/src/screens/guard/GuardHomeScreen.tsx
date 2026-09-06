import React, { useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity, Text, StyleSheet, Alert, Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Button, Badge, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';
import { RootState } from '../../store';

interface PendingApproval {
  id: number;
  visitor_name: string;
  flat: string;
  requested_at: string;
}

interface CurrentVisitor {
  id: number;
  name: string;
  flat: string;
  entry_time: string;
}

const GuardHomeScreen: React.FC<any> = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [currentVisitors, setCurrentVisitors] = useState<CurrentVisitor[]>([]);
  const [stats, setStats] = useState({
    todayVisitors: 0,
    currentlyInside: 0,
    pendingApprovals: 0,
  });

  useEffect(() => {
    loadData();
    // Refresh data every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Refresh whenever the screen regains focus (e.g. after registering a visitor)
  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const handleExit = async (visitorId: number) => {
    try {
      await api.markVisitorExited(visitorId);
      loadData();
    } catch (error) {
      console.error('Error marking exit:', error);
    }
  };

  const handleEmergency = () => {
    const msg = 'This would alert the security supervisor and control room.';
    if (Platform.OS === 'web') window.alert(`Emergency alert\n\n${msg}`);
    else Alert.alert('Emergency alert', msg);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Load pending approvals
      const approvalsResponse = await api.getVisitors({
        approval_status: 'pending',
        status: 'waiting',
      });
      setPendingApprovals(approvalsResponse.data);

      // Load current visitors
      const currentResponse = await api.getVisitors({
        status: 'entered',
      });
      setCurrentVisitors(currentResponse.data);

      // Load stats
      const statsResponse = await api.getGuardStats();
      setStats(statsResponse.data);
    } catch (error) {
      console.error('Error loading guard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && pendingApprovals.length === 0) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>SocietyPass Guard</Text>
          <Text style={styles.subtitle}>Main Gate • Morning Shift</Text>
        </View>
        <Icon name="security" size={32} color="#2196F3" />
      </View>

      {/* Status Cards */}
      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Card.Content>
            <Text style={styles.statLabel}>Today's Visitors</Text>
            <Text style={styles.statValue}>{stats.todayVisitors}</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content>
            <Text style={styles.statLabel}>Currently Inside</Text>
            <Text style={styles.statValue}>{stats.currentlyInside}</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content>
            <Text style={styles.statLabel}>Pending</Text>
            <Text style={styles.statValue}>{stats.pendingApprovals}</Text>
          </Card.Content>
        </Card>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={styles.largeButton}
          onPress={() => navigation.navigate('NewVisitor')}
        >
          <Icon name="plus-circle" size={40} color="#fff" />
          <Text style={styles.buttonText}>NEW VISITOR</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.largeButton, styles.secondaryButton]}
          onPress={() => navigation.navigate('NewVisitor', { type: 'delivery' })}
        >
          <Icon name="package-variant-closed" size={40} color="#fff" />
          <Text style={styles.buttonText}>DELIVERY</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.largeButton, styles.secondaryButton]}
          onPress={() => navigation.navigate('NewVisitor', { type: 'staff' })}
        >
          <Icon name="account-multiple" size={40} color="#fff" />
          <Text style={styles.buttonText}>STAFF</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.largeButton, styles.warningButton]}
          onPress={handleEmergency}
        >
          <Icon name="alert-circle" size={40} color="#fff" />
          <Text style={styles.buttonText}>EMERGENCY</Text>
        </TouchableOpacity>
      </View>

      {/* Pending Approvals */}
      {pendingApprovals.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Pending Approvals ({pendingApprovals.length})
          </Text>
          {pendingApprovals.map((approval) => (
            <Card
              key={approval.id}
              style={styles.approvalCard}
              onPress={() =>
                navigation.navigate('VisitorApproval', { visitorId: approval.id })
              }
            >
              <Card.Content style={styles.approvalCardContent}>
                <View style={styles.approvalInfo}>
                  <Text style={styles.approvalName}>{approval.visitor_name}</Text>
                  <Text style={styles.approvalFlat}>{approval.flat}</Text>
                  <Text style={styles.approvalTime}>
                    {new Date(approval.requested_at).toLocaleTimeString()}
                  </Text>
                </View>
                <Badge size={24} style={{ backgroundColor: '#FF9800' }}>
                  1
                </Badge>
              </Card.Content>
            </Card>
          ))}
        </View>
      )}

      {/* Current Visitors */}
      {currentVisitors.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Currently Inside ({currentVisitors.length})
          </Text>
          {currentVisitors.map((visitor) => (
            <Card
              key={visitor.id}
              style={styles.visitorCard}
              onPress={() =>
                navigation.navigate('VisitorDetails', { visitorId: visitor.id })
              }
            >
              <Card.Content style={styles.visitorCardContent}>
                <View style={styles.visitorInfo}>
                  <Text style={styles.visitorName}>{visitor.name}</Text>
                  <Text style={styles.visitorFlat}>{visitor.flat}</Text>
                </View>
                <TouchableOpacity
                  style={styles.exitButton}
                  onPress={() => handleExit(visitor.id)}
                >
                  <Icon name="logout-variant" size={24} color="#4CAF50" />
                </TouchableOpacity>
              </Card.Content>
            </Card>
          ))}
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <Button
          mode="outlined"
          icon="history"
          onPress={() => navigation.navigate('GuardHistory')}
          style={styles.quickActionButton}
        >
          View History
        </Button>
        <Button
          mode="outlined"
          icon="bell-outline"
          onPress={() => navigation.navigate('Notifications')}
          style={styles.quickActionButton}
        >
          Notifications
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingBottom: 20,
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#e3f2fd',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 10,
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    marginHorizontal: 5,
    backgroundColor: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2196F3',
    textAlign: 'center',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    justifyContent: 'space-between',
  },
  largeButton: {
    width: '48%',
    backgroundColor: '#2196F3',
    borderRadius: 12,
    padding: 20,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  secondaryButton: {
    backgroundColor: '#4CAF50',
  },
  warningButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 8,
    fontSize: 12,
    textAlign: 'center',
  },
  section: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  approvalCard: {
    marginBottom: 10,
    backgroundColor: '#FFF3E0',
  },
  approvalCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  approvalInfo: {
    flex: 1,
  },
  approvalName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  approvalFlat: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  approvalTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  visitorCard: {
    marginBottom: 10,
    backgroundColor: '#E8F5E9',
  },
  visitorCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  visitorInfo: {
    flex: 1,
  },
  visitorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  visitorFlat: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  exitButton: {
    padding: 10,
  },
  quickActionButton: {
    marginBottom: 10,
    borderColor: '#2196F3',
  },
});

export default GuardHomeScreen;
