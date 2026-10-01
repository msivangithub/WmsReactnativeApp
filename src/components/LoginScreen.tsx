import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ImageBackground,
  Dimensions,
  ToastAndroid,
} from "react-native";
import retailcliq from '../components/assests/retailcliqlogin.png';
import axios from "axios";
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useApi } from "./APIcontext";
import UrlModal from './usesetting.tsx';

interface LoginScreenProps {
  setAuth: (auth: boolean) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ setAuth }) => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [isUrlModalVisible, setIsUrlModalVisible] = useState<boolean>(false);
  const { API_URL, setCounterId, setUserlevel, setUnit } = useApi();

  const validateInputs = () => {
    if (!username) {
      ToastAndroid.show("Username is required!", ToastAndroid.LONG);
      return false;
    }
    if (!password) {
      ToastAndroid.show("Password is required!", ToastAndroid.LONG);
      return false;
    }
    return true;
  };

  const encryptDecrypt = (text: string): string => {
    try {
      let result = "";
      for (let i = 0; i < text.length; i++) {
        let charCode = text.charCodeAt(i);
        if (charCode < 128) {
          result += String.fromCharCode(charCode + 128);
        } else if (charCode > 128) {
          result += String.fromCharCode(charCode - 128);
        }
      }
      return result;
    } catch (error) {
      console.error("Error in encryptDecrypt function:", error);
      return text;
    }
  };

  const handleLogin = async (
    username: string,
    password: string,
    setAuth: (authState: boolean) => void
  ): Promise<void> => {
    if (!validateInputs()) return;
    setLoading(true);
    try {
      const encryptedPassword = encodeURIComponent(encryptDecrypt(password));
      const apiUrl = `${API_URL}/api/LRReceipt/api/V1/LoginDetails?UserName=${username}&UserPassword=${encryptedPassword}`;
      console.log("API URL:", apiUrl);

      const response = await axios.get(apiUrl);

      console.log("API Response:", response);

      if (
        response.status >= 200 &&
        response.status < 300 &&
        response.data?.message?.toLowerCase().includes("success")
      ) {
        setAuth(true);
        const counterId = response.data.counterId;
        const userlevel = response.data.userLevel || '';
        const unit = response.data.unit || '';
        setCounterId(counterId);
        setUserlevel(userlevel);
        setUnit(unit);
        ToastAndroid.show(`Logged in as ${username}`, ToastAndroid.SHORT);
        console.log("Login successful for:", username);
      } else {
        throw new Error(response.data?.message || "Invalid login credentials.");
      }
    } catch (error) {
      console.error("Login Error:", error);
      const errorMessage =
        axios.isAxiosError(error)
          ? error.response?.data?.message || "Invalid login credentials."
          : error instanceof Error
          ? error.message
          : "Something went wrong. Please check your connection.";
      ToastAndroid.show(`${errorMessage}, Check Username and Password`, ToastAndroid.LONG);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../components/assests/login_back5.png')}
        style={styles.backgroundImage}
        resizeMode="stretch"
      >
        <TouchableOpacity
          style={styles.settingsIconContainer}
          onPress={() => setIsUrlModalVisible(true)}
        >
          <Icon name="settings" size={30} color="white" />
        </TouchableOpacity>

        <View style={styles.contentContainer}>
          <Text style={styles.title}>SIGN IN</Text>

          <View style={styles.inputContainer}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>👤</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="rgba(255, 255, 255, 0.3)"
              value={username}
              onChangeText={setUsername}
            />
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>🔒</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="rgba(255, 255, 255, 0.3)"
              secureTextEntry={!isPasswordVisible}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              style={styles.eyeIconContainer}
              onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            >
              <Icon
                name={isPasswordVisible ? "visibility" : "visibility-off"}
                size={24}
                color="white"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.disabledButton]}
            onPress={() => handleLogin(username, password, setAuth)}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>
              {loading ? "LOGGING IN" : "LOGIN"}
            </Text>
          </TouchableOpacity>
        </View>

        <Image
          source={retailcliq}
          style={styles.brandLogo}
          resizeMode="contain"
        />

        {isUrlModalVisible && (
          <View style={styles.modalContainer}>
            <UrlModal onBack={() => setIsUrlModalVisible(false)} />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsUrlModalVisible(false)}
            >
              <Icon name="close" size={30} color="white" />
            </TouchableOpacity>
          </View>
        )}
      </ImageBackground>
    </View>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    position: 'absolute',
    width: '100%',
    height: "100%",
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "white",
    marginBottom: 40,
    textDecorationLine: 'underline',
  },
  inputContainer: {
    flexDirection: "row",
    width: "85%",
    height: 50,
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 8,
    marginBottom: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
  },
  iconContainer: {
    width: 50,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "rgba(255, 255, 255, 0.2)",
  },
  icon: {
    fontSize: 10,
    color: "white",
  },
  input: {
    flex: 1,
    height: "100%",
    color: "white",
    fontSize: 16,
    paddingHorizontal: 15,
    borderColor: 'white',
  },
  eyeIconContainer: {
    width: 50,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  loginButton: {
    width: "40%",
    height: 45,
    backgroundColor: "rgba(0, 119, 204, 0.7)",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    elevation: 3,
    alignSelf: "center",
    borderWidth: 1,
    borderColor: 'white',
  },
  loginButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  disabledButton: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    opacity: 0.6,
  },
  brandLogo: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 250,
    height: 80,
  },
  settingsIconContainer: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
  },
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 5,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
  },
});

export default LoginScreen;
