import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, BackHandler } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import InWardStock from '../components/Inwardstock';
import InWardStockIC from '../components/InWardStock(IC)';
import InWardStockPW from '../components/InWarStockpacket'; 

interface ScreenSelector {
  onBack: () => void;
}

const ScreenSelector: React.FC<ScreenSelector> = ({ onBack }) => {
  const [selectedScreen, setSelectedScreen] = useState<'InWardStock' | 'InWardStockIC' | 'InWardStockPW'>('InWardStock');
  const navigation = useNavigation();

  const handleRadioSelect = (screen: 'InWardStock' | 'InWardStockIC' | 'InWardStockPW') => {
    setSelectedScreen(screen);
  };

  const handleBack = () => {
    if (selectedScreen !== 'InWardStock') {
      setSelectedScreen('InWardStock');
      return true;
    } else {
      onBack();
      return true;
    }
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBack);
    return () => backHandler.remove();
  }, [selectedScreen, navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.radioContainer}>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => handleRadioSelect('InWardStock')}
        >
          <View style={selectedScreen === 'InWardStock' ? styles.radioSelected : styles.radioUnselected} />
          <View style={styles.radioTextContainer}>
            <Text style={styles.radioText}>LTWise</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => handleRadioSelect('InWardStockPW')}
        >
          <View style={selectedScreen === 'InWardStockPW' ? styles.radioSelected : styles.radioUnselected} />
          <View style={styles.radioTextContainer}>
            <Text style={styles.radioText}>Packet Wise</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => handleRadioSelect('InWardStockIC')}
        >
          <View style={selectedScreen === 'InWardStockIC' ? styles.radioSelected : styles.radioUnselected} />
          <View style={styles.radioTextContainer}>
            <Text style={styles.radioText}>ItemWise</Text>
          </View>
        </TouchableOpacity>
      </View>
      <View style={styles.screenContainer}>
        {selectedScreen === 'InWardStock' && <InWardStock onBack={handleBack} />}
        {selectedScreen === 'InWardStockIC' && <InWardStockIC onBack={handleBack} />}
        {selectedScreen === 'InWardStockPW' && <InWardStockPW onBack={handleBack} />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
    backgroundColor: '#f5f5f5',
  },
  radioContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  radioSelected: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  radioUnselected: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#007AFF',
    backgroundColor: 'transparent',
  },
  radioTextContainer: {
    marginLeft: 10,
    flexShrink: 1,
  },
  radioText: {
    fontSize: 16,
    color: '#333',
  },
  screenContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
});

export default ScreenSelector;