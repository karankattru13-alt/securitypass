import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider } from 'react-redux';
import { PaperProvider } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import store from './src/store';
import { useThemeBundle, useAppColors } from './src/theme';
import { useAuth } from './src/hooks/useAuth';
import { useNotifications } from './src/hooks/useNotifications';

// Auth Screens
import LoginScreen from './src/screens/auth/LoginScreen';
import OTPScreen from './src/screens/auth/OTPScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import SplashScreen from './src/screens/SplashScreen';

// Guard Screens
import GuardHomeScreen from './src/screens/guard/GuardHomeScreen';
import GuardDutyScreen from './src/screens/guard/GuardDutyScreen';
import GuardRecordsScreen from './src/screens/guard/GuardRecordsScreen';
import NewVisitorScreen from './src/screens/guard/NewVisitorScreen';
import VisitorPhotoScreen from './src/screens/guard/VisitorPhotoScreen';
import VisitorDetailsScreen from './src/screens/guard/VisitorDetailsScreen';
import VisitorApprovalScreen from './src/screens/guard/VisitorApprovalScreen';
import GuardHistoryScreen from './src/screens/guard/GuardHistoryScreen';

// Resident Screens
import ResidentHomeScreen from './src/screens/resident/ResidentHomeScreen';
import VisitorRequestScreen from './src/screens/resident/VisitorRequestScreen';
import VisitorDetailsResidentScreen from './src/screens/resident/VisitorDetailsScreen';
import PreApprovedVisitorsScreen from './src/screens/resident/PreApprovedVisitorsScreen';
import QRPassGeneratorScreen from './src/screens/resident/QRPassGeneratorScreen';
import ResidentHistoryScreen from './src/screens/resident/ResidentHistoryScreen';

// Admin Screens
import AdminDashboardScreen from './src/screens/admin/AdminDashboardScreen';
import AdminSocietyScreen from './src/screens/admin/AdminSocietyScreen';
import AdminResidentsScreen from './src/screens/admin/AdminResidentsScreen';
import AdminGuardsScreen from './src/screens/admin/AdminGuardsScreen';

// Common Screens
import ProfileScreen from './src/screens/common/ProfileScreen';
import SettingsScreen from './src/screens/common/SettingsScreen';
import NotificationsScreen from './src/screens/common/NotificationsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const tabScreenOptions =
  (activeColor: string, icons: Record<string, [string, string]>) =>
  ({ route }: any) => ({
    tabBarIcon: ({ focused, color, size }: any) => {
      const pair = icons[route.name] || ['circle', 'circle-outline'];
      return (
        <Icon name={focused ? (pair[0] as any) : (pair[1] as any)} size={size} color={color} />
      );
    },
    tabBarActiveTintColor: activeColor,
    tabBarInactiveTintColor: '#999',
    headerShown: false,
  });

// Guard Navigation
const GuardNavigator = () => {
  const c = useAppColors();
  return (
  <Tab.Navigator
    screenOptions={tabScreenOptions(c.guard, {
      GuardHome: ['home', 'home-outline'],
      GuardDuty: ['shield-check', 'shield-off-outline'],
      GuardRecords: ['clipboard-text', 'clipboard-text-outline'],
      GuardHistory: ['history', 'history'],
      Profile: ['account', 'account-outline'],
    })}
  >
    <Tab.Screen name="GuardHome" component={GuardHomeScreen} options={{ title: 'Home' }} />
    <Tab.Screen name="GuardDuty" component={GuardDutyScreen} options={{ title: 'Duty' }} />
    <Tab.Screen name="GuardRecords" component={GuardRecordsScreen} options={{ title: 'Records' }} />
    <Tab.Screen name="GuardHistory" component={GuardHistoryScreen} options={{ title: 'History' }} />
    <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
  </Tab.Navigator>
  );
};

// Resident Navigation
const ResidentNavigator = () => {
  const c = useAppColors();
  return (
  <Tab.Navigator
    screenOptions={tabScreenOptions(c.resident, {
      ResidentHome: ['home', 'home-outline'],
      ResidentHistory: ['history', 'history'],
      Profile: ['account', 'account-outline'],
    })}
  >
    <Tab.Screen name="ResidentHome" component={ResidentHomeScreen} options={{ title: 'Visitors' }} />
    <Tab.Screen
      name="ResidentHistory"
      component={ResidentHistoryScreen}
      options={{ title: 'History' }}
    />
    <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
  </Tab.Navigator>
  );
};

// Admin Navigation
const AdminNavigator = () => {
  const c = useAppColors();
  return (
  <Tab.Navigator
    screenOptions={tabScreenOptions(c.admin, {
      AdminDashboard: ['chart-box', 'chart-box-outline'],
      AdminSociety: ['home-city', 'home-city-outline'],
      Profile: ['account', 'account-outline'],
    })}
  >
    <Tab.Screen
      name="AdminDashboard"
      component={AdminDashboardScreen}
      options={{ title: 'Dashboard' }}
    />
    <Tab.Screen name="AdminSociety" component={AdminSocietyScreen} options={{ title: 'Society' }} />
    <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
  </Tab.Navigator>
  );
};

// Auth Stack
const AuthNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="OTP" component={OTPScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

// Root Navigator
const RootNavigator = () => {
  const { isLoading, user } = useAuth();
  useNotifications();

  if (isLoading) return <SplashScreen />;
  if (!user) return <AuthNavigator />;

  const isGuard = user.role === 'guard' || user.role === 'security_supervisor';
  const isResident = user.role === 'resident' || user.role === 'staff';
  const isAdmin = user.role === 'society_admin' || user.role === 'super_admin';

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isGuard && (
        <Stack.Group>
          <Stack.Screen name="GuardApp" component={GuardNavigator} />
          <Stack.Screen name="NewVisitor" component={NewVisitorScreen} />
          <Stack.Screen name="VisitorPhoto" component={VisitorPhotoScreen} />
          <Stack.Screen name="VisitorDetails" component={VisitorDetailsScreen} />
          <Stack.Screen name="VisitorApproval" component={VisitorApprovalScreen} />
        </Stack.Group>
      )}

      {isResident && (
        <Stack.Group>
          <Stack.Screen name="ResidentApp" component={ResidentNavigator} />
          <Stack.Screen name="VisitorRequest" component={VisitorRequestScreen} />
          <Stack.Screen name="ResidentVisitorDetails" component={VisitorDetailsResidentScreen} />
          <Stack.Screen name="PreApprovedVisitors" component={PreApprovedVisitorsScreen} />
          <Stack.Screen name="QRPassGenerator" component={QRPassGeneratorScreen} />
        </Stack.Group>
      )}

      {isAdmin && (
        <Stack.Group>
          <Stack.Screen name="AdminApp" component={AdminNavigator} />
          <Stack.Screen name="AdminResidents" component={AdminResidentsScreen} />
          <Stack.Screen name="AdminGuards" component={AdminGuardsScreen} />
        </Stack.Group>
      )}

      <Stack.Group screenOptions={{ presentation: 'modal' }}>
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Group>
    </Stack.Navigator>
  );
};

const ThemedApp = () => {
  const { paper, nav } = useThemeBundle();
  return (
    <PaperProvider theme={paper}>
      <StatusBar style="light" />
      <NavigationContainer theme={nav}>
        <RootNavigator />
      </NavigationContainer>
    </PaperProvider>
  );
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <SafeAreaProvider>
          <ThemedApp />
        </SafeAreaProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}
