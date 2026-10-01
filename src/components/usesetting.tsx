import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  Animated,
  Easing,
  BackHandler,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Feather';
import UrlModal from './urlModal';
import { useApi } from '../components/APIcontext';
import UserPrivileges from '../components/UserPrivileges';

const UserSettings: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [isModalVisible, setModalVisible] = useState<boolean>(false);
  const [showPrivileges, setShowPrivileges] = useState<boolean>(false);
  const { API_URL, updateApiUrl, userlevel } = useApi();
  const [editScaleAnim] = useState(new Animated.Value(1));
  const [privilegesScaleAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    const loadStoredUrl = async () => {
      try {
        const storedUrl = await AsyncStorage.getItem('API_URL');
        if (storedUrl && storedUrl !== API_URL) {
          updateApiUrl(storedUrl);
        }
      } catch (error) {
        console.error('Failed to load URL from AsyncStorage:', error);
      }
    };
    loadStoredUrl();
  }, [updateApiUrl]);

  useEffect(() => {
    const backAction = () => {
      if (showPrivileges) {
        setShowPrivileges(false);
        return true;
      }
      onBack();
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [onBack, showPrivileges]);

  const handleEditApiPress = () => {
    Animated.sequence([
      Animated.timing(editScaleAnim, {
        toValue: 0.9,
        duration: 100,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.timing(editScaleAnim, {
        toValue: 1,
        duration: 100,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
    ]).start();
    setModalVisible(true);
  };

  const handleEditPrivilegesPress = () => {
    Animated.sequence([
      Animated.timing(privilegesScaleAnim, {
        toValue: 0.9,
        duration: 100,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.timing(privilegesScaleAnim, {
        toValue: 1,
        duration: 100,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
    ]).start();
    setShowPrivileges(true);
  };

  const handleCancel = () => {
    if (showPrivileges) {
      setShowPrivileges(false);
    } else {
      onBack();
    }
  };

  const displayUrl = API_URL ? API_URL.replace(/^https?:\/\//, '') : 'Not set';

  console.log('API_URL:', API_URL);
  console.log('Userlevel:', userlevel);

  if (showPrivileges) {
    return <UserPrivileges onBack={() => setShowPrivileges(false)} />;
  }

  return (
    <View style={styles.fullScreenContainer}>
      <View style={styles.container}>
        <Text style={styles.header}>Configuration Settings</Text>

        {/* API Configuration Card */}
        <View style={styles.card}>
          <View style={styles.configHeader}>
            <Text style={styles.subHeader}>API Configuration</Text>
            <Animated.View style={[styles.editIconContainer, { transform: [{ scale: editScaleAnim }] }]}>
              <TouchableOpacity
                onPress={handleEditApiPress}
                style={styles.editIcon}
                accessibilityLabel="Edit API URL"
              >
                <Icon name="edit-2" size={20} color="#3949AB" />
              </TouchableOpacity>
            </Animated.View>
          </View>
          <Text style={styles.apiText}>
            Connected to: <Text style={styles.apiUrl}>{displayUrl}</Text>
          </Text>
        </View>

        {/* User Privileges Card - only show if userlevel === '5' */}
        {userlevel === '5' && (
          <View style={styles.card}>
            <View style={styles.configHeader}>
              <Text style={styles.subHeader}>User Privileges</Text>
              <Animated.View style={[styles.editIconContainer, { transform: [{ scale: privilegesScaleAnim }] }]}>
                <TouchableOpacity
                  onPress={handleEditPrivilegesPress}
                  style={styles.editIcon}
                  accessibilityLabel="Edit User Privileges"
                >
                  <Icon name="edit-2" size={20} color="#3949AB" />
                </TouchableOpacity>
              </Animated.View>
            </View>
            <Text style={styles.apiText}>
              Status: <Text style={styles.apiUrl}>View or modify privileges</Text>
            </Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={onBack}
            style={[styles.button, styles.dashboardButton]}
            activeOpacity={0.7}
            accessibilityLabel="Go to Home button"
          >
            <Text style={styles.buttonText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleCancel}
            style={[styles.button, styles.cancelButton]}
            activeOpacity={0.7}
            accessibilityLabel="Cancel button"
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <UrlModal isModalVisible={isModalVisible} setModalVisible={setModalVisible} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  container: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
  },
  header: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 0.5,
    textDecorationLine: 'underline',
  },
  card: {
    width: '85%',
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    marginBottom: 20,
  },
  configHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  subHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  editIconContainer: {
    marginLeft: 10,
  },
  editIcon: {
    padding: 10,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  apiText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  apiUrl: {
    fontWeight: '500',
    color: '#4B5EAA',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '85%',
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  dashboardButton: {
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
    letterSpacing: 0.5,
  },
});

export default UserSettings;
