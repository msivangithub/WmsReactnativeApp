import React, { useState, useEffect } from "react";
import { SafeAreaView, StatusBar, StyleSheet } from "react-native";
import LoginScreen from "./src/components/LoginScreen";
import MainFile from "./src/components/Mainfile";
import { ApiProvider } from "./src/components/APIcontext";
import { NavigationContainer } from "@react-navigation/native";
import RNFS from 'react-native-fs';
import { request, PERMISSIONS } from 'react-native-permissions';

// Function to save error to file
const saveErrorToFile = async (error: Error) => {
  try {
    // Request storage permission
    const hasPermission = await request(PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE);
    if (hasPermission !== 'granted') {
      console.log('Storage permission denied');
      return;
    }
    console.log('Storage permission Granted');
    // File path in Downloads folder
    const filePath = `${RNFS.DownloadDirectoryPath}/error_log.txt`;
    console.log(filePath);
    // Format error details
    const timestamp = new Date().toISOString();
    const errorDetails = `
      Timestamp: ${timestamp}
      Error Message: ${error.message}
      Stack Trace: ${error.stack}
      --------------------
    `;

    // Append to file (or create if it doesn't exist)
    await RNFS.appendFile(filePath, errorDetails, 'utf8');
    console.log('Error saved to:', filePath);
  } catch (fileError: unknown) {
    // Type guard to check if fileError is an Error
    const errorMessage = fileError instanceof Error ? fileError.message : String(fileError);
    console.error('Failed to save error to file:', errorMessage);
  }
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    // Set up global error handler
    const originalHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
      // Save error to file
      saveErrorToFile(error);
      // Call original handler
      originalHandler && originalHandler(error, isFatal);
    });
  }, [saveErrorToFile]);

  return (
    <ApiProvider>
      <NavigationContainer>
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="dark-content" />
          {isAuthenticated ? (
            <MainFile setAuth={setIsAuthenticated} />
          ) : (
            <LoginScreen setAuth={setIsAuthenticated} />
          )}
        </SafeAreaView>
      </NavigationContainer>
    </ApiProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});

export default App;