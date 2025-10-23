import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppState, AppStateStatus, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocation } from './LocationContext';
import Toast from 'react-native-toast-message';
import shakeDetectionService from '../services/shakeDetectionService';

interface ShakeContextType {
  isEnabled: boolean;
  sensitivity: 'low' | 'medium' | 'high';
  toggleShakeDetection: () => void;
  setSensitivity: (sensitivity: 'low' | 'medium' | 'high') => void;
}

const ShakeContext = createContext<ShakeContextType | undefined>(undefined);

export const useShake = () => {
  const context = useContext(ShakeContext);
  if (!context) {
    throw new Error('useShake must be used within a ShakeProvider');
  }
  return context;
};

interface ShakeProviderProps {
  children: ReactNode;
}

export const ShakeProvider: React.FC<ShakeProviderProps> = ({ children }) => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [sensitivity, setSensitivityState] = useState<'low' | 'medium' | 'high'>('medium');
  const { currentLocation } = useLocation();

  useEffect(() => {
    if (isEnabled) {
      startShakeDetection();
    }

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && isEnabled) {
        startShakeDetection();
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        stopShakeDetection();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      stopShakeDetection();
      subscription?.remove();
    };
  }, [isEnabled, sensitivity]);

  const startShakeDetection = () => {
    if (shakeDetectionService.isActive()) {
      return;
    }

    shakeDetectionService.start(() => {
      handleShakeDetected();
    }, sensitivity);
  };

  const stopShakeDetection = () => {
    shakeDetectionService.stop();
  };

  const handleShakeDetected = async () => {
    console.log('📳 SHAKE DETECTED! Triggering emergency alert...');

    // Show immediate feedback
    Toast.show({
      type: 'error',
      text1: '📳 Shake Detected!',
      text2: 'Sending emergency alert...',
      visibilityTime: 3000,
      position: 'top',
    });

    try {
      if (!currentLocation) {
        Toast.show({
          type: 'error',
          text1: '❌ Location not available',
          text2: 'Please wait for location to be detected',
        });
        return;
      }

      // Demo mode: Simulate SMS sending
      const storedGuardians = await AsyncStorage.getItem('demo_guardians');
      const guardians = storedGuardians ? JSON.parse(storedGuardians) : [];

      // Save alert to local storage
      const newAlert = {
        id: `alert-${Date.now()}`,
        triggerType: 'manual',
        status: 'ACTIVE',
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        address: currentLocation.address,
        message: 'Emergency alert triggered by shake detection',
        createdAt: new Date().toISOString(),
      };

      const storedAlerts = await AsyncStorage.getItem('demo_alerts');
      const alerts = storedAlerts ? JSON.parse(storedAlerts) : [];
      alerts.unshift(newAlert);
      await AsyncStorage.setItem('demo_alerts', JSON.stringify(alerts));

      // Simulate a delay for sending SMS
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (guardians.length === 0) {
        Toast.show({
          type: 'info',
          text1: '⚠️ No Guardians',
          text2: 'Please add guardians to receive alerts',
          visibilityTime: 4000,
        });
      } else {
        // Show demo alert with guardian info
        Alert.alert(
          '🚨 DEMO: Shake Alert Sent!',
          `Emergency SMS would be sent to ${guardians.length} guardian(s):\n\n` +
          guardians.map((g: any) => `• ${g.name} (${g.phone})`).join('\n') +
          `\n\nTrigger: Shake Detection\n` +
          `Location: ${currentLocation.address || 'Unknown'}\n` +
          `Coordinates: ${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`,
          [{ text: 'OK' }]
        );

        Toast.show({
          type: 'success',
          text1: '🚨 DEMO: Emergency Alert Sent!',
          text2: `${guardians.length} guardian(s) would be notified`,
          visibilityTime: 5000,
        });
      }

      console.log('✅ Emergency alert sent via shake detection');
    } catch (error) {
      console.error('❌ Error sending emergency alert:', error);
      Toast.show({
        type: 'error',
        text1: '❌ Failed to send alert',
        text2: 'Please try manual SOS button',
      });
    }
  };

  const toggleShakeDetection = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);

    if (newState) {
      startShakeDetection();
    } else {
      stopShakeDetection();
    }
  };

  const setSensitivity = (newSensitivity: 'low' | 'medium' | 'high') => {
    setSensitivityState(newSensitivity);
    shakeDetectionService.setSensitivity(newSensitivity);
  };

  const value: ShakeContextType = {
    isEnabled,
    sensitivity,
    toggleShakeDetection,
    setSensitivity,
  };

  return <ShakeContext.Provider value={value}>{children}</ShakeContext.Provider>;
};
