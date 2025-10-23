import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { useVoice } from '../context/VoiceContext';
import { useShake } from '../context/ShakeContext';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const [sosLoading, setSosLoading] = useState(false);
  const { user } = useAuth();
  const { currentLocation } = useLocation();
  const { isListening, isEnabled, toggleVoiceDetection } = useVoice();
  const { isEnabled: shakeEnabled, sensitivity, toggleShakeDetection, setSensitivity } = useShake();

  const handleManualSOS = async () => {
    try {
      setSosLoading(true);

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
        message: 'Manual emergency alert triggered',
        createdAt: new Date().toISOString(),
      };

      const storedAlerts = await AsyncStorage.getItem('demo_alerts');
      const alerts = storedAlerts ? JSON.parse(storedAlerts) : [];
      alerts.unshift(newAlert);
      await AsyncStorage.setItem('demo_alerts', JSON.stringify(alerts));

      // Simulate a delay for sending SMS
      await new Promise(resolve => setTimeout(resolve, 1500));

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
          '🚨 DEMO: SOS Alert Sent!',
          `Emergency SMS would be sent to ${guardians.length} guardian(s):\n\n` +
          guardians.map((g: any) => `• ${g.name} (${g.phone})`).join('\n') +
          `\n\nLocation: ${currentLocation.address || 'Unknown'}\n` +
          `Coordinates: ${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`,
          [{ text: 'OK' }]
        );

        Toast.show({
          type: 'success',
          text1: '🚨 DEMO: SOS Alert Sent!',
          text2: `${guardians.length} guardian(s) would be notified`,
          visibilityTime: 5000,
        });
      }
    } catch (error: any) {
      console.error('SOS error:', error);
      Toast.show({
        type: 'error',
        text1: '❌ SOS Failed',
        text2: 'Unable to send emergency alert',
      });
    } finally {
      setSosLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello, {user?.name}!</Text>
          <Text style={styles.subtitle}>Stay safe and connected</Text>
        </View>

        <View style={styles.sosContainer}>
          <TouchableOpacity
            style={[styles.sosButton, sosLoading && styles.sosButtonDisabled]}
            onPress={handleManualSOS}
            disabled={sosLoading}
          >
            <MaterialIcons name="emergency" size={60} color="#fff" />
            <Text style={styles.sosButtonText}>EMERGENCY SOS</Text>
            <Text style={styles.sosButtonSubtext}>Tap to send alert</Text>
          </TouchableOpacity>
        </View>

        {/* Shake Detection */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="vibration" size={24} color="#dc3545" />
            <Text style={styles.cardTitle}>Shake Detection</Text>
          </View>
          <View style={styles.voiceStatus}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Status:</Text>
              <View style={styles.statusIndicator}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: shakeEnabled ? '#28a745' : '#dc3545' },
                  ]}
                />
                <Text style={styles.statusText}>{shakeEnabled ? 'Active' : 'Inactive'}</Text>
              </View>
            </View>
            <Text style={styles.voiceInfo}>Shake your phone vigorously for emergency alert</Text>
            
            <View style={styles.sensitivityContainer}>
              <Text style={styles.sensitivityLabel}>Sensitivity:</Text>
              <View style={styles.sensitivityButtons}>
                {(['low', 'medium', 'high'] as const).map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.sensitivityButton,
                      sensitivity === level && styles.sensitivityButtonActive,
                    ]}
                    onPress={() => setSensitivity(level)}
                  >
                    <Text
                      style={[
                        styles.sensitivityButtonText,
                        sensitivity === level && styles.sensitivityButtonTextActive,
                      ]}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.toggleButton, shakeEnabled && styles.toggleButtonActive]}
              onPress={toggleShakeDetection}
            >
              <Text style={[styles.toggleButtonText, shakeEnabled && styles.toggleButtonTextActive]}>
                {shakeEnabled ? 'Disable Shake Detection' : 'Enable Shake Detection'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Voice Detection */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="mic" size={24} color="#dc3545" />
            <Text style={styles.cardTitle}>Voice Detection</Text>
          </View>
          <View style={styles.voiceStatus}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Status:</Text>
              <View style={styles.statusIndicator}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: isEnabled && isListening ? '#28a745' : '#dc3545' },
                  ]}
                />
                <Text style={styles.statusText}>
                  {isEnabled && isListening ? 'Listening' : 'Inactive'}
                </Text>
              </View>
            </View>
            <Text style={styles.voiceInfo}>Say "Astra" for automatic emergency alert</Text>
            
            <View style={styles.warningBox}>
              <MaterialIcons name="info" size={16} color="#856404" />
              <Text style={styles.warningText}>
                Requires native build (won't work in Expo Go)
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.toggleButton, isEnabled && styles.toggleButtonActive]}
              onPress={toggleVoiceDetection}
            >
              <Text style={[styles.toggleButtonText, isEnabled && styles.toggleButtonTextActive]}>
                {isEnabled ? 'Disable Voice Detection' : 'Enable Voice Detection'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="location-on" size={24} color="#dc3545" />
            <Text style={styles.cardTitle}>Current Location</Text>
          </View>
          {currentLocation ? (
            <>
              <Text style={styles.locationText}>{currentLocation.address}</Text>
              <View style={styles.coordsContainer}>
                <MaterialIcons name="my-location" size={14} color="#999" />
                <Text style={styles.locationCoords}>
                  {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.locationLoading}>
              <ActivityIndicator size="small" color="#dc3545" />
              <Text style={styles.locationLoadingText}>Getting your location...</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  sosContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  sosButton: {
    backgroundColor: '#dc3545',
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  sosButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sosButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
  },
  sosButtonSubtext: {
    color: '#fff',
    fontSize: 14,
    marginTop: 5,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  voiceStatus: {
    marginTop: 10,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statusLabel: {
    fontSize: 16,
    color: '#666',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  voiceInfo: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 15,
  },
  toggleButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dc3545',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#dc3545',
  },
  toggleButtonText: {
    color: '#dc3545',
    fontWeight: 'bold',
  },
  toggleButtonTextActive: {
    color: '#fff',
  },
  locationText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    lineHeight: 22,
  },
  coordsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationCoords: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
    marginLeft: 4,
  },
  locationLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  locationLoadingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
  },
  sensitivityContainer: {
    marginTop: 15,
    marginBottom: 15,
  },
  sensitivityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  sensitivityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sensitivityButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  sensitivityButtonActive: {
    backgroundColor: '#dc3545',
    borderColor: '#dc3545',
  },
  sensitivityButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  sensitivityButtonTextActive: {
    color: '#fff',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    borderColor: '#ffc107',
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    marginBottom: 15,
  },
  warningText: {
    fontSize: 12,
    color: '#856404',
    marginLeft: 8,
    flex: 1,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e7f3ff',
    borderWidth: 1,
    borderColor: '#007bff',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  testButtonText: {
    color: '#007bff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default HomeScreen;
