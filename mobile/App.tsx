import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider } from 'react-redux';
import { PaperProvider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import store from './src/store';
import { useAuth } from './src/hooks/useAuth';
import { useNotifications } from './src/hooks/useNotifications';

// Auth Screens
import LoginScreen from './src/screens/auth/LoginScreen';
import OTPScreen from './src/screens/auth/OTPScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import SplashScreen from './src/screens/SplashScreen';

// Guard Screens
import GuardHomeScreen from './src/screens/guard/GuardHomeScreen';
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

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Guard Navigation
const GuardNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'GuardHome') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'GuardHistory') {
            iconName = focused ? 'history' : 'history';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'account' : 'account-outline';
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: '#999',
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="GuardHome"
        component={GuardHomeScreen}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name="GuardHistory"
        component={GuardHistoryScreen}
        options={{ title: 'History' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

// Resident Navigation
const ResidentNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'ResidentHome') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'ResidentHistory') {
            iconName = focused ? 'history' : 'history';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'account' : 'account-outline';
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: '#999',
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="ResidentHome"
        component={ResidentHomeScreen}
        options={{ title: 'Visitors' }}
      />
      <Tab.Screen
        name="ResidentHistory"
        component={ResidentHistoryScreen}
        options={{ title: 'History' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

// Admin Navigation
const AdminNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'AdminDashboard') {
            iconName = focused ? 'chart-box' : 'chart-box-outline';
          } else if (route.name === 'AdminSociety') {
            iconName = focused ? 'home-city' : 'home-city';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'account' : 'account-outline';
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF9800',
        tabBarInactiveTintColor: '#999',
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen
        name="AdminSociety"
        component={AdminSocietyScreen}
        options={{ title: 'Society' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

// Auth Stack
const AuthNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="OTP" component={OTPScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
};

// Root Navigator
const RootNavigator = () => {
  const { isLoading, user } = useAuth();
  useNotifications(); // Initialize notifications

  if (isLoading) {
    return <SplashScreen />;
  }

  if (!user) {
    return <AuthNavigator />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user.role === 'guard' && (
        <Stack.Group>
          <Stack.Screen name="GuardApp" component={GuardNavigator} />
          <Stack.Screen
            name="NewVisitor"
            component={NewVisitorScreen}
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen
            name="VisitorPhoto"
            component={VisitorPhotoScreen}
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen
            name="VisitorDetails"
            component={VisitorDetailsScreen}
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen
            name="VisitorApproval"
            component={VisitorApprovalScreen}
            options={{ presentation: 'modal' }}
          />
        </Stack.Group>
      )}

      {user.role === 'resident' && (
        <Stack.Group>
          <Stack.Screen name="ResidentApp" component={ResidentNavigator} />
          <Stack.Screen
            name="VisitorRequest"
            component={VisitorRequestScreen}
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen
            name="PreApprovedVisitors"
            component={PreApprovedVisitorsScreen}
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen
            name="QRPassGenerator"
            component={QRPassGeneratorScreen}
            options={{ presentation: 'modal' }}
          />
        </Stack.Group>
      )}

      {(user.role === 'society_admin' || user.role === 'super_admin') && (
        <Stack.Group>
          <Stack.Screen name="AdminApp" component={AdminNavigator} />
          <Stack.Screen
            name="AdminResidents"
            component={AdminResidentsScreen}
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen
            name="AdminGuards"
            component={AdminGuardsScreen}
            options={{ presentation: 'modal' }}
          />
        </Stack.Group>
      )}

      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <Provider store={store}>
      <PaperProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </PaperProvider>
    </Provider>
  );
}
