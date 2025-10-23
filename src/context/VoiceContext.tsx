import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { AppState, AppStateStatus, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocation } from './LocationContext';
import Toast from 'react-native-toast-message';
import voiceRecognitionService from '../services/voiceRecognitionService';

interface VoiceContextType {
  isListening: boolean;
  isEnabled: boolean;
  startListening: () => Promise<void>;
  stopListening: () => Promise<void>;
  toggleVoiceDetection: () => void;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export const useVoice = () => {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
};

interface VoiceProviderProps {
  children: ReactNode;
}

export const VoiceProvider: React.FC<VoiceProviderProps> = ({ children }) => {
  const [isListening, setIsListening] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false); // Start disabled by default
  const { currentLocation } = useLocation();
  const listeningLoopRef = useRef<boolean>(false);

  useEffect(() => {
    // Initialize audio on mount (but don't auto-start)
    const init = async () => {
      await voiceRecognitionService.initialize();
    };

    init();

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && isEnabled && listeningLoopRef.current) {
        // Resume if was listening before
        startListening();
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        // Pause when app goes to background
        stopListening();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      stopListening();
      subscription?.remove();
    };
  }, []);

  const startListening = async () => {
    try {
      if (listeningLoopRef.current) {
        console.log('⚠️ Already listening, skipping...');
        return;
      }

      // Check if initialized
      const initialized = await voiceRecognitionService.initialize();
      if (!initialized) {
        Toast.show({
          type: 'error',
          text1: 'Microphone Access Required',
          text2: 'Please grant microphone permission in settings',
        });
        return;
      }

      listeningLoopRef.current = true;
      setIsListening(true);
      console.log('🎤 Voice detection started (real-time)');

      Toast.show({
        type: 'info',
        text1: '🎤 Voice Detection Active',
        text2: 'Say "Astra" for emergency alert',
        visibilityTime: 3000,
      });

      // Continuous listening loop
      while (listeningLoopRef.current) {
        try {
          // Record 3-second audio chunk (longer for better detection)
          const audioUri = await voiceRecognitionService.recordChunk(3000);

          if (!audioUri) {
            // If recording failed, wait and retry
            await new Promise((resolve) => setTimeout(resolve, 1000));
            continue;
          }

          if (!listeningLoopRef.current) {
            break;
          }

          // Send to backend for transcription
          const result = await voiceRecognitionService.transcribeAudio(audioUri);

          if (result.success) {
            if (result.hasVoice && result.transcript) {
              // Show what user said
              console.log('🗣️ You said:', result.transcript);
              
              // Check if "Astra" was detected
              if (result.containsKeyword) {
                console.log('🚨 ASTRA DETECTED! Triggering SOS...');
                
                // Show immediate feedback
                Toast.show({
                  type: 'error',
                  text1: '🚨 EMERGENCY ALERT',
                  text2: 'Keyword detected! Sending SOS...',
                  visibilityTime: 3000,
                });

                await triggerEmergencyAlert();
                
                // Stop listening after alert to prevent multiple triggers
                await stopListening();
                break;
              }
            }
          } else {
            console.log('⚠️ Transcription failed');
          }

          // Delay before next chunk to prevent recording conflicts
          await new Promise((resolve) => setTimeout(resolve, 300));
        } catch (error) {
          console.error('❌ Listening loop error:', error);
          
          // Wait before retrying on error
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }

      setIsListening(false);
      console.log('🎤 Voice detection stopped');
    } catch (error) {
      console.error('❌ Error starting voice recognition:', error);
      listeningLoopRef.current = false;
      setIsListening(false);
      
      Toast.show({
        type: 'error',
        text1: 'Voice Detection Error',
        text2: 'Failed to start voice recognition',
      });
    }
  };

  const stopListening = async () => {
    try {
      console.log('🛑 Stopping voice detection...');
      listeningLoopRef.current = false;
      
      // Wait a bit for loop to finish
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      await voiceRecognitionService.cleanup();
      setIsListening(false);
      console.log('✅ Voice detection stopped cleanly');
    } catch (error) {
      console.error('❌ Error stopping voice recognition:', error);
      listeningLoopRef.current = false;
      setIsListening(false);
    }
  };

  const toggleVoiceDetection = async () => {
    const newState = !isEnabled;
    
    if (!newState) {
      // Stopping
      await stopListening();
      setIsEnabled(false);
      
      Toast.show({
        type: 'info',
        text1: '🔇 Voice Detection Disabled',
        text2: 'Voice commands are now inactive',
      });
    } else {
      // Starting
      setIsEnabled(true);
      // Wait a bit before starting
      await new Promise((resolve) => setTimeout(resolve, 500));
      await startListening();
    }
  };

  const triggerEmergencyAlert = async () => {
    try {
      if (!currentLocation) {
        Toast.show({
          type: 'error',
          text1: 'Location not available',
          text2: 'Cannot send emergency alert without location',
        });
        return;
      }

      // Demo mode: Simulate SMS sending
      const storedGuardians = await AsyncStorage.getItem('demo_guardians');
      const guardians = storedGuardians ? JSON.parse(storedGuardians) : [];

      // Save alert to local storage
      const newAlert = {
        id: `alert-${Date.now()}`,
        triggerType: 'voice',
        status: 'ACTIVE',
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        address: currentLocation.address,
        message: 'Emergency alert triggered by voice command "Astra"',
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
          '🚨 DEMO: Voice Alert Sent!',
          `Emergency SMS would be sent to ${guardians.length} guardian(s):\n\n` +
          guardians.map((g: any) => `• ${g.name} (${g.phone})`).join('\n') +
          `\n\nTrigger: Voice Command "Astra"\n` +
          `Location: ${currentLocation.address || 'Unknown'}\n` +
          `Coordinates: ${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`,
          [{ text: 'OK' }]
        );

        Toast.show({
          type: 'success',
          text1: '🚨 DEMO: Emergency Alert Sent!',
          text2: `${guardians.length} guardian(s) would be notified`,
        });
      }

      console.log('Emergency alert sent via voice activation');
    } catch (error) {
      console.error('Error sending emergency alert:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to send alert',
        text2: 'Please try manual SOS button',
      });
    }
  };

  const value: VoiceContextType = {
    isListening,
    isEnabled,
    startListening,
    stopListening,
    toggleVoiceDetection,
  };

  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>;
};
