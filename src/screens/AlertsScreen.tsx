import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

interface Alert {
  id: string;
  triggerType: string;
  status: string;
  latitude: number;
  longitude: number;
  address?: string;
  message?: string;
  createdAt: string;
}

const AlertsScreen = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Demo mode: Load from local storage
      const storedAlerts = await AsyncStorage.getItem('demo_alerts');
      if (storedAlerts) {
        setAlerts(JSON.parse(storedAlerts));
      } else {
        setAlerts([]);
      }
    } catch (error) {
      console.error('Load alerts error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load alerts',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    loadAlerts(true);
  };

  const updateAlertStatus = async (alertId: string, newStatus: string) => {
    try {
      // Demo mode: Update in local storage
      const updatedAlerts = alerts.map((alert) => 
        alert.id === alertId ? { ...alert, status: newStatus } : alert
      );
      
      await AsyncStorage.setItem('demo_alerts', JSON.stringify(updatedAlerts));
      setAlerts(updatedAlerts);

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Alert status updated',
      });
    } catch (error) {
      console.error('Update alert status error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update alert status',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return '#dc3545';
      case 'resolved':
        return '#28a745';
      case 'false_alarm':
        return '#ffc107';
      default:
        return '#6c757d';
    }
  };

  const getTriggerTypeIcon = (triggerType: string) => {
    switch (triggerType.toLowerCase()) {
      case 'voice':
        return 'mic';
      case 'manual':
        return 'touch-app';
      case 'secret_code':
        return 'lock';
      default:
        return 'warning';
    }
  };

  const getTriggerTypeText = (triggerType: string) => {
    switch (triggerType.toLowerCase()) {
      case 'voice':
        return 'Voice Activated';
      case 'manual':
        return 'Manual SOS';
      case 'secret_code':
        return 'Secret Code';
      default:
        return triggerType;
    }
  };

  const openInMaps = (latitude: number, longitude: number) => {
    const url = `https://maps.google.com/maps?q=${latitude},${longitude}`;
    // In a real app, you'd use Linking.openURL(url)
    Toast.show({
      type: 'info',
      text1: 'Location',
      text2: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
    });
  };

  const renderAlert = ({ item }: { item: Alert }) => (
    <View style={styles.alertCard}>
      <View style={styles.alertHeader}>
        <View style={styles.alertInfo}>
          <View style={styles.alertTitleRow}>
            <MaterialIcons
              name={getTriggerTypeIcon(item.triggerType)}
              size={20}
              color="#dc3545"
            />
            <Text style={styles.alertTitle}>{getTriggerTypeText(item.triggerType)}</Text>
          </View>
          <Text style={styles.alertDate}>{new Date(item.createdAt).toLocaleString()}</Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>

      {item.message && <Text style={styles.alertMessage}>{item.message}</Text>}

      <TouchableOpacity
        style={styles.locationInfo}
        onPress={() => openInMaps(item.latitude, item.longitude)}
      >
        <MaterialIcons name="location-on" size={16} color="#dc3545" />
        <Text style={styles.locationText}>
          {item.address || `${item.latitude.toFixed(6)}, ${item.longitude.toFixed(6)}`}
        </Text>
        <MaterialIcons name="open-in-new" size={16} color="#666" />
      </TouchableOpacity>

      {item.status.toLowerCase() === 'active' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.resolveButton]}
            onPress={() => updateAlertStatus(item.id, 'resolved')}
          >
            <MaterialIcons name="check-circle" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Resolved</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.falseAlarmButton]}
            onPress={() => updateAlertStatus(item.id, 'false_alarm')}
          >
            <MaterialIcons name="cancel" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>False Alarm</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialIcons name="warning" size={80} color="#ccc" />
      <Text style={styles.emptyStateText}>No alerts yet</Text>
      <Text style={styles.emptyStateSubtext}>Your emergency alerts will appear here</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#dc3545" />
          <Text style={styles.loadingText}>Loading alerts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Emergency Alerts</Text>
        <Text style={styles.subtitle}>
          {alerts.length} alert{alerts.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={alerts}
        renderItem={renderAlert}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#dc3545']} />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    padding: 20,
    flexGrow: 1,
  },
  alertCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  alertInfo: {
    flex: 1,
  },
  alertTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  alertDate: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  alertMessage: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
    lineHeight: 20,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 0.48,
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resolveButton: {
    backgroundColor: '#28a745',
  },
  falseAlarmButton: {
    backgroundColor: '#ffc107',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default AlertsScreen;
