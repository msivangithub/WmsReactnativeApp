import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Alert,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApi } from './APIcontext';

interface UrlModalProps {
  isModalVisible: boolean;
  setModalVisible: (visible: boolean) => void;
}

const UrlModal: React.FC<UrlModalProps> = ({ isModalVisible, setModalVisible }) => {
  const { API_URL, updateApiUrl } = useApi();
  const [url, setUrl] = useState<string>(API_URL);
  const [loading, setLoading] = useState<boolean>(false);

  // Load stored URL from AsyncStorage on component mount
  useEffect(() => {
    const loadStoredUrl = async () => {
      try {
        const storedUrl = await AsyncStorage.getItem('API_URL');
        if (storedUrl) {
          setUrl(storedUrl);
          updateApiUrl(storedUrl); // Update context with stored URL
        } else {
          setUrl(API_URL); // Fallback to context API_URL
        }
      } catch (error) {
        console.error('Failed to load URL from AsyncStorage:', error);
      }
    };
    loadStoredUrl();
  }, [API_URL, updateApiUrl]);

  const validateUrl = (inputUrl: string): boolean => {
    try {
      new URL(inputUrl);
      return true;
    } catch {
      return false;
    }
  };

  const handleSaveUrl = async (): Promise<void> => {
    if (!url.trim()) {
      Alert.alert('Error', 'URL cannot be empty');
      return;
    }

    const formattedUrl = url.includes('://') ? url : `http://${url}`;

    if (!validateUrl(formattedUrl)) {
      Alert.alert('Error', 'Please enter a valid URL');
      return;
    }

    try {
      setLoading(true);
      await updateApiUrl(formattedUrl); // Update context
      await AsyncStorage.setItem('API_URL', formattedUrl); // Save to AsyncStorage
      setModalVisible(false);
      Alert.alert('Success', 'The URL has been updated successfully');
      console.log('Updated URL:', formattedUrl);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to update the URL'
      );
      console.error('Failed to save URL:', error);
    } finally {
      setLoading(false);
    }
  };

  console.log('API_URL:', API_URL);

  return (
    <Modal
      visible={isModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setModalVisible(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalHeader}>Update API URL</Text>
          <TextInput
            style={styles.settingInput}
            placeholder="Enter new URL"
            placeholderTextColor="#8A8A8A"
            onChangeText={setUrl}
            value={url}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            editable={!loading}
            returnKeyType="done"
            onSubmitEditing={handleSaveUrl}
            accessibilityLabel="API URL input"
          />
          {loading ? (
            <ActivityIndicator size="large" color="#3949AB" style={styles.loader} />
          ) : (
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.updateButton]}
                onPress={handleSaveUrl}
                disabled={loading || !url.trim()}
                activeOpacity={0.7}
                accessibilityLabel="Update URL button"
              >
                <Text style={styles.buttonText}>Update</Text>
              </TouchableOpacity>
              <View style={styles.buttonSpacer} />
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
                disabled={loading}
                activeOpacity={0.7}
                accessibilityLabel="Cancel button"
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    width: '85%',
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  modalHeader: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  settingInput: {
    width: '100%',
    height: 48,
    borderColor: '#D1D5DB',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#1A1A1A',
    marginBottom: 20,
    backgroundColor: '#F5F7FA',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  updateButton: {
    backgroundColor: '#3949AB',
  },
  cancelButton: {
    backgroundColor: '#6B7280',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonSpacer: {
    width: 16,
  },
  loader: {
    marginVertical: 20,
  },
});

export default UrlModal;