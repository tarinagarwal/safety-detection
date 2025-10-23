import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

interface Guardian {
  id: string;
  name: string;
  phone: string;
  email?: string;
  relationship: string;
}

const GuardiansScreen = () => {
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingGuardian, setEditingGuardian] = useState<Guardian | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    relationship: '',
  });

  useEffect(() => {
    loadGuardians();
  }, []);

  const loadGuardians = async () => {
    try {
      setLoading(true);
      // Demo mode: Load from local storage
      const storedGuardians = await AsyncStorage.getItem('demo_guardians');
      if (storedGuardians) {
        setGuardians(JSON.parse(storedGuardians));
      } else {
        setGuardians([]);
      }
    } catch (error) {
      console.error('Load guardians error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load guardians',
      });
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingGuardian(null);
    setFormData({ name: '', phone: '', email: '', relationship: '' });
    setModalVisible(true);
  };

  const openEditModal = (guardian: Guardian) => {
    setEditingGuardian(guardian);
    setFormData({
      name: guardian.name,
      phone: guardian.phone,
      email: guardian.email || '',
      relationship: guardian.relationship,
    });
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingGuardian(null);
    setFormData({ name: '', phone: '', email: '', relationship: '' });
  };

  const saveGuardian = async () => {
    if (!formData.name.trim() || !formData.phone.trim() || !formData.relationship.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      // Demo mode: Save to local storage
      let updatedGuardians = [...guardians];
      
      if (editingGuardian) {
        // Update existing guardian
        updatedGuardians = updatedGuardians.map(g => 
          g.id === editingGuardian.id 
            ? { ...g, ...formData }
            : g
        );
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Guardian updated successfully',
        });
      } else {
        // Add new guardian
        const newGuardian: Guardian = {
          id: `guardian-${Date.now()}`,
          ...formData,
        };
        updatedGuardians.push(newGuardian);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Guardian added successfully',
        });
      }

      await AsyncStorage.setItem('demo_guardians', JSON.stringify(updatedGuardians));
      closeModal();
      loadGuardians();
    } catch (error: any) {
      console.error('Save guardian error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to save guardian',
      });
    }
  };

  const deleteGuardian = (guardian: Guardian) => {
    Alert.alert(
      'Delete Guardian',
      `Are you sure you want to delete ${guardian.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Demo mode: Delete from local storage
              const updatedGuardians = guardians.filter(g => g.id !== guardian.id);
              await AsyncStorage.setItem('demo_guardians', JSON.stringify(updatedGuardians));
              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Guardian deleted successfully',
              });
              loadGuardians();
            } catch (error) {
              console.error('Delete guardian error:', error);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to delete guardian',
              });
            }
          },
        },
      ]
    );
  };

  const renderGuardian = ({ item }: { item: Guardian }) => (
    <View style={styles.guardianCard}>
      <View style={styles.guardianInfo}>
        <Text style={styles.guardianName}>{item.name}</Text>
        <Text style={styles.guardianRelationship}>{item.relationship}</Text>
        <View style={styles.contactInfo}>
          <MaterialIcons name="phone" size={16} color="#28a745" />
          <Text style={styles.guardianPhone}> {item.phone}</Text>
        </View>
        {item.email && (
          <View style={styles.contactInfo}>
            <MaterialIcons name="email" size={16} color="#3498db" />
            <Text style={styles.guardianEmail}> {item.email}</Text>
          </View>
        )}
      </View>

      <View style={styles.guardianActions}>
        <TouchableOpacity style={styles.editButton} onPress={() => openEditModal(item)}>
          <MaterialIcons name="edit" size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={() => deleteGuardian(item)}>
          <MaterialIcons name="delete" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialIcons name="people" size={80} color="#ccc" />
      <Text style={styles.emptyStateText}>No guardians added yet</Text>
      <Text style={styles.emptyStateSubtext}>
        Add trusted contacts who will receive emergency alerts
      </Text>
      <TouchableOpacity style={styles.addFirstButton} onPress={openAddModal}>
        <Text style={styles.addFirstButtonText}>Add Your First Guardian</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#dc3545" />
          <Text style={styles.loadingText}>Loading guardians...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Emergency Guardians</Text>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <MaterialIcons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={guardians}
        renderItem={renderGuardian}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyState}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {editingGuardian ? 'Edit Guardian' : 'Add Guardian'}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Enter guardian's name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number *</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email (Optional)</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="Enter email address"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Relationship *</Text>
              <TextInput
                style={styles.input}
                value={formData.relationship}
                onChangeText={(text) => setFormData({ ...formData, relationship: text })}
                placeholder="e.g., Parent, Spouse, Friend"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveButton} onPress={saveGuardian}>
                <Text style={styles.saveButtonText}>
                  {editingGuardian ? 'Update' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addButton: {
    backgroundColor: '#28a745',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
  guardianCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  guardianInfo: {
    flex: 1,
  },
  guardianName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  guardianRelationship: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  guardianPhone: {
    fontSize: 14,
    color: '#28a745',
  },
  guardianEmail: {
    fontSize: 14,
    color: '#3498db',
  },
  guardianActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#3498db',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 30,
    paddingHorizontal: 40,
  },
  addFirstButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },
  addFirstButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#6c757d',
    padding: 15,
    borderRadius: 8,
    marginRight: 10,
  },
  cancelButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 8,
    marginLeft: 10,
  },
  saveButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default GuardiansScreen;
