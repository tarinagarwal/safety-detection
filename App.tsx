import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import * as Location from 'expo-location';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import GuardiansScreen from './src/screens/GuardiansScreen';
import AlertsScreen from './src/screens/AlertsScreen';
import ProfileScreen from './src/screens/ProfileScreen';

// Context
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { VoiceProvider } from './src/context/VoiceContext';
import { LocationProvider } from './src/context/LocationContext';
import { ShakeProvider } from './src/context/ShakeContext';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: any = '';

        switch (route.name) {
          case 'Home':
            iconName = 'home';
            break;
          case 'Guardians':
            iconName = 'people';
            break;
          case 'Alerts':
            iconName = 'warning';
            break;
          case 'Profile':
            iconName = 'person';
            break;
        }

        return <MaterialIcons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#dc3545',
      tabBarInactiveTintColor: 'gray',
      headerShown: false,
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Guardians" component={GuardiansScreen} />
    <Tab.Screen name="Alerts" component={AlertsScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <NavigationContainer>
      {user ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
};

const App = () => {
  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    try {
      await Location.requestForegroundPermissionsAsync();
    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  };

  return (
    <AuthProvider>
      <LocationProvider>
        <ShakeProvider>
          <VoiceProvider>
            <AppNavigator />
            <Toast />
          </VoiceProvider>
        </ShakeProvider>
      </LocationProvider>
    </AuthProvider>
  );
};

export default App;
