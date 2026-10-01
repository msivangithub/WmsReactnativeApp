import React, { useState } from "react";
import { View, TouchableOpacity, Text, Image, StyleSheet, PermissionsAndroid, Alert, Platform } from "react-native";
import { launchCamera, launchImageLibrary } from "react-native-image-picker";

const CameraGalleryUpload = ({ onImageSelected }) => {
  const [imageUri, setImageUri] = useState(null);
  const [showButtons, setShowButtons] = useState(false);

  const requestCameraPermission = async () => {
    if (Platform.OS === "android") {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: "Camera Permission",
            message: "This app requires access to your camera",
            buttonPositive: "OK",
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true; 
  };

  const openCamera = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert("Permission Denied", "You need to grant camera permission to use this feature.");
      return;
    }

    const response = await launchCamera({ mediaType: "photo", saveToPhotos: true });
    if (response.assets?.length > 0) {
      setImageUri(response.assets[0].uri);
      onImageSelected(response.assets[0].uri);
      setShowButtons(false);
    } else if (response.errorMessage) {
      console.log("Camera Error:", response.errorMessage);
    }
  };

  const openGallery = async () => {
    const response = await launchImageLibrary({ mediaType: "photo" });
    if (response.assets?.length > 0) {
      setImageUri(response.assets[0].uri);
      onImageSelected(response.assets[0].uri);
      setShowButtons(false);
    } else if (response.errorMessage) {
      console.log("Gallery Error:", response.errorMessage);
    }
  };

  return (
    <View style={styles.container}>
      {!showButtons ? (
        <TouchableOpacity style={styles.button} onPress={() => setShowButtons(true)}>
          <Text style={styles.attachbutton}>Attach Files  + </Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={openCamera}>
          <Text style={styles.buttonText}>Capture Image</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={openGallery}>
          <Text style={styles.buttonText}>Upload from Gallery</Text>
        </TouchableOpacity>
      </View>
      )}
      {imageUri && <Image source={{ uri: imageUri }} style={styles.image} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10,
  },
  button: {
    backgroundColor: "#007BFF",
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
  },
  buttonContainer: {
    flexDirection: "row",  
    gap: 10,  
  },
  attachbutton:{
    color: "#fff",
    fontSize: 16,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
  image: {
    width: 200,
    height: 200,
    marginTop: 10,
    borderRadius: 5,
  },
});

export default CameraGalleryUpload;