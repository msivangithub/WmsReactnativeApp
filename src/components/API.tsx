import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Modal,
  View,
  TextInput,
  Button,
  Alert,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import {API_URL_STORAGE_KEY, DEFAULT_API_URL } from '../components/api2.tsx';

interface APIUrlManagerProps {
  isModalVisible: boolean;
  setModalVisible: (visible: boolean) => void;
  onUrlChange: (url: string) => void;
}

// // Create a constant for the storage key
// const API_URL_STORAGE_KEY = '@api_base_url';
// const DEFAULT_API_URL = 'http://120.138.9.33:5000';

const APIUrlManager: React.FC<APIUrlManagerProps> = ({ 
  isModalVisible, 
  setModalVisible, 
  onUrlChange 
}) => {
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState('');
  
  // Load saved API URL on component mount
  useEffect(() => {
    loadSavedApiUrl();
  }, []);

  // Load the saved API URL from AsyncStorage
  const loadSavedApiUrl = async () => {
    try {
      const savedUrl = await AsyncStorage.getItem(API_URL_STORAGE_KEY);
      if (savedUrl) {
        setUrl(savedUrl);
        onUrlChange(savedUrl);
      } else {
        setUrl(DEFAULT_API_URL);
        onUrlChange(DEFAULT_API_URL);
      }
    } catch (error) {
      console.error('Error loading saved API URL:', error);
      setUrl(DEFAULT_API_URL);
      onUrlChange(DEFAULT_API_URL);
    }
  };

  // Save the new API URL
  const handleSaveUrl = async () => {
    if (!url.trim()) {
      Alert.alert('Error', 'Please enter a valid URL');
      return;
    }

    try {
      setLoading(true);
      
      // Validate URL format
      new URL(url); // This will throw an error if URL is invalid
      
      // Save to AsyncStorage
      await AsyncStorage.setItem(API_URL_STORAGE_KEY, url);
      
      // Update the URL in parent component
      onUrlChange(url);
      
      setModalVisible(false);
      Alert.alert('Success', 'The API URL has been updated successfully');
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Error', 'Please enter a valid URL format');
      } else {
        Alert.alert('Error', 'Failed to save the API URL');
      }
      console.error('Error saving API URL:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={isModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setModalVisible(false)}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <TextInput
            style={styles.input}
            placeholder="Enter new API URL"
            onChangeText={setUrl}
            value={url}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          {loading ? (
            <ActivityIndicator size="small" color="#0000ff" />
          ) : (
            <View style={styles.buttonContainer}>
              <Button title="Save" onPress={handleSaveUrl} disabled={loading} />
              <Button 
                title="Cancel" 
                onPress={() => setModalVisible(false)} 
                disabled={loading}
              />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
});

export default APIUrlManager;