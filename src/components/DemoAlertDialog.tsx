import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface Guardian {
  name: string;
  phone: string;
  email?: string;
}

interface AlertData {
  latitude: number;
  longitude: number;
  address?: string;
  triggerType: string;
}

interface Props {
  visible: boolean;
  guardians: Guardian[];
  alertData: AlertData;
  onClose: () => void;
  onSendSMS?: () => void;
  onSendEmail?: () => void;
}

const DemoAlertDialog: React.FC<Props> = ({
  visible,
  guardians,
  alertData,
  onClose,
  onSendSMS,
  onSendEmail,
}) => {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <MaterialIcons name="warning" size={40} color="#dc3545" />
            <Text style={styles.title}>🚨 DEMO: Emergency Alert</Text>
          </View>

          <ScrollView style={styles.content}>
            <Text style={styles.subtitle}>
              Emergency alert would be sent to {guardians.length} guardian(s):
            </Text>

            <View style={styles.guardiansList}>
              {guardians.map((guardian, index) => (
                <View key={index} style={styles.guardianItem}>
                  <MaterialIcons name="person" size={20} color="#666" />
                  <View style={styles.guardianInfo}>
                    <Text style={styles.guardianName}>{guardian.name}</Text>
                    <Text style={styles.guardianContact}>{guardian.phone}</Text>
                    {guardian.email && (
                      <Text style={styles.guardianContact}>{guardian.email}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.alertDetails}>
              <Text style={styles.detailsTitle}>Alert Details:</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Trigger:</Text>
                <Text style={styles.detailValue}>{alertData.triggerType}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Location:</Text>
                <Text style={styles.detailValue}>
                  {alertData.address || 'Unknown'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Coordinates:</Text>
                <Text style={styles.detailValue}>
                  {alertData.latitude.toFixed(6)}, {alertData.longitude.toFixed(6)}
                </Text>
              </View>
            </View>

            <View style={styles.infoBox}>
              <MaterialIcons name="info" size={20} color="#0066cc" />
              <Text style={styles.infoText}>
                This is a demo. You can use the buttons below to send real SMS/Email using your device's apps.
              </Text>
            </View>
          </ScrollView>

          <View style={styles.actions}>
            {onSendSMS && (
              <TouchableOpacity style={styles.smsButton} onPress={onSendSMS}>
                <MaterialIcons name="sms" size={20} color="#fff" />
                <Text style={styles.buttonText}>Send Real SMS</Text>
              </TouchableOpacity>
            )}

            {onSendEmail && (
              <TouchableOpacity style={styles.emailButton} onPress={onSendEmail}>
                <MaterialIcons name="email" size={20} color="#fff" />
                <Text style={styles.buttonText}>Send Real Email</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  header: {
    backgroundColor: '#dc3545',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
  },
  content: {
    padding: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
    fontWeight: '600',
  },
  guardiansList: {
    marginBottom: 20,
  },
  guardianItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  guardianInfo: {
    marginLeft: 10,
    flex: 1,
  },
  guardianName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  guardianContact: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  alertDetails: {
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#856404',
    width: 100,
  },
  detailValue: {
    fontSize: 14,
    color: '#856404',
    flex: 1,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#e7f3ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  infoText: {
    fontSize: 13,
    color: '#0066cc',
    marginLeft: 10,
    flex: 1,
    lineHeight: 18,
  },
  actions: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  smsButton: {
    flexDirection: 'row',
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emailButton: {
    flexDirection: 'row',
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  closeButton: {
    backgroundColor: '#6c757d',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DemoAlertDialog;
