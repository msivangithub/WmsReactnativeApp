import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet, 
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { Camera } from 'react-native-camera-kit';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import Sound from 'react-native-sound';

interface BarcodeScannerProps {
  visible: boolean;
  onScan: (code: string) => void;
  onClose: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ visible, onScan, onClose }) => {
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [permissionStatus, setPermissionStatus] = useState<'loading' | 'granted' | 'denied'>(
    'loading'
  );
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);

  // Initialize sound
  const playBeepSound = () => {
    const beep = new Sound('beep.mp3', Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.log('Failed to load the sound', error);
        return;
      }
      // Play the sound
      beep.play((success) => {
        if (success) {
          console.log('Beep sound played successfully');
        } else {
          console.log('Playback failed due to audio decoding errors');
        }
        // Release the audio player resource
        beep.release();
      });
    });
  };

  useEffect(() => {
    const requestCameraPermission = async () => {
      try {
        const permission =
          Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA;
        const result = await check(permission);

        if (result === RESULTS.GRANTED) {
          setHasPermission(true);
          setPermissionStatus('granted');
        } else {
          const requestResult = await request(permission);
          if (requestResult === RESULTS.GRANTED) {
            setHasPermission(true);
            setPermissionStatus('granted');
          } else {
            setHasPermission(false);
            setPermissionStatus('denied');
            Alert.alert(
              'Camera Permission Denied',
              'Please enable camera access in your device settings to scan barcodes.',
              [
                { text: 'Cancel', onPress: onClose, style: 'cancel' },
                {
                  text: 'Open Settings',
                  onPress: () => Linking.openSettings(),
                },
              ]
            );
          }
        }
      } catch (error) {
        console.error('Error requesting camera permission:', error);
        setPermissionStatus('denied');
        Alert.alert('Error', 'Failed to request camera permission.', [
          { text: 'OK', onPress: onClose },
        ]);
      }
    };

    if (visible) {
      requestCameraPermission();
    }
  }, [visible, onClose]);

  const handleBarcodeRead = (event: any) => {
    const scannedCode = event.nativeEvent.codeStringValue?.trim();
    if (scannedCode && isScanning && scannedCode !== lastScannedCode) {
      setIsScanning(false); 
      setLastScannedCode(scannedCode);
      console.log('Barcode scanned:', scannedCode);
      
      // Play beep sound on successful scan
      playBeepSound();
      
      onScan(scannedCode); 

      setTimeout(() => {
        setIsScanning(true);
        setLastScannedCode(null); 
      }, 2000); 
    }
  };

  if (!visible) {
    return null;
  }

  if (permissionStatus === 'loading') {
    return (
      <View style={styles.container}>
        <Text style={styles.messageText}>Checking camera permission...</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Camera permission is required to scan barcodes.</Text>
        <TouchableOpacity style={styles.button} onPress={() => Linking.openSettings()}>
          <Text style={styles.buttonText}>Open Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
          <Text style={styles.buttonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        <Camera
          style={styles.camera}
          scanBarcode={true}
          onReadCode={handleBarcodeRead}
          showFrame={true}
          laserColor="red"
          frameColor="white"
        />
      </View>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={onClose}
        >
          <Text style={styles.buttonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraContainer: {
    width: 250,
    height: 100,
    overflow: 'hidden',
    borderRadius: 10,
    borderColor: '#fff',
  },
  camera: {
    flex: 1,
    width: 250,
    height: 80,
  },
  overlay: {
    position: 'absolute',
    bottom: 170,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  messageText: {
    color: '#333',
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 10,
  },
  cancelButton: {
    backgroundColor: '#FF4444',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default BarcodeScanner;